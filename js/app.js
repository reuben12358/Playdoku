import { generatePuzzle, getPuzzleNumber } from './puzzle.js';
import { GameState } from './game.js';
import { showToast } from './utils.js';
import { searchPlayersAPI } from './api.js';
import { SPORTS } from './sports.js';

let players = [];
let puzzle = null;
let game = null;
let selectedCell = null;
let currentSport = null;

function renderHeaderContent(cat) {
  if (cat.flag) {
    return `<img class="header-flag" src="https://flagcdn.com/w80/${cat.flag}.png" alt="${cat.label}">`;
  }
  return `<span class="header-emoji">${cat.emoji}</span><span class="header-text">${cat.label}</span>`;
}

async function init(sportId) {
  const sport = SPORTS[sportId];
  if (!sport) return;
  currentSport = sport;

  // Apply theme
  document.documentElement.style.setProperty('--primary', sport.theme.primary);
  document.documentElement.style.setProperty('--primary-light', sport.theme.primaryLight);
  document.documentElement.style.setProperty('--primary-dark', sport.theme.primaryDark);

  // Load player data
  const res = await fetch(sport.dataFile);
  players = await res.json();

  // Remove duplicates
  const seen = new Set();
  players = players.filter(p => {
    const key = p.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  puzzle = generatePuzzle(players, sport.categories, sport.seedOffset);
  game = new GameState(puzzle, sport.id);

  renderPuzzleNumber();
  renderGrid();


  if (game.isComplete()) {
    showShareButton();
  }

  // Save sport preference
  localStorage.setItem('playdoku_sport', sportId);
}

function renderPuzzleNumber() {
  const icon = currentSport.icon;
  document.getElementById('puzzle-number').textContent = `${icon} Puzzle #${getPuzzleNumber()}`;
}

function renderGrid() {
  const container = document.getElementById('grid-container');
  container.innerHTML = '';

  const corner = document.createElement('div');
  corner.className = 'grid-corner';
  container.appendChild(corner);

  puzzle.cols.forEach(cat => {
    const header = document.createElement('div');
    header.className = 'grid-header col-header';
    header.innerHTML = renderHeaderContent(cat);
    container.appendChild(header);
  });

  puzzle.rows.forEach((rowCat, r) => {
    const rowHeader = document.createElement('div');
    rowHeader.className = 'grid-header row-header';
    rowHeader.innerHTML = renderHeaderContent(rowCat);
    container.appendChild(rowHeader);

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
          cell.innerHTML = `<span class="cell-player" style="color:var(--incorrect)">\u2717</span>`;
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
  let apiTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    clearTimeout(apiTimer);

    debounceTimer = setTimeout(() => {
      const query = input.value.trim().toLowerCase();
      resultsList.innerHTML = '';

      if (query.length < 2) return;

      const localMatches = players
        .filter(p => p.name.toLowerCase().includes(query))
        .slice(0, 10);

      const shownNames = new Set(localMatches.map(p => p.name.toLowerCase()));

      localMatches.forEach(player => {
        resultsList.appendChild(createPlayerItem(player, false));
      });

      if (query.length >= 3) {
        apiTimer = setTimeout(async () => {
          const apiResults = await searchPlayersAPI(query, currentSport.apiSportFilter);
          const newResults = apiResults.filter(p => !shownNames.has(p.name.toLowerCase()));

          if (newResults.length > 0 && input.value.trim().toLowerCase() === query) {
            newResults.slice(0, 8).forEach(player => {
              resultsList.appendChild(createPlayerItem(player, true));
            });
          }
        }, 300);
      }
    }, 150);
  });
}

function createPlayerItem(player, isFromAPI) {
  const li = document.createElement('li');
  const badge = isFromAPI ? '<span class="api-badge">LIVE</span>' : '';
  li.innerHTML = `${player.name}${badge}<span class="player-country">${player.country}</span>`;
  li.addEventListener('click', () => selectPlayer(player));
  return li;
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
      return player.clubs && player.clubs.some(c => c.toLowerCase() === category.value.toLowerCase());
    case 'country':
      return player.country && player.country.toLowerCase() === category.value.toLowerCase();
    case 'league':
      return player.leagues && player.leagues.some(l => l.toLowerCase() === category.value.toLowerCase());
    case 'position':
      return player.positions && player.positions.some(p => p.toLowerCase() === category.value.toLowerCase());
    case 'award':
      return player.awards && player.awards.some(a => a.toLowerCase() === category.value.toLowerCase());
    default:
      return false;
  }
}


function showShareButton() {
  document.getElementById('share-btn').style.display = 'inline-block';
}

function showGameOver() {
  const score = game.getScore();
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
        cellDiv.textContent = '\u{1F7E9}';
      } else if (state && !state.correct) {
        cellDiv.style.background = '#FFCDD2';
        cellDiv.textContent = '\u{1F7E5}';
      } else {
        cellDiv.style.background = '#E0E0E0';
        cellDiv.textContent = '\u2B1C';
      }
      grid.appendChild(cellDiv);
    }
  }

  document.getElementById('gameover-modal').style.display = 'flex';
}

function shareResults() {
  const score = game.getScore();
  const num = getPuzzleNumber();
  const sportLabel = currentSport.label;
  let text = `Playdoku ${sportLabel} #${num} - ${score}/9\n`;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const state = game.getCellState(r, c);
      if (state && state.correct) text += '\u{1F7E9}';
      else if (state && !state.correct) text += '\u{1F7E5}';
      else text += '\u2B1C';
    }
    text += '\n';
  }

  text += 'reuben12358.github.io/Playdoku';

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!');
    });
  } else {
    showToast('Share not supported');
  }
}

function setupSportToggle() {
  document.querySelectorAll('.sport-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sportId = btn.dataset.sport;
      if (currentSport && currentSport.id === sportId) return;

      // Update active button
      document.querySelectorAll('.sport-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Hide share button for new sport
      document.getElementById('share-btn').style.display = 'none';

      init(sportId);
    });
  });
}

function setupModals() {
  document.querySelectorAll('.modal-overlay, .modal-close').forEach(el => {
    el.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });

  document.getElementById('info-btn').addEventListener('click', () => {
    document.getElementById('info-modal').style.display = 'flex';
  });

  document.getElementById('stats-btn').addEventListener('click', () => {
    updateStatsDisplay();
    document.getElementById('stats-modal').style.display = 'flex';
  });

  document.getElementById('share-btn').addEventListener('click', shareResults);
  document.getElementById('gameover-share-btn').addEventListener('click', shareResults);

  setupSearch();
  setupSportToggle();

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

// Start app
const savedSport = localStorage.getItem('playdoku_sport') || 'football';
// Set initial active button
document.querySelectorAll('.sport-btn').forEach(b => {
  b.classList.toggle('active', b.dataset.sport === savedSport);
});
setupModals();
init(savedSport);
