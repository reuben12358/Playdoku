import { generatePuzzle, getPuzzleNumber } from './puzzle.js';
import { GameState } from './game.js';
import { showToast } from './utils.js';

let players = [];
let puzzle = null;
let game = null;
let selectedCell = null;

async function init() {
  const res = await fetch('data/players.json');
  players = await res.json();

  // Remove duplicates by name (keep first occurrence)
  const seen = new Set();
  players = players.filter(p => {
    const key = p.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  puzzle = generatePuzzle(players);
  game = new GameState(puzzle);

  renderPuzzleNumber();
  renderGrid();
  updateGuessesDisplay();
  setupModals();

  if (game.isComplete()) {
    showShareButton();
  }
}

function renderPuzzleNumber() {
  document.getElementById('puzzle-number').textContent = `Puzzle #${getPuzzleNumber()}`;
}

function renderGrid() {
  const container = document.getElementById('grid-container');
  container.innerHTML = '';

  // Corner cell
  const corner = document.createElement('div');
  corner.className = 'grid-corner';
  container.appendChild(corner);

  // Column headers
  puzzle.cols.forEach(cat => {
    const header = document.createElement('div');
    header.className = 'grid-header col-header';
    header.innerHTML = `<span class="header-emoji">${cat.emoji}</span><span class="header-text">${cat.label}</span>`;
    container.appendChild(header);
  });

  // Rows
  puzzle.rows.forEach((rowCat, r) => {
    // Row header
    const rowHeader = document.createElement('div');
    rowHeader.className = 'grid-header row-header';
    rowHeader.innerHTML = `<span class="header-emoji">${rowCat.emoji}</span><span class="header-text">${rowCat.label}</span>`;
    container.appendChild(rowHeader);

    // Cells
    puzzle.cols.forEach((colCat, c) => {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;

      const state = game.getCellState(r, c);
      if (state) {
        if (state.correct) {
          cell.classList.add('correct');
          cell.innerHTML = `<span class="cell-player">${state.playerName}</span>`;
        } else {
          cell.classList.add('incorrect', 'locked');
          cell.innerHTML = `<span class="cell-player" style="color:var(--incorrect)">✗</span>`;
        }
      } else if (game.isComplete()) {
        cell.classList.add('locked');
        cell.innerHTML = `<span class="cell-plus">-</span>`;
      } else {
        cell.innerHTML = `<span class="cell-plus">+</span>`;
        cell.addEventListener('click', () => openSearch(r, c));
      }

      container.appendChild(cell);
    });
  });
}

function openSearch(row, col) {
  if (game.isComplete()) return;

  selectedCell = { row, col };
  const rowCat = puzzle.rows[row];
  const colCat = puzzle.cols[col];

  document.getElementById('search-criteria').textContent = `${rowCat.label} + ${colCat.label}`;
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';

  const modal = document.getElementById('search-modal');
  modal.style.display = 'flex';

  setTimeout(() => {
    document.getElementById('search-input').focus();
  }, 100);
}

function setupSearch() {
  const input = document.getElementById('search-input');
  const resultsList = document.getElementById('search-results');
  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = input.value.trim().toLowerCase();
      resultsList.innerHTML = '';

      if (query.length < 2) return;

      const matches = players
        .filter(p => p.name.toLowerCase().includes(query))
        .slice(0, 15);

      matches.forEach(player => {
        const li = document.createElement('li');
        li.innerHTML = `${player.name}<span class="player-country">${player.country}</span>`;
        li.addEventListener('click', () => selectPlayer(player));
        resultsList.appendChild(li);
      });
    }, 150);
  });
}

function selectPlayer(player) {
  if (!selectedCell) return;

  const { row, col } = selectedCell;
  const rowCat = puzzle.rows[row];
  const colCat = puzzle.cols[col];

  const matchesRow = matchesCategory(player, rowCat);
  const matchesCol = matchesCategory(player, colCat);
  const isCorrect = matchesRow && matchesCol;

  game.makeGuess(row, col, player.name, isCorrect);

  closeModal('search-modal');
  renderGrid();
  updateGuessesDisplay();

  if (isCorrect) {
    showToast('Correct!');
  } else {
    showToast('Incorrect!');
  }

  if (game.isComplete()) {
    showShareButton();
    setTimeout(() => showGameOver(), 800);
  }

  selectedCell = null;
}

function matchesCategory(player, category) {
  switch (category.type) {
    case 'club':
      return player.clubs.some(c => c.toLowerCase() === category.value.toLowerCase());
    case 'country':
      return player.country.toLowerCase() === category.value.toLowerCase();
    case 'league':
      return player.leagues.some(l => l.toLowerCase() === category.value.toLowerCase());
    case 'position':
      return player.positions.some(p => p.toLowerCase() === category.value.toLowerCase());
    case 'award':
      return player.awards.some(a => a.toLowerCase() === category.value.toLowerCase());
    default:
      return false;
  }
}

function updateGuessesDisplay() {
  const remaining = game.getGuessesRemaining();
  document.getElementById('guesses-remaining').textContent = `${remaining} guess${remaining !== 1 ? 'es' : ''} remaining`;
}

function showShareButton() {
  document.getElementById('share-btn').style.display = 'inline-block';
}

function showGameOver() {
  const score = game.getScore();
  const modal = document.getElementById('gameover-modal');
  const title = document.getElementById('gameover-title');
  const message = document.getElementById('gameover-message');
  const grid = document.getElementById('gameover-grid');

  if (score === 9) {
    title.textContent = 'Perfect!';
    message.textContent = 'You got all 9 correct!';
  } else {
    title.textContent = 'Game Over!';
    message.textContent = `You got ${score} out of 9 correct.`;
  }

  grid.innerHTML = '';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cellDiv = document.createElement('div');
      cellDiv.className = 'gameover-cell';
      const state = game.getCellState(r, c);
      if (state && state.correct) {
        cellDiv.style.background = '#C8E6C9';
        cellDiv.textContent = '🟩';
      } else if (state && !state.correct) {
        cellDiv.style.background = '#FFCDD2';
        cellDiv.textContent = '🟥';
      } else {
        cellDiv.style.background = '#E0E0E0';
        cellDiv.textContent = '⬜';
      }
      grid.appendChild(cellDiv);
    }
  }

  modal.style.display = 'flex';
}

function shareResults() {
  const score = game.getScore();
  const num = getPuzzleNumber();
  let text = `Playdoku #${num} - ${score}/9\n`;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const state = game.getCellState(r, c);
      if (state && state.correct) text += '🟩';
      else if (state && !state.correct) text += '🟥';
      else text += '⬜';
    }
    text += '\n';
  }

  text += 'playdoku.github.io';

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!');
    });
  } else {
    showToast('Share not supported');
  }
}

function setupModals() {
  // Close modals
  document.querySelectorAll('.modal-overlay, .modal-close').forEach(el => {
    el.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });

  // Info modal
  document.getElementById('info-btn').addEventListener('click', () => {
    document.getElementById('info-modal').style.display = 'flex';
  });

  // Stats modal
  document.getElementById('stats-btn').addEventListener('click', () => {
    updateStatsDisplay();
    document.getElementById('stats-modal').style.display = 'flex';
  });

  // Share buttons
  document.getElementById('share-btn').addEventListener('click', shareResults);
  document.getElementById('gameover-share-btn').addEventListener('click', shareResults);

  // Search
  setupSearch();

  // Keyboard close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
  });
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function updateStatsDisplay() {
  const stats = game.getStats();
  document.getElementById('stat-played').textContent = stats.played;
  document.getElementById('stat-correct').textContent = stats.totalCorrect;
  document.getElementById('stat-streak').textContent = stats.streak;
  document.getElementById('stat-best').textContent = stats.bestStreak;
}

init();
