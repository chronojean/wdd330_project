// Centralized localStorage: words, preferred accent, progress.
// Words: {id, word, definition, level manual A1-B2, note ES, status, createdAt}
// Progress: {streak, lastStudyDate YYYY-MM-DD, reviews: {known, unknown}}

const WORDS_KEY = "be_words_v1";
const PREF_KEY = "be_preferred_accent";
const PROGRESS_KEY = "be_progress_v1";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked/full: keep in-memory behavior, no crash.
  }
}

export function getPreferredAccent() {
  const v = localStorage.getItem(PREF_KEY);
  return ["US", "UK", "AU", "CA"].includes(v) ? v : "US";
}

export function setPreferredAccent(v) {
  if (["US", "UK", "AU", "CA"].includes(v)) localStorage.setItem(PREF_KEY, v);
}

/** @returns {Array} saved words, newest first */
export function getWords() {
  const list = readJson(WORDS_KEY, []);
  return Array.isArray(list) ? list : [];
}

/**
 * Save a word with manually picked level (API gives no CEFR).
 * @param {{word:string, definition:string, level:string, note?:string}} data
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

export function deleteWord(id) {
  writeJson(WORDS_KEY, getWords().filter((w) => w.id !== id));
}

export function setWordStatus(id, status) {
  if (!["new", "learning", "learned"].includes(status)) throw new Error("BAD_STATUS");
  writeJson(
    WORDS_KEY,
    getWords().map((w) => (w.id === id ? { ...w, status } : w))
  );
}

export function getProgress() {
  return readJson(PROGRESS_KEY, { streak: 0, lastStudyDate: null, reviews: { known: 0, unknown: 0 } });
}

/**
 * Record a review answer and update daily streak.
 * @param {boolean} known
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
