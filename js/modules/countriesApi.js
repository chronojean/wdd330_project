/**
 * @file Country metadata service. Fetches and caches country names, flags, and regions
 * (US, UK, AU, CA) from the countries.dev API for the accent explorer.
 */

const BASE = "https://countries.dev/alpha";

const CACHE_KEY = "be_country_cache_v4";
const TTL = 7 * 24 * 60 * 60 * 1000;
let memCache = null;

const CODES = { US: "USA", UK: "GBR", AU: "AUS", CA: "CAN" };

/**
 * Fetches country metadata (name, flag, region) for US, UK, AU, and CA accents, using memory and localStorage caching.
 * @returns {Promise<{US: Object, UK: Object, AU: Object, CA: Object}>} An object mapping each accent code to its country details.
 */
export async function fetchAccentCountries() {
  if (memCache) return memCache;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.at < TTL) {
        memCache = parsed.data;
        return memCache;
      }
    }
  } catch {
    // Ignore corrupt cache, fetch fresh.
  }

  const out = {};
  for (const [accent, code] of Object.entries(CODES)) {
    const res = await fetch(`${BASE}/${code}`, {
      mode: "cors",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error("Countries fetch failed:", res.status, accent, code);
      throw new Error("COUNTRIES_ERROR");
    }
    const c = await res.json();
    if (!c || !c.name) throw new Error("COUNTRIES_ERROR");
    out[accent] = {
      accent,
      name: c.name || accent,
      flag: c.flags?.png || c.flags?.svg || "",
      flagAlt: `${c.name} flag`,
      region: c.region || "",
    };
  }

  memCache = out;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: out }));
  } catch {
    // Storage full/blocked — memory cache still works.
  }
  return out;
}
