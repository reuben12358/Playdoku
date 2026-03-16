// Seeded PRNG (Mulberry32)
function mulberry32(seed) {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function getDateSeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export function getPuzzleNumber() {
  const start = new Date(2026, 2, 14); // March 14, 2026
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.floor((now - start) / 86400000) + 1;
}

function getAllCategories(categories) {
  return [
    ...categories.clubs,
    ...categories.countries,
    ...(categories.leagues || []),
    ...categories.positions,
    ...categories.awards,
  ];
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function countMatches(players, cat) {
  return players.filter(p => matchesCat(p, cat)).length;
}

function matchesCat(player, cat) {
  switch (cat.type) {
    case 'club': return player.clubs && player.clubs.some(c => c.toLowerCase() === cat.value.toLowerCase());
    case 'country': return player.country && player.country.toLowerCase() === cat.value.toLowerCase();
    case 'league': return player.leagues && player.leagues.some(l => l.toLowerCase() === cat.value.toLowerCase());
    case 'position': return player.positions && player.positions.some(p => p.toLowerCase() === cat.value.toLowerCase());
    case 'award': return player.awards && player.awards.some(a => a.toLowerCase() === cat.value.toLowerCase());
    case 'rare_achievement': return player.rareAchievements && player.rareAchievements.some(a => a.toLowerCase() === cat.value.toLowerCase());
    default: return false;
  }
}

function getValidPlayers(players, rowCat, colCat) {
  return players.filter(p => matchesCat(p, rowCat) && matchesCat(p, colCat));
}

// Hard check: country must not appear on both axes, no duplicate categories
function isValidLayout(rows, cols) {
  const allCats = [...rows, ...cols];

  // Country must NOT appear in both rows and cols (player has one nationality)
  const rowHasCountry = rows.some(c => c.type === 'country');
  const colHasCountry = cols.some(c => c.type === 'country');
  if (rowHasCountry && colHasCountry) return false;

  // No two identical categories
  const ids = allCats.map(c => c.id);
  if (new Set(ids).size !== ids.length) return false;

  return true;
}

export function validatePuzzle(players, rows, cols) {
  // Hard layout check first
  if (!isValidLayout(rows, cols)) return false;

  // Every cell must have at least 1 valid answer
  const cellPlayers = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (rows[r].id === cols[c].id) return false;
      const valid = getValidPlayers(players, rows[r], cols[c]);
      if (valid.length === 0) return false;
      cellPlayers.push(valid.map(p => p.name));
    }
  }

  // Ensure 9 unique players can fill the grid
  const indices = [0,1,2,3,4,5,6,7,8].sort((a,b) => cellPlayers[a].length - cellPlayers[b].length);
  const used = new Set();
  for (const i of indices) {
    const available = cellPlayers[i].find(name => !used.has(name));
    if (!available) return false;
    used.add(available);
  }

  return true;
}

export function generatePuzzle(players, categories, seedOffset = 0, variation = 0) {
  const seed = getDateSeed() * 100 + seedOffset * 10 + variation;
  const rng = mulberry32(seed);

  const allCats = getAllCategories(categories);

  for (let attempt = 0; attempt < 500; attempt++) {
    const shuffled = shuffle(allCats, rng);

    // Pick 6 unique categories with enough matching players
    const picked = [];
    const usedIds = new Set();
    for (const cat of shuffled) {
      if (usedIds.has(cat.id)) continue;
      if (countMatches(players, cat) < 2) continue;
      picked.push(cat);
      usedIds.add(cat.id);
      if (picked.length === 6) break;
    }

    if (picked.length < 6) continue;

    // COUNTRY RULE: all countries must go on ONE axis (rows or cols), never split.
    // Separate countries from non-countries, then place countries together on one side.
    const countries = picked.filter(c => c.type === 'country');
    const others = picked.filter(c => c.type !== 'country');

    let rows, cols;
    if (countries.length === 0) {
      // No countries — just split normally
      rows = picked.slice(0, 3);
      cols = picked.slice(3, 6);
    } else if (countries.length <= 3) {
      // Put all countries on one axis, fill the rest with non-countries
      const putCountriesInRows = rng() < 0.5;
      if (putCountriesInRows) {
        rows = [...countries, ...others.slice(0, 3 - countries.length)];
        cols = others.slice(3 - countries.length, 3 - countries.length + 3);
      } else {
        cols = [...countries, ...others.slice(0, 3 - countries.length)];
        rows = others.slice(3 - countries.length, 3 - countries.length + 3);
      }
    } else {
      // More than 3 countries — impossible to fit on one axis, skip
      continue;
    }

    if (rows.length !== 3 || cols.length !== 3) continue;

    if (validatePuzzle(players, rows, cols)) {
      return { rows, cols, seed };
    }
  }

  // Fallback: exclude countries to avoid any conflict, use everything else
  const fallbackCats = getAllCategories(categories)
    .filter(c => c.type !== 'country' && countMatches(players, c) >= 2);
  const fallbackShuffled = shuffle(fallbackCats, rng);
  if (fallbackShuffled.length >= 6) {
    const rows = [fallbackShuffled[0], fallbackShuffled[1], fallbackShuffled[2]];
    const cols = [fallbackShuffled[3], fallbackShuffled[4], fallbackShuffled[5]];
    if (validatePuzzle(players, rows, cols)) {
      return { rows, cols, seed };
    }
  }

  // Last resort: clubs only
  const clubsOnly = (categories.clubs || []).filter(c => countMatches(players, c) >= 2);
  const clubsShuffled = shuffle(clubsOnly, rng);
  return {
    rows: [clubsShuffled[0], clubsShuffled[1], clubsShuffled[2]],
    cols: [clubsShuffled[3], clubsShuffled[4], clubsShuffled[5]],
    seed,
  };
}

export function injectRareAchievement(puzzle, players, rareAchievements, variation) {
  const rng = mulberry32(variation * 7 + 13);
  const shuffledRare = shuffle(rareAchievements, rng);

  // Pick one axis randomly, try to replace one slot with a rare achievement
  const useRow = rng() < 0.5;
  const axis = useRow ? 'rows' : 'cols';

  for (const rareCat of shuffledRare) {
    if (countMatches(players, rareCat) < 2) continue;

    for (let slot = 0; slot < 3; slot++) {
      const original = puzzle[axis][slot];
      puzzle[axis][slot] = rareCat;

      if (validatePuzzle(players, puzzle.rows, puzzle.cols)) {
        return puzzle;
      }

      puzzle[axis][slot] = original;
    }
  }

  return puzzle;
}
