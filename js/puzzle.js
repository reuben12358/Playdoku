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

function cellHasEnoughAnswers(players, rowCat, colCat, minAnswers = 2) {
  let count = 0;
  for (const p of players) {
    if (matchesCat(p, rowCat) && matchesCat(p, colCat)) {
      count++;
      if (count >= minAnswers) return true;
    }
  }
  return false;
}

export function generatePuzzle(players, categories, seedOffset = 0) {
  const seed = getDateSeed() * 10 + seedOffset;
  const rng = mulberry32(seed);

  const allCats = getAllCategories(categories);

  for (let attempt = 0; attempt < 200; attempt++) {
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

    let valid = true;
    for (const rowCat of rows) {
      for (const colCat of cols) {
        if (rowCat.id === colCat.id) { valid = false; break; }
        if (!cellHasEnoughAnswers(players, rowCat, colCat, 1)) {
          valid = false;
          break;
        }
      }
      if (!valid) break;
    }

    if (valid) {
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
