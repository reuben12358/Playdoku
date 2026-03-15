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
    case 'club': return player.clubs.some(c => c.toLowerCase() === cat.value.toLowerCase());
    case 'country': return player.country.toLowerCase() === cat.value.toLowerCase();
    case 'league': return player.leagues.some(l => l.toLowerCase() === cat.value.toLowerCase());
    case 'position': return player.positions.some(p => p.toLowerCase() === cat.value.toLowerCase());
    case 'award': return player.awards.some(a => a.toLowerCase() === cat.value.toLowerCase());
    default: return false;
  }
}

function getValidPlayers(players, rowCat, colCat) {
  return players.filter(p => matchesCat(p, rowCat) && matchesCat(p, colCat));
}

function validatePuzzle(players, rows, cols) {
  // Every cell must have at least 2 valid answers
  for (const rowCat of rows) {
    for (const colCat of cols) {
      if (rowCat.id === colCat.id) return false;
      if (getValidPlayers(players, rowCat, colCat).length < 2) return false;
    }
  }

  // Ensure 9 unique players can fill the grid (no cell forced to share its only answer)
  // Use greedy assignment: for each cell, collect valid players, then check
  // that we can assign at least one unique player per cell
  const cellPlayers = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const valid = getValidPlayers(players, rows[r], cols[c]);
      if (valid.length === 0) return false;
      cellPlayers.push(valid.map(p => p.name));
    }
  }

  // Greedy unique assignment check (sorted by fewest options first)
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

    const picked = [];
    const typeCounts = {};

    for (const cat of shuffled) {
      const tc = typeCounts[cat.type] || 0;

      if (cat.type === 'club' && tc >= 4) continue;
      if (cat.type === 'country' && tc >= 2) continue;
      if (cat.type === 'league' && tc >= 2) continue;
      if (cat.type === 'position' && tc >= 1) continue;
      if (cat.type === 'award' && tc >= 1) continue;

      if (countMatches(players, cat) < 3) continue;

      picked.push(cat);
      typeCounts[cat.type] = tc + 1;

      if (picked.length === 6) break;
    }

    if (picked.length < 6) continue;

    const rows = picked.slice(0, 3);
    const cols = picked.slice(3, 6);

    if (validatePuzzle(players, rows, cols)) {
      return { rows, cols, seed };
    }
  }

  // Fallback
  return {
    rows: [categories.clubs[0], categories.clubs[1], categories.clubs[2]],
    cols: [categories.countries[0], categories.countries[1], categories.countries[2]],
    seed,
  };
}
