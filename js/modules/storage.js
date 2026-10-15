/**
 * @file LocalStorage data layer. Manages saved vocabulary words, the user's preferred
 * English accent, study streaks, and flashcard review statistics.
 */

const WORDS_KEY = "be_words_v1";
const PREF_KEY = "be_preferred_accent";
const PROGRESS_KEY = "be_progress_v1";

/**
 * Reads and parses a JSON value from localStorage, returning a fallback value if missing or invalid.
 * @param {string} key - The localStorage key to read from.
 * @param {*} fallback - The default value to return if the key does not exist or parsing fails.
 */
function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Serializes a value to JSON and saves it to localStorage, safely ignoring quota or access errors.
 * @param {string} key - The localStorage key to write to.
 * @param {*} value - The data to serialize and store.
 */
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked/full: keep in-memory behavior, no crash.
  }
}

/**
 * Retrieves the user's preferred English accent from localStorage, defaulting to "US".
 */
export function getPreferredAccent() {
  const v = localStorage.getItem(PREF_KEY);
  return ["US", "UK", "AU", "CA"].includes(v) ? v : "US";
}

/**
 * Saves the user's preferred English accent to localStorage if it is a valid accent code.
 * @param {string} v - The accent code to save ("US", "UK", "AU", or "CA").
 */
export function setPreferredAccent(v) {
  if (["US", "UK", "AU", "CA"].includes(v)) localStorage.setItem(PREF_KEY, v);
}

/**
 * Retrieves the list of saved vocabulary words from localStorage, ordered from newest to oldest.
 * @returns {Array} Saved words, newest first.
 */
export function getWords() {
  const list = readJson(WORDS_KEY, []);
  return Array.isArray(list) ? list : [];
}

/**
 * Validates and saves a new vocabulary word with a manually selected CEFR level to localStorage.
 * @param {{word: string, definition: string, level: string, note?: string}} data - Object containing the word details to save.
 * @param {string} data.word - The English word to save.
 * @param {string} data.definition - The primary definition of the word.
 * @param {string} data.level - The CEFR difficulty level ("A1", "A2", "B1", or "B2").
 * @param {string} [data.note=""] - An optional personal note in Spanish.
 */
export function saveWord({ word, definition, level, note = "" }) {
  const cleanWord = String(word || "").trim();
  if (!cleanWord) throw new Error("EMPTY_WORD");
  if (!["A1", "A2", "B1", "B2"].includes(level)) throw new Error("BAD_LEVEL");
  const list = getWords();
  const key = cleanWord.toLowerCase();
  if (list.some((w) => w.word.toLowerCase() === key)) throw new Error("DUPLICATE");
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    word: cleanWord,
    definition: String(definition || "").slice(0, 500),
    level,
    note: String(note || "").slice(0, 280),
    status: "new",
    createdAt: new Date().toISOString(),
  };
  writeJson(WORDS_KEY, [entry, ...list]);
  return entry;
}

/**
 * Deletes a saved word from localStorage by its unique ID.
 * @param {string} id - The unique identifier of the word to delete.
 */
export function deleteWord(id) {
  writeJson(WORDS_KEY, getWords().filter((w) => w.id !== id));
}

/**
 * Updates the learning status of a saved word in localStorage.
 * @param {string} id - The unique identifier of the word to update.
 * @param {string} status - The new learning status ("new", "learning", or "learned").
 */
export function setWordStatus(id, status) {
  if (!["new", "learning", "learned"].includes(status)) throw new Error("BAD_STATUS");
  writeJson(
    WORDS_KEY,
    getWords().map((w) => (w.id === id ? { ...w, status } : w))
  );
}

/**
 * Retrieves the user's study progress, including daily streak and review counts, from localStorage.
 */
export function getProgress() {
  return readJson(PROGRESS_KEY, { streak: 0, lastStudyDate: null, reviews: { known: 0, unknown: 0 } });
}

/**
 * Records the result of a flashcard review and updates the user's daily study streak.
 * @param {boolean} known - True if the user knew the word, false otherwise.
 */
export function recordReview(known) {
  const p = getProgress();
  const today = new Date().toISOString().slice(0, 10);
  let streak = p.streak || 0;
  if (p.lastStudyDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streak = p.lastStudyDate === yesterday ? streak + 1 : 1;
  }
  const next = {
    streak,
    lastStudyDate: today,
    reviews: {
      known: (p.reviews?.known || 0) + (known ? 1 : 0),
      unknown: (p.reviews?.unknown || 0) + (known ? 0 : 1),
    },
  };
  writeJson(PROGRESS_KEY, next);
  return next;
}
