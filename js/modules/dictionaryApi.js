// Fetch word data from Free Dictionary API.
// No CEFR levels here — level is picked manually on save (Phase 3).

const BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";

/**
 * Guess accent from an audio URL (-us/-uk/-au/-gb tags).
 * @param {string} url
 * @returns {"US"|"UK"|"AU"|null}
 */
function accentFromUrl(url) {
  const u = url.toLowerCase();
  if (u.includes("-us") || u.includes("_us") || u.includes("/us")) return "US";
  if (u.includes("-uk") || u.includes("_uk") || u.includes("uk.mp3")) return "UK";
  if (u.includes("-gb") || u.includes("_gb")) return "UK";
  if (u.includes("-au") || u.includes("_au") || u.includes("au.mp3")) return "AU";
  return null;
}

/**
 * Fetch and normalize a word entry.
 * @param {string} rawWord
 * @returns {Promise<{word:string, phonetic:string, meanings:Array, audio:{US?:string,UK?:string,AU?:string}, availableAccents:string[]}>}
 * @throws {Error} with message "NOT_FOUND" on 404.
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
  const entry = data[0];

  const phonetic =
    entry.phonetic ||
    (entry.phonetics || []).find((p) => p.text)?.text ||
    "";

  const meanings = (entry.meanings || []).slice(0, 3).map((m) => ({
    partOfSpeech: m.partOfSpeech || "",
    definitions: (m.definitions || []).slice(0, 2).map((d) => ({
      definition: d.definition || "",
      example: d.example || "",
    })),
  }));

  const audio = {};
  for (const p of entry.phonetics || []) {
    if (!p.audio) continue;
    const accent = accentFromUrl(p.audio);
    // Keep first URL per accent; untagged goes as generic fallback later.
    if (accent && !audio[accent]) audio[accent] = p.audio;
    if (!accent && !audio.US) audio.US = p.audio;
  }

  const availableAccents = ["US", "UK", "AU"].filter((a) => audio[a]);

  return { word: entry.word || word, phonetic, meanings, audio, availableAccents };
}
