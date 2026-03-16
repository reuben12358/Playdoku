const searchCache = new Map();
const logoCache = {};

// Clear stale logo cache from previous versions (broken Wikipedia URLs)
const LOGO_CACHE_VERSION = 2;
if (localStorage.getItem('logo_cache_version') !== String(LOGO_CACHE_VERSION)) {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('team_logo_')) localStorage.removeItem(key);
  });
  localStorage.setItem('logo_cache_version', String(LOGO_CACHE_VERSION));
}

export async function getTeamLogo(teamName) {
  if (logoCache[teamName] !== undefined) return logoCache[teamName];

  const stored = localStorage.getItem(`team_logo_${teamName}`);
  if (stored) {
    logoCache[teamName] = stored;
    return stored;
  }

  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`
    );
    if (!res.ok) { logoCache[teamName] = null; return null; }
    const data = await res.json();
    const team = data.teams?.[0];
    const badge = team?.strBadge || team?.strTeamBadge;
    if (badge) {
      logoCache[teamName] = badge;
      localStorage.setItem(`team_logo_${teamName}`, badge);
      return badge;
    }
  } catch (e) {}

  logoCache[teamName] = null;
  return null;
}

// Wikidata occupation QIDs per sport
const SPORT_OCCUPATION = {
  'Soccer': 'Q937857',           // association football player
  'Basketball': 'Q3665646',      // basketball player
  'American Football': 'Q19204627', // American football player
};

export async function searchPlayersAPI(query, sportFilter = 'Soccer') {
  if (query.length < 2) return [];

  const cacheKey = `${sportFilter}:${query.toLowerCase()}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  const occupationQID = SPORT_OCCUPATION[sportFilter];
  if (!occupationQID) return [];

  try {
    // Step 1: Search Wikidata for players of this sport
    const searchUrl = `https://www.wikidata.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}+haswbstatement:P106=${occupationQID}&srlimit=15&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();

    const results = searchData.query?.search;
    if (!results || results.length === 0) return [];

    // Step 2: Get entity details (labels, claims)
    const ids = results.map(r => r.title).join('|');
    const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids}&props=labels|claims&languages=en&format=json&origin=*`;
    const entityRes = await fetch(entityUrl);
    if (!entityRes.ok) return [];
    const entityData = await entityRes.json();

    // Collect all referenced QIDs we need labels for
    const refIds = new Set();
    const playerData = [];

    for (const [qid, entity] of Object.entries(entityData.entities || {})) {
      const name = entity.labels?.en?.value;
      if (!name) continue;

      const claims = entity.claims || {};

      const countryQIds = getClaimIds(claims.P27);
      const teamQIds = getClaimIds(claims.P54);
      const positionQIds = getClaimIds(claims.P413);

      countryQIds.forEach(id => refIds.add(id));
      teamQIds.forEach(id => refIds.add(id));
      positionQIds.forEach(id => refIds.add(id));

      playerData.push({ qid, name, countryQIds, teamQIds, positionQIds });
    }

    // Step 3: Batch resolve all referenced entity labels
    const labelMap = await resolveLabels([...refIds]);

    // Step 4: Build player objects
    const mapFn = sportFilter === 'Basketball' ? mapBasketballPosition
      : sportFilter === 'American Football' ? mapNFLPosition
      : mapFootballPosition;

    const players = playerData.map(p => {
      const country = p.countryQIds.map(id => labelMap[id]).filter(Boolean).join(', ');
      const clubs = p.teamQIds.map(id => labelMap[id]).filter(Boolean);
      const rawPositions = p.positionQIds.map(id => labelMap[id]).filter(Boolean);
      const positions = mapFn(rawPositions.join(', '));

      return {
        name: p.name,
        country: country || '',
        clubs,
        positions,
        leagues: [],
        awards: [],
        fromAPI: true,
      };
    });

    searchCache.set(cacheKey, players);
    return players;
  } catch (e) {
    return [];
  }
}

function getClaimIds(claims) {
  if (!claims) return [];
  return claims
    .map(c => c.mainsnak?.datavalue?.value?.id)
    .filter(Boolean);
}

async function resolveLabels(qids) {
  const labelMap = {};
  if (qids.length === 0) return labelMap;

  // wbgetentities supports max 50 IDs per request
  const batches = [];
  for (let i = 0; i < qids.length; i += 50) {
    batches.push(qids.slice(i, i + 50));
  }

  // Fetch all batches in parallel
  const responses = await Promise.all(
    batches.map(batch => {
      const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.join('|')}&props=labels&languages=en&format=json&origin=*`;
      return fetch(url).then(r => r.ok ? r.json() : null).catch(() => null);
    })
  );

  for (const data of responses) {
    if (!data?.entities) continue;
    for (const [qid, entity] of Object.entries(data.entities)) {
      labelMap[qid] = entity.labels?.en?.value || null;
    }
  }

  return labelMap;
}

function mapFootballPosition(pos) {
  if (!pos) return [];
  const p = pos.toLowerCase();
  const positions = [];
  if (p.includes('goalkeeper') || p.includes('keeper')) positions.push('Goalkeeper');
  if (p.includes('defender') || p.includes('back') || p.includes('defenc')) positions.push('Defender');
  if (p.includes('midfielder') || p.includes('midfield')) positions.push('Midfielder');
  if (p.includes('forward') || p.includes('striker') || p.includes('winger') || p.includes('wing')) positions.push('Forward');
  return positions.length > 0 ? positions : [];
}

function mapBasketballPosition(pos) {
  if (!pos) return [];
  const p = pos.toLowerCase();
  const positions = [];
  if (p.includes('point guard')) positions.push('Point Guard');
  if (p.includes('shooting guard')) positions.push('Shooting Guard');
  if (p.includes('small forward')) positions.push('Small Forward');
  if (p.includes('power forward')) positions.push('Power Forward');
  if (p.includes('center')) positions.push('Center');
  if (positions.length === 0) {
    if (p.includes('guard')) positions.push('Point Guard', 'Shooting Guard');
    if (p.includes('forward')) positions.push('Small Forward', 'Power Forward');
  }
  return positions;
}

function mapNFLPosition(pos) {
  if (!pos) return [];
  const p = pos.toLowerCase();
  const positions = [];
  if (p.includes('quarterback')) positions.push('Quarterback');
  if (p.includes('running back') || p.includes('halfback') || p.includes('fullback')) positions.push('Running Back');
  if (p.includes('wide receiver')) positions.push('Wide Receiver');
  if (p.includes('tight end')) positions.push('Tight End');
  if (p.includes('defensive end')) positions.push('Defensive End');
  if (p.includes('defensive tackle') || p.includes('nose tackle')) positions.push('Defensive Tackle');
  if (p.includes('linebacker')) positions.push('Linebacker');
  if (p.includes('cornerback')) positions.push('Cornerback');
  if (p.includes('safety')) positions.push('Safety');
  if (p.includes('offensive tackle') || p.includes('offensive guard') || p.includes('offensive line')) positions.push('Offensive Lineman');
  return positions;
}
