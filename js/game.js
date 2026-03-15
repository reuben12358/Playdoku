const STORAGE_KEY = 'playdoku_state';
const STATS_KEY = 'playdoku_stats';

export class GameState {
  constructor(puzzle) {
    this.puzzle = puzzle;
    this.maxGuesses = 9;
    this.cells = {}; // "r,c" => { correct: bool, playerName: string }
    this.guessesUsed = 0;

    this.loadState();
  }

  getStorageDate() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.date === this.getStorageDate() && saved.seed === this.puzzle.seed) {
        this.cells = saved.cells || {};
        this.guessesUsed = saved.guessesUsed || 0;
      }
    } catch (e) {
      // ignore
    }
  }

  saveState() {
    const data = {
      date: this.getStorageDate(),
      seed: this.puzzle.seed,
      cells: this.cells,
      guessesUsed: this.guessesUsed,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  makeGuess(row, col, playerName, isCorrect) {
    const key = `${row},${col}`;
    if (this.cells[key]) return; // already guessed
    if (this.guessesUsed >= this.maxGuesses) return;

    this.cells[key] = { correct: isCorrect, playerName };
    this.guessesUsed++;
    this.saveState();

    if (this.isComplete()) {
      this.updateStats();
    }
  }

  getCellState(row, col) {
    return this.cells[`${row},${col}`] || null;
  }

  getGuessesRemaining() {
    return this.maxGuesses - this.guessesUsed;
  }

  getScore() {
    return Object.values(this.cells).filter(c => c.correct).length;
  }

  isComplete() {
    return this.guessesUsed >= this.maxGuesses;
  }

  updateStats() {
    const stats = this.getStats();
    const today = this.getStorageDate();

    if (stats.lastDate === today) return; // already recorded

    stats.played++;
    stats.totalCorrect += this.getScore();

    if (this.getScore() === 9) {
      stats.streak++;
      if (stats.streak > stats.bestStreak) {
        stats.bestStreak = stats.streak;
      }
    } else {
      stats.streak = 0;
    }

    stats.lastDate = today;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  getStats() {
    try {
      const saved = JSON.parse(localStorage.getItem(STATS_KEY));
      if (saved) return saved;
    } catch (e) {
      // ignore
    }
    return { played: 0, totalCorrect: 0, streak: 0, bestStreak: 0, lastDate: null };
  }
}
