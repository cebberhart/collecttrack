// Card search across the three supported TCGs. Each game hits a different
// free public API. Results are cached in memory for a few minutes so repeat
// searches (or React re-renders) don't hammer the external APIs.

const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let lastFetchAt = null;

function getCatalogStatus() {
  return { cacheSize: cache.size, lastFetchAt };
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function searchMtg(query) {
  const key = `mtg:${query.toLowerCase()}`;
  const cached = getCached(key);
  if (cached) return cached;

  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "CollectTrack/1.0 (CIS2454 course project)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) return []; // Scryfall uses 404 for "no matches"
    const body = await response.text();
    console.error("Scryfall response body:", body);
    throw new Error(`Scryfall API error: ${response.status}`);
  }

  const data = await response.json();
  const results = (data.data || []).slice(0, 20).map((card) => ({
    id: card.id,
    name: card.name,
    set: card.set_name,
    rarity: card.rarity,
    imageUrl: card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || null,
  }));

  lastFetchAt = new Date().toISOString();
  setCached(key, results);
  return results;
}

async function searchPokemon(query) {
  const key = `pokemon:${query.toLowerCase()}`;
  const cached = getCached(key);
  if (cached) return cached;

  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(`name:${query}*`)}&pageSize=20`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "CollectTrack/1.0 (CIS2454 course project)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Pokemon TCG API error: ${response.status}`);
  }

  const data = await response.json();
  const results = (data.data || []).map((card) => ({
    id: card.id,
    name: card.name,
    set: card.set?.name || null,
    rarity: card.rarity || null,
    imageUrl: card.images?.small || null,
  }));

  lastFetchAt = new Date().toISOString();
  setCached(key, results);
  return results;
}

async function searchYugioh(query) {
  const key = `yugioh:${query.toLowerCase()}`;
  const cached = getCached(key);
  if (cached) return cached;

  const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "CollectTrack/1.0 (CIS2454 course project)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 400) return []; // YGOPRODeck uses 400 for "no matches"
    throw new Error(`YGOPRODeck API error: ${response.status}`);
  }

  const data = await response.json();
  const results = (data.data || []).slice(0, 20).map((card) => ({
    id: String(card.id),
    name: card.name,
    set: card.card_sets?.[0]?.set_name || null,
    rarity: card.card_sets?.[0]?.set_rarity || null,
    imageUrl: card.card_images?.[0]?.image_url_small || null,
  }));

  lastFetchAt = new Date().toISOString();
  setCached(key, results);
  return results;
}

module.exports = { searchMtg, searchPokemon, searchYugioh, getCatalogStatus };