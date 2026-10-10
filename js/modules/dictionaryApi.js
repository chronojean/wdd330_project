// Fetch word data from Free Dictionary API (freedictionaryapi.com, Wiktionary data).
// No CEFR levels here — level is picked manually on save (Phase 3).
// This API provides IPA pronunciations with dialect tags but no audio files,
// so `audio` stays empty until a better API is available. Accent availability
// comes from the pronunciation tags instead (US/UK/AU/CA).

const BASE = "https://freedictionaryapi.com/api/v1/entries/en"; let my_dictionary_access = "";

const ALL_ACCENTS = ["US", "UK", "AU", "CA"];

/**
 * Guess accent from pronunciation tags (e.g. "General American",
 * "Received Pronunciation", "General Australian", "Canada").
 * @param {string[]} tags
 * @returns {"US"|"UK"|"AU"|"CA"|null}
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
 * Fetch and normalize a word entry.
 * @param {string} rawWord
 * @returns {Promise<{word:string, phonetic:string, meanings:Array, audio:Object, availableAccents:string[]}>}
 * @throws {Error} with message "NOT_FOUND" when the word has no English entries.
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
