export class GameState {
  constructor(puzzle, sportId = 'football') {
    this.puzzle = puzzle;
    this.sportId = sportId;
    this.storageKey = `playdoku_state_${sportId}`;
    this.statsKey = `playdoku_stats_${sportId}`;
    this.cells = {};
    this.guessesUsed = 0;

    this.loadState();
  }

  getStorageDate() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey));
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
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  makeGuess(row, col, playerName, isCorrect) {
    const key = `${row},${col}`;
    // Allow retries on incorrect guesses, but lock correct ones
    if (this.cells[key]?.correct) return;

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

  isPlayerUsed(name) {
    const lower = name.toLowerCase();
    return Object.values(this.cells).some(c => c.correct && c.playerName.toLowerCase() === lower);
  }

  getScore() {
    return Object.values(this.cells).filter(c => c.correct).length;
  }

  isComplete() {
    const correctCount = Object.values(this.cells).filter(c => c.correct).length;
    return correctCount >= 9;
  }

  updateStats() {
    const stats = this.getStats();
    const today = this.getStorageDate();

    if (stats.lastDate === today) return;

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
    localStorage.setItem(this.statsKey, JSON.stringify(stats));
  }

  getStats() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.statsKey));
      if (saved) return saved;
    } catch (e) {
      // ignore
    }
    return { played: 0, totalCorrect: 0, streak: 0, bestStreak: 0, lastDate: null };
  }
}
