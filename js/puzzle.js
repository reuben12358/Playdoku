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

    const picked = [];
    const typeCounts = {};

    for (const cat of shuffled) {
      const tc = typeCounts[cat.type] || 0;

      if (cat.type === 'club' && tc >= 4) continue;
      if (cat.type === 'country' && tc >= 2) continue;
      if (cat.type === 'league' && tc >= 2) continue;
      if (cat.type === 'position' && tc >= 2) continue;
      if (cat.type === 'award' && tc >= 2) continue;

      if (countMatches(players, cat) < 2) continue;

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

  // Fallback: pick first 6 available categories from all types
  const allFallback = getAllCategories(categories).filter(c => countMatches(players, c) >= 1);
  return {
    rows: [allFallback[0], allFallback[1], allFallback[2]],
    cols: [allFallback[3], allFallback[4], allFallback[5]],
    seed,
  };
}
