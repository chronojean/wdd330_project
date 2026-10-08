// Fetch US/UK/AU country info for the accent explorer.
// Uses alpha endpoint with `fields=` (bare /all requires fields and is avoided).
// Cached in memory + localStorage for 7 days.

const CACHE_KEY = "be_country_cache_v1";
const TTL = 7 * 24 * 60 * 60 * 1000;
let memCache = null;

const CODES = { US: "USA", UK: "GBR", AU: "AUS" };

/**
 * @returns {Promise<{US:Object, UK:Object, AU:Object}>}
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
    const url =
      `https://restcountries.com/v3.1/alpha/${code}` +
      `?fields=name,flags,region,languages`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("COUNTRIES_ERROR");
    const data = await res.json();
    const c = Array.isArray(data) ? data[0] : data;
    out[accent] = {
      accent,
      name: c.name?.common || accent,
      flag: c.flags?.png || c.flags?.svg || "",
      flagAlt: c.flags?.alt || `${c.name?.common} flag`,
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
