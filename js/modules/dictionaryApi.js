/**
 * @file Dictionary API service. Fetches word definitions, IPA pronunciations, and dialect
 * tags from the Free Dictionary API and normalizes them for the app.
 */

const BASE = "https://freedictionaryapi.com/api/v1/entries/en"; let my_dictionary_access = "";

const ALL_ACCENTS = ["US", "UK", "AU", "CA"];

/**
 * Determines the accent code (US, UK, AU, or CA) from an array of pronunciation dialect tags.
 * @param {string[]} tags - List of dialect or region tags associated with a pronunciation (e.g., "General American", "Received Pronunciation").
 * @returns {"US"|"UK"|"AU"|"CA"|null} The matched accent code, or null if no match is found.
 */
function accentFromTags(tags) {
  const t = (tags || []).join(" ").toLowerCase();
  if (!t) return null;
  if (t.includes("australi")) return "AU";
  if (t.includes("canada") || t.includes("canadian")) return "CA";
  if (
    t.includes("american") ||
    t.includes("united states") ||
    /\bus\b/.test(t)
  ) return "US";
  if (
    t.includes("british") ||
    t.includes("received pronunciation") ||
    t.includes("london") ||
    t.includes("england") ||
    t.includes("northumbria") ||
    t.includes("scotland") ||
    t.includes("wales") ||
    t.includes("ireland") ||
    /\buk\b/.test(t)
  ) return "UK";
  return null;
}

/**
 * Fetches and normalizes dictionary entries, definitions, phonetics, and available accents for a given English word.
 * @param {string} rawWord - The English word typed by the user to look up.
 * @returns {Promise<{word: string, phonetic: string, meanings: Array, audio: Object, availableAccents: string[]}>} The normalized word entry data.
 * @throws {Error} With message "EMPTY", "NETWORK", "NOT_FOUND", or "API_ERROR".
 */
export async function fetchWord(rawWord) {
  const word = rawWord.trim().toLowerCase();
  if (!word) throw new Error("EMPTY");
  let res;
  try {
    res = await fetch(`${BASE}/${encodeURIComponent(word)}`, {
      mode: "cors",
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    // Network failure or CORS block (request never completed).
    // Log the technical cause for DevTools, throw a code the UI understands.
    console.error("Dictionary fetch failed:", err);
    throw new Error("NETWORK");
  }
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) throw new Error("API_ERROR");
  const data = await res.json();
  // New API returns 200 with `entries: []` for unknown words.
  const entries = (data.entries || []).filter((e) => e.language?.code === "en");
  if (entries.length === 0) throw new Error("NOT_FOUND");

  const firstPron = entries
    .flatMap((e) => e.pronunciations || [])
    .find((p) => p.text)?.text || "";

  const meanings = entries.slice(0, 3).map((e) => ({
    partOfSpeech: e.partOfSpeech || "",
    definitions: (e.senses || []).slice(0, 2).map((s) => ({
      definition: s.definition || "",
      example: (s.examples || [])[0] || "",
    })),
  }));

  // No audio files in this API — kept as-is for a future better API.
  // The UI already handles the empty case ("No pronunciation available",
  // disabled explorer tiles).
  const audio = {};

  const tagged = new Set();
  let hasPronunciations = false;
  for (const e of entries) {
    for (const p of e.pronunciations || []) {
      hasPronunciations = true;
      const accent = accentFromTags(p.tags);
      if (accent) tagged.add(accent);
    }
  }
  // Untagged IPA is dialect-neutral: counts for every accent so words like
  // "heavily" don't end up with zero accents.
  const availableAccents =
    tagged.size > 0 ? ALL_ACCENTS.filter((a) => tagged.has(a))
    : hasPronunciations ? [...ALL_ACCENTS]
    : [];

  return { word: data.word || word, phonetic: firstPron, meanings, audio, availableAccents };
}
