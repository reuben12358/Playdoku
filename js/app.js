import { generatePuzzle, getPuzzleNumber } from './puzzle.js?v=7';
import { GameState } from './game.js?v=7';
import { showToast } from './utils.js?v=7';
import { searchPlayersAPI, getTeamLogo } from './api.js?v=7';
import { SPORTS } from './sports.js?v=7';

let players = [];
let puzzle = null;
let game = null;
let selectedCell = null;
let currentSport = null;
let currentVariation = 0;

// ENFORCER: Guarantees countries NEVER appear on both rows and columns.
// Called after every puzzle generation as a last line of defense.
function enforceCountryRule(puzzle) {
  const rowCountries = puzzle.rows.filter(c => c.type === 'country');
  const colCountries = puzzle.cols.filter(c => c.type === 'country');

  // If countries are on both axes, move ALL countries to whichever axis has more
  if (rowCountries.length > 0 && colCountries.length > 0) {
    const allCountries = [...rowCountries, ...colCountries];
    const rowNonCountries = puzzle.rows.filter(c => c.type !== 'country');
    const colNonCountries = puzzle.cols.filter(c => c.type !== 'country');
    const allNonCountries = [...rowNonCountries, ...colNonCountries];

    if (allCountries.length <= 3) {
      // Put all countries in rows, fill rest with non-countries
      puzzle.rows = [...allCountries, ...allNonCountries.slice(0, 3 - allCountries.length)];
      puzzle.cols = allNonCountries.slice(3 - allCountries.length, 3 - allCountries.length + 3);
    } else {
      // Too many countries, just remove them from one axis
      puzzle.rows = [...rowCountries.length >= colCountries.length ? rowCountries : rowNonCountries,
                      ...rowCountries.length >= colCountries.length ? rowNonCountries : rowCountries].slice(0, 3);
      puzzle.cols = colCountries.length > rowCountries.length
        ? [...colCountries, ...colNonCountries].slice(0, 3)
        : colNonCountries.slice(0, 3);
    }
  }
  return puzzle;
}

const fahhSound = new Audio('https://www.myinstants.com/media/sounds/fahhh_KcgAXfs.mp3');

function renderHeaderContent(cat) {
  if (cat.logo) {
    return `<img class="header-logo" src="${cat.logo}" alt="${cat.label}"><span class="header-text">${cat.label}</span>`;
  }
  if (cat.type === 'country' && cat.flag) {
    return `<img class="header-flag" src="https://flagcdn.com/w80/${cat.flag}.png" alt="${cat.label}">`;
  }
  return `<span class="header-emoji">${cat.emoji || ''}</span><span class="header-text">${cat.label}</span>`;
}

async function init(sportId) {
  const sport = SPORTS[sportId];
  if (!sport) return;
  currentSport = sport;

  // Apply theme
  document.documentElement.style.setProperty('--primary', sport.theme.primary);
  document.documentElement.style.setProperty('--primary-light', sport.theme.primaryLight);
  document.documentElement.style.setProperty('--primary-dark', sport.theme.primaryDark);
  document.documentElement.style.setProperty('--header-bg', sport.theme.primary);

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

  // Load variation from storage or use 0
  const savedVar = localStorage.getItem(`playdoku_variation_${sportId}`);
  currentVariation = savedVar ? parseInt(savedVar, 10) : 0;

  puzzle = generatePuzzle(players, sport.categories, sport.seedOffset, currentVariation);
  puzzle = enforceCountryRule(puzzle);

  // Fetch team logos for club categories in this puzzle
  const clubCats = [...puzzle.rows, ...puzzle.cols].filter(c => c.type === 'club');
  await Promise.all(clubCats.map(async (cat) => {
    if (!cat.logo) {
      cat.logo = await getTeamLogo(cat.value);
    }
  }));

  game = new GameState(puzzle, sport.id);

  renderPuzzleNumber();
  renderGrid();

  // Show/hide share button
  const shareBtn = document.getElementById('share-btn');
  shareBtn.style.display = game.isComplete() ? 'inline-block' : 'none';

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
      if (state && state.correct) {
        cell.classList.add('correct');
        cell.innerHTML = `<span class="cell-player">${state.playerName}</span>`;
      } else if (game.isComplete()) {
        cell.classList.add('locked');
        cell.innerHTML = `<span class="cell-plus">-</span>`;
      } else {
        if (state && !state.correct) {
          // Show X but keep clickable for retry
          cell.classList.add('incorrect');
          cell.innerHTML = `<span class="cell-player" style="color:var(--incorrect)">\u2717</span>`;
        } else {
          cell.innerHTML = `<span class="cell-plus">+</span>`;
        }
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

    debounceTimer = setTimeout(async () => {
      const query = input.value.trim().toLowerCase();
      resultsList.innerHTML = '';

      if (query.length < 2) return;

      // Show local matches instantly
      const localMatches = players
        .filter(p => p.name.toLowerCase().includes(query))
        .slice(0, 8);
      const shownNames = new Set(localMatches.map(p => p.name.toLowerCase()));

      localMatches.forEach(player => {
        resultsList.appendChild(createPlayerItem(player));
      });

      // Show loading indicator
      if (query.length >= 2) {
        const loading = document.createElement('li');
        loading.className = 'search-loading';
        loading.textContent = 'Searching all players...';
        resultsList.appendChild(loading);

        // Fetch from API
        const apiResults = await searchPlayersAPI(query, currentSport.apiSportFilter);

        // Remove loading indicator
        const loadingEl = resultsList.querySelector('.search-loading');
        if (loadingEl) loadingEl.remove();

        // Only update if query hasn't changed
        if (input.value.trim().toLowerCase() === query) {
          const newResults = apiResults.filter(p => !shownNames.has(p.name.toLowerCase()));
          newResults.slice(0, 20).forEach(player => {
            resultsList.appendChild(createPlayerItem(player));
          });
        }
      }
    }, 200);
  });
}

function createPlayerItem(player) {
  const li = document.createElement('li');
  li.innerHTML = `${player.name}<span class="player-country">${player.country}</span>`;
  li.addEventListener('click', () => selectPlayer(player));
  return li;
}

async function selectPlayer(player) {
  if (!selectedCell) return;

  const { row, col } = selectedCell;
  const rowCat = puzzle.rows[row];
  const colCat = puzzle.cols[col];

  // Enrich player with API data so recent transfers/full career are included
  const enriched = await enrichPlayerData(player);

  const matchesRow = matchesCategory(enriched, rowCat);
  const matchesCol = matchesCategory(enriched, colCat);
  const isCorrect = matchesRow && matchesCol;

  game.makeGuess(row, col, enriched.name, isCorrect);

  closeModal('search-modal');
  renderGrid();

  if (isCorrect) {
    showToast('Correct!');
  } else {
    fahhSound.currentTime = 0;
    fahhSound.play().catch(() => {});
    showToast('Incorrect!');
  }

  if (game.isComplete()) {
    showShareButton();
    setTimeout(() => showGameOver(), 800);
  }

  selectedCell = null;
}

async function enrichPlayerData(player) {
  try {
    const apiResults = await searchPlayersAPI(player.name, currentSport.apiSportFilter);
    const apiMatch = apiResults.find(p => p.name.toLowerCase() === player.name.toLowerCase());
    if (!apiMatch) return player;

    return {
      ...player,
      clubs: [...new Set([...(player.clubs || []), ...(apiMatch.clubs || [])])],
      positions: [...new Set([...(player.positions || []), ...(apiMatch.positions || [])])],
      country: player.country || apiMatch.country,
      leagues: [...new Set([...(player.leagues || []), ...(apiMatch.leagues || [])])],
      awards: [...new Set([...(player.awards || []), ...(apiMatch.awards || [])])],
    };
  } catch (e) {
    return player;
  }
}

function fuzzyMatch(a, b) {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  return al === bl || al.includes(bl) || bl.includes(al);
}

function matchesCategory(player, category) {
  const val = category.value;
  switch (category.type) {
    case 'club':
      return player.clubs && player.clubs.some(c => fuzzyMatch(c, val));
    case 'country':
      return player.country && fuzzyMatch(player.country, val);
    case 'league':
      return player.leagues && player.leagues.some(l => fuzzyMatch(l, val));
    case 'position':
      return player.positions && player.positions.some(p => fuzzyMatch(p, val));
    case 'award':
      return player.awards && player.awards.some(a => fuzzyMatch(a, val));
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
    title.textContent = 'Perfect! 9/9';
    message.textContent = 'Incredible! You nailed every single one!';
  } else if (score >= 7) {
    title.textContent = `Great Job! ${score}/9`;
    message.textContent = 'So close to perfection! Want to try another?';
  } else if (score >= 4) {
    title.textContent = `Not Bad! ${score}/9`;
    message.textContent = 'Solid effort! Think you can do better?';
  } else {
    title.textContent = `${score}/9`;
    message.textContent = 'Better luck next time! Give it another shot?';
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

async function refreshPuzzle() {
  if (!currentSport) return;
  currentVariation++;
  localStorage.setItem(`playdoku_variation_${currentSport.id}`, currentVariation);
  // Clear game state for current sport
  localStorage.removeItem(`playdoku_state_${currentSport.id}`);
  puzzle = generatePuzzle(players, currentSport.categories, currentSport.seedOffset, currentVariation);
  puzzle = enforceCountryRule(puzzle);

  // Fetch logos for new puzzle's club categories
  const clubCats = [...puzzle.rows, ...puzzle.cols].filter(c => c.type === 'club');
  await Promise.all(clubCats.map(async (cat) => {
    if (!cat.logo) {
      cat.logo = await getTeamLogo(cat.value);
    }
  }));

  game = new GameState(puzzle, currentSport.id);
  renderPuzzleNumber();
  renderGrid();
  document.getElementById('share-btn').style.display = 'none';
  showToast('New puzzle!');
}

function setupModals() {
  document.querySelectorAll('.modal-overlay, .modal-close').forEach(el => {
    el.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });

  document.getElementById('info-btn').addEventListener('click', () => {
    if (currentSport) showRules(currentSport.id, true);
  });

  document.getElementById('stats-btn').addEventListener('click', () => {
    updateStatsDisplay();
    document.getElementById('stats-modal').style.display = 'flex';
  });

  document.getElementById('share-btn').addEventListener('click', shareResults);
  document.getElementById('gameover-share-btn').addEventListener('click', shareResults);
  document.getElementById('refresh-btn').addEventListener('click', refreshPuzzle);
  document.getElementById('gameover-play-again').addEventListener('click', () => {
    closeModal('gameover-modal');
    refreshPuzzle();
  });


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

function showRules(sportId, force = false) {
  const seenKey = `playdoku_rules_seen_${sportId}`;
  if (!force && localStorage.getItem(seenKey)) return;

  const sport = SPORTS[sportId];
  if (!sport) return;

  const title = document.getElementById('info-title');
  title.textContent = `How to Play — ${sport.label}`;

  const body = document.getElementById('info-body');

  const catDescriptions = {
    football: [
      ['Team Logos', 'The player must have played for that club at any point in their career'],
      ['Country Flags', 'The player must be from that country (nationality)'],
      ['League Flags', 'The player must have played in that league (e.g. Premier League, La Liga)'],
      ['Positions', 'The player must have played in that position (GK, Defender, Midfielder, Forward)'],
      ['Awards', "Ballon d'Or winner, World Cup winner, or Champions League (UCL) winner"],
    ],
    basketball: [
      ['Team Logos', 'The player must have played for that NBA team at any point'],
      ['Country Flags', 'The player must be from that country'],
      ['Positions', 'Point Guard, Shooting Guard, Small Forward, Power Forward, or Center'],
      ['Awards', 'MVP, NBA Champion, Finals MVP, DPOY, or All-Star selection'],
    ],
    nfl: [
      ['Team Logos', 'The player must have played for that NFL team at any point'],
      ['Positions', 'QB, RB, WR, TE, Defensive End, Linebacker, Cornerback, Safety, etc.'],
      ['Awards', 'MVP, Super Bowl Winner, Super Bowl MVP, DPOY, or Pro Bowl selection'],
    ],
  };

  const cats = catDescriptions[sportId] || catDescriptions.football;

  body.innerHTML = `
    <p>Fill in the 3x3 grid with <strong>${sport.label}</strong> players who match <strong>both</strong> the row and column categories.</p>
    <ul>
      <li>Click a <strong>+</strong> cell to search for a player</li>
      <li>The player must match the category for both the row <em>and</em> column</li>
      <li>Wrong guesses show an <strong style="color:var(--incorrect)">X</strong> but you can retry</li>
      <li>A new puzzle appears every day!</li>
    </ul>
    <h3 style="margin-top:1rem;margin-bottom:0.5rem;font-size:0.95rem;">Categories</h3>
    <dl class="rules-categories">
      ${cats.map(([name, desc]) => `<dt>${name}</dt><dd>${desc}</dd>`).join('')}
    </dl>
  `;

  document.getElementById('info-modal').style.display = 'flex';
  localStorage.setItem(seenKey, '1');
}

function updateStatsDisplay() {
  const stats = game.getStats();
  document.getElementById('stat-played').textContent = stats.played;
  document.getElementById('stat-correct').textContent = stats.totalCorrect;
  document.getElementById('stat-streak').textContent = stats.streak;
  document.getElementById('stat-best').textContent = stats.bestStreak;
}

// Landing page
function setupLanding() {
  const landing = document.getElementById('landing');
  const gameScreen = document.getElementById('game-screen');

  document.querySelectorAll('.landing-card').forEach(card => {
    card.addEventListener('click', () => {
      const sportId = card.dataset.sport;

      // Animate landing out
      landing.classList.add('exit');

      setTimeout(() => {
        landing.style.display = 'none';
        gameScreen.classList.remove('hidden');

        // Set active sport button
        document.querySelectorAll('.sport-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.sport === sportId);
        });

        init(sportId).then(() => showRules(sportId));
      }, 400);
    });
  });
}

// Home button — go back to landing
function setupHomeButton() {
  document.getElementById('home-btn').addEventListener('click', () => {
    const landing = document.getElementById('landing');
    const gameScreen = document.getElementById('game-screen');

    gameScreen.classList.add('hidden');
    landing.style.display = '';
    landing.classList.remove('exit');
  });
}

// Start app
setupLanding();
setupModals();
setupHomeButton();
