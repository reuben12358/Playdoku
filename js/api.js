const API_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const searchCache = new Map();

export async function searchPlayersAPI(query) {
  if (query.length < 3) return [];

  // Check cache
  const cacheKey = query.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  try {
    const res = await fetch(`${API_BASE}/searchplayers.php?p=${encodeURIComponent(query)}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.player) return [];

    // Filter to soccer players only and normalize to our format
    const results = data.player
      .filter(p => p.strSport === 'Soccer')
      .map(p => ({
        name: p.strPlayer,
        country: p.strNationality || '',
        clubs: p.strTeam ? [p.strTeam] : [],
        positions: mapPosition(p.strPosition),
        leagues: [],
        awards: [],
        fromAPI: true,
        thumb: p.strThumb || null,
      }));

    searchCache.set(cacheKey, results);
    return results;
  } catch (e) {
    return [];
  }
}

function mapPosition(pos) {
  if (!pos) return [];
  const p = pos.toLowerCase();
  if (p.includes('goalkeeper') || p.includes('keeper')) return ['Goalkeeper'];
  if (p.includes('defender') || p.includes('back')) return ['Defender'];
  if (p.includes('midfielder') || p.includes('midfield')) return ['Midfielder'];
  if (p.includes('forward') || p.includes('striker') || p.includes('winger') || p.includes('wing')) return ['Forward'];
  return [];
}
