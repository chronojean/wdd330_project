// Fetch US/UK/AU/CA country info for the accent explorer.
// countries.dev API (free, keyless, CORS enabled).
// Cached in memory + localStorage for 7 days.

const BASE = "https://countries.dev/alpha";

const CACHE_KEY = "be_country_cache_v4";
const TTL = 7 * 24 * 60 * 60 * 1000;
let memCache = null;

const CODES = { US: "USA", UK: "GBR", AU: "AUS", CA: "CAN" };

/**
 * @returns {Promise<{US:Object, UK:Object, AU:Object, CA:Object}>}
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
