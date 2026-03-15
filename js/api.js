const API_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const searchCache = new Map();

export async function searchPlayersAPI(query, sportFilter = 'Soccer') {
  if (query.length < 3) return [];

  const cacheKey = `${sportFilter}:${query.toLowerCase()}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  try {
    const res = await fetch(`${API_BASE}/searchplayers.php?p=${encodeURIComponent(query)}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.player) return [];

    const mapFn = sportFilter === 'Basketball' ? mapBasketballPosition : mapFootballPosition;

    const results = data.player
      .filter(p => p.strSport === sportFilter)
      .map(p => ({
        name: p.strPlayer,
        country: p.strNationality || '',
        clubs: p.strTeam ? [p.strTeam] : [],
        positions: mapFn(p.strPosition),
        leagues: [],
        awards: [],
        fromAPI: true,
      }));

    searchCache.set(cacheKey, results);
    return results;
  } catch (e) {
    return [];
  }
}

function mapFootballPosition(pos) {
  if (!pos) return [];
  const p = pos.toLowerCase();
  if (p.includes('goalkeeper') || p.includes('keeper')) return ['Goalkeeper'];
  if (p.includes('defender') || p.includes('back')) return ['Defender'];
  if (p.includes('midfielder') || p.includes('midfield')) return ['Midfielder'];
  if (p.includes('forward') || p.includes('striker') || p.includes('winger') || p.includes('wing')) return ['Forward'];
  return [];
}

function mapBasketballPosition(pos) {
  if (!pos) return [];
  const p = pos.toLowerCase();
  const positions = [];
  if (p.includes('point guard') || p === 'pg') positions.push('Point Guard');
  if (p.includes('shooting guard') || p === 'sg') positions.push('Shooting Guard');
  if (p.includes('small forward') || p === 'sf') positions.push('Small Forward');
  if (p.includes('power forward') || p === 'pf') positions.push('Power Forward');
  if (p.includes('center') || p === 'c') positions.push('Center');
  // Fallback for generic terms
  if (positions.length === 0) {
    if (p.includes('guard')) positions.push('Point Guard', 'Shooting Guard');
    if (p.includes('forward')) positions.push('Small Forward', 'Power Forward');
  }
  return positions;
}
