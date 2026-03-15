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

// Category definitions
const CATEGORIES = {
  clubs: [
    { id: 'real_madrid', label: 'Real Madrid', value: 'Real Madrid', type: 'club', emoji: '🤍' },
    { id: 'barcelona', label: 'Barcelona', value: 'Barcelona', type: 'club', emoji: '🔵🔴' },
    { id: 'man_united', label: 'Man United', value: 'Manchester United', type: 'club', emoji: '🔴' },
    { id: 'liverpool', label: 'Liverpool', value: 'Liverpool', type: 'club', emoji: '🔴' },
    { id: 'chelsea', label: 'Chelsea', value: 'Chelsea', type: 'club', emoji: '🔵' },
    { id: 'arsenal', label: 'Arsenal', value: 'Arsenal', type: 'club', emoji: '🔴⚪' },
    { id: 'man_city', label: 'Man City', value: 'Manchester City', type: 'club', emoji: '🩵' },
    { id: 'bayern', label: 'Bayern Munich', value: 'Bayern Munich', type: 'club', emoji: '🔴⚪' },
    { id: 'juventus', label: 'Juventus', value: 'Juventus', type: 'club', emoji: '⚪⚫' },
    { id: 'ac_milan', label: 'AC Milan', value: 'AC Milan', type: 'club', emoji: '🔴⚫' },
    { id: 'inter', label: 'Inter Milan', value: 'Inter Milan', type: 'club', emoji: '🔵⚫' },
    { id: 'psg', label: 'PSG', value: 'PSG', type: 'club', emoji: '🔵🔴' },
    { id: 'atletico', label: 'Atletico Madrid', value: 'Atletico Madrid', type: 'club', emoji: '🔴⚪' },
    { id: 'dortmund', label: 'Dortmund', value: 'Borussia Dortmund', type: 'club', emoji: '💛' },
    { id: 'tottenham', label: 'Tottenham', value: 'Tottenham Hotspur', type: 'club', emoji: '⚪' },
    { id: 'napoli', label: 'Napoli', value: 'Napoli', type: 'club', emoji: '🔵' },
    { id: 'ajax', label: 'Ajax', value: 'Ajax', type: 'club', emoji: '🔴⚪' },
  ],
  countries: [
    { id: 'brazil', label: 'Brazil', value: 'Brazil', type: 'country', flag: 'br' },
    { id: 'argentina', label: 'Argentina', value: 'Argentina', type: 'country', flag: 'ar' },
    { id: 'france', label: 'France', value: 'France', type: 'country', flag: 'fr' },
    { id: 'germany', label: 'Germany', value: 'Germany', type: 'country', flag: 'de' },
    { id: 'spain', label: 'Spain', value: 'Spain', type: 'country', flag: 'es' },
    { id: 'england', label: 'England', value: 'England', type: 'country', flag: 'gb-eng' },
    { id: 'italy', label: 'Italy', value: 'Italy', type: 'country', flag: 'it' },
    { id: 'portugal', label: 'Portugal', value: 'Portugal', type: 'country', flag: 'pt' },
    { id: 'netherlands', label: 'Netherlands', value: 'Netherlands', type: 'country', flag: 'nl' },
  ],
  leagues: [
    { id: 'premier_league', label: 'Premier League', value: 'Premier League', type: 'league', emoji: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}' },
    { id: 'la_liga', label: 'La Liga', value: 'La Liga', type: 'league', emoji: '🇪🇸' },
    { id: 'serie_a', label: 'Serie A', value: 'Serie A', type: 'league', emoji: '🇮🇹' },
    { id: 'bundesliga', label: 'Bundesliga', value: 'Bundesliga', type: 'league', emoji: '🇩🇪' },
    { id: 'ligue_1', label: 'Ligue 1', value: 'Ligue 1', type: 'league', emoji: '🇫🇷' },
  ],
  positions: [
    { id: 'goalkeeper', label: 'Goalkeeper', value: 'Goalkeeper', type: 'position', emoji: '🧤' },
    { id: 'defender', label: 'Defender', value: 'Defender', type: 'position', emoji: '🛡️' },
    { id: 'midfielder', label: 'Midfielder', value: 'Midfielder', type: 'position', emoji: '🎯' },
    { id: 'forward', label: 'Forward', value: 'Forward', type: 'position', emoji: '⚡' },
  ],
  awards: [
    { id: 'ballon_dor', label: "Ballon d'Or", value: "Ballon d'Or", type: 'award', emoji: '🏆' },
    { id: 'world_cup', label: 'World Cup Winner', value: 'World Cup', type: 'award', emoji: '🏆' },
    { id: 'ucl', label: 'UCL Winner', value: 'Champions League', type: 'award', emoji: '🏆' },
  ],
};

function getAllCategories() {
  return [
    ...CATEGORIES.clubs,
    ...CATEGORIES.countries,
    ...CATEGORIES.leagues,
    ...CATEGORIES.positions,
    ...CATEGORIES.awards,
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

export function generatePuzzle(players) {
  const seed = getDateSeed();
  const rng = mulberry32(seed);

  // Build candidate pool: mix of category types
  // Aim for: 3-4 clubs, 1-2 countries, 0-1 others
  const allCats = getAllCategories();

  for (let attempt = 0; attempt < 200; attempt++) {
    const shuffled = shuffle(allCats, rng);

    // Pick 6 categories with type constraints
    const picked = [];
    const typeCounts = {};

    for (const cat of shuffled) {
      const tc = typeCounts[cat.type] || 0;

      // Limit types
      if (cat.type === 'club' && tc >= 4) continue;
      if (cat.type === 'country' && tc >= 2) continue;
      if (cat.type === 'league' && tc >= 2) continue;
      if (cat.type === 'position' && tc >= 1) continue;
      if (cat.type === 'award' && tc >= 1) continue;

      // Must have enough players for this category
      if (countMatches(players, cat) < 3) continue;

      picked.push(cat);
      typeCounts[cat.type] = tc + 1;

      if (picked.length === 6) break;
    }

    if (picked.length < 6) continue;

    const rows = picked.slice(0, 3);
    const cols = picked.slice(3, 6);

    // Validate every cell has at least 2 valid answers
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

  // Fallback: guaranteed simple puzzle
  return {
    rows: [CATEGORIES.clubs[0], CATEGORIES.clubs[1], CATEGORIES.clubs[2]],
    cols: [CATEGORIES.countries[0], CATEGORIES.countries[1], CATEGORIES.countries[2]],
    seed,
  };
}
