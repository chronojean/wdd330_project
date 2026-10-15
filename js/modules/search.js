/**
 * @file Search view module. Handles word lookup, preferred accent selection, audio playback,
 * rendering definitions and the accent explorer, and saving words to vocabulary.
 */

import { fetchWord } from "./dictionaryApi.js";
import { fetchAccentCountries } from "./countriesApi.js";
import { getPreferredAccent, setPreferredAccent, saveWord } from "./storage.js";

const FALLBACK_ORDER = ["US", "UK", "AU", "CA"];

/**
 * Selects the audio URL for the user's preferred accent, or falls back to the first available accent (US -> UK -> AU -> CA).
 * @param {Object} audio - An object mapping accent codes to audio URLs.
 * @param {string} preferred - The user's preferred accent code ("US", "UK", "AU", or "CA").
 */
function pickAudio(audio, preferred) {
  if (audio[preferred]) return { accent: preferred, url: audio[preferred], fallback: false };
  for (const a of FALLBACK_ORDER) {
    if (audio[a]) return { accent: a, url: audio[a], fallback: a !== preferred };
  }
  return null;
}

/**
 * Creates and returns a single DOM element from an HTML string.
 * @param {string} html - The HTML markup string to convert into a DOM element.
 */
function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/**
 * Initializes the search view by binding the accent preference selector and the word search form submission.
 */
export function initSearch() {
  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");
  const prefSelect = document.getElementById("accent-pref");
  const status = document.getElementById("search-status");
  const result = document.getElementById("search-result");
  const accents = document.getElementById("accent-row");
  const player = document.getElementById("audio-player");
  if (!form) return;

  prefSelect.value = getPreferredAccent();
  prefSelect.addEventListener("change", () => setPreferredAccent(prefSelect.value));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = input.value;
    status.textContent = "";
    result.innerHTML = "";
    accents.innerHTML = "";
    result.classList.add("loading");
    status.textContent = "Searching…";

    try {
      const entry = await fetchWord(q);
      result.classList.remove("loading");
      status.textContent = "";
      renderEntry(entry, { result, accents, player, status });
    } catch (err) {
      result.classList.remove("loading");
      if (err.message === "NOT_FOUND") {
        status.textContent = `Word not found. Check spelling and try another.`;
      } else if (err.message === "EMPTY") {
        status.textContent = `Type an English word.`;
      } else if (err.message === "NETWORK") {
        status.textContent = `Network error: the request was blocked before reaching the API (CORS/adblock/antivirus/VPN). The API itself works — try Incognito with extensions off, or another network.`;
      } else {
        status.textContent = `Error loading the word. Try again.`;
      }
    }
  });
}

/**
 * Renders the searched word's definitions, pronunciation button, save form, and accent explorer into the DOM.
 * @param {Object} entry - The normalized word data returned by the dictionary API.
 * @param {{result: HTMLElement, accents: HTMLElement, player: HTMLAudioElement, status: HTMLElement}} elements - The DOM container elements used to display the search results.
 * @param {HTMLElement} elements.result - The container element for the word card.
 * @param {HTMLElement} elements.accents - The container element for the accent explorer tiles.
 * @param {HTMLAudioElement} elements.player - The audio element used to play pronunciations.
 * @param {HTMLElement} elements.status - The status message element for displaying feedback or errors.
 */
function renderEntry(entry, { result, accents, player, status }) {
  const preferred = getPreferredAccent();
  const picked = pickAudio(entry.audio, preferred);

  const defsHtml = entry.meanings
    .map(
      (m) => `
      <div class="meaning">
        <p class="pos">${escapeHtml(m.partOfSpeech)}</p>
        ${m.definitions
          .map(
            (d) => `
          <p class="def">${escapeHtml(d.definition)}</p>
          ${d.example ? `<p class="ex">“${escapeHtml(d.example)}”</p>` : `<p class="ex missing">No example available.</p>`}`
          )
          .join("")}
      </div>`
    )
    .join("");

  const card = el(`
    <article>
      <h2>${escapeHtml(entry.word)}
        ${entry.phonetic ? `<span class="phon">/${escapeHtml(entry.phonetic)}/</span>` : ""}
      </h2>
      ${picked ? `<button type="button" class="btn-play" data-audio="${escapeHtml(picked.url)}">▶ Listen (${picked.accent})</button>` : `<p class="missing">No pronunciation available for this word.</p>`}
      ${picked?.fallback ? `<p class="notice">Accent ${preferred} unavailable, using ${picked.accent}.</p>` : ""}
      ${defsHtml || `<p class="missing">No definitions available.</p>`}
      <form class="save-form">
        <label>Level (you pick it, the API provides no CEFR)
          <select name="level" required>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1" selected>B1</option>
            <option value="B2">B2</option>
          </select>
        </label>
        <label>Note in Spanish (optional)
          <input name="note" maxlength="280" placeholder="E.g. false friend">
        </label>
        <button type="submit" class="btn-primary">Save word</button>
        <p class="save-msg" role="status" aria-live="polite"></p>
      </form>
    </article>
  `);
  result.appendChild(card);

  card.querySelector("[data-audio]")?.addEventListener("click", (e) => {
    player.src = e.currentTarget.dataset.audio;
    player.play().catch(() => {
      status.textContent = "Could not play audio.";
    });
  });

  const saveForm = card.querySelector(".save-form");
  const saveMsg = card.querySelector(".save-msg");
  saveForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(saveForm);
    const firstDef = entry.meanings[0]?.definitions[0]?.definition || "";
    try {
      saveWord({
        word: entry.word,
        definition: firstDef,
        level: String(data.get("level")),
        note: String(data.get("note") || ""),
      });
      saveMsg.textContent = "Saved to Vocabulary.";
    } catch (err) {
      saveMsg.textContent =
        err.message === "DUPLICATE" ? "That word is already saved." :
        err.message === "BAD_LEVEL" ? "Pick a level A1–B2." :
        "Could not save.";
    }
  });

  renderAccents(entry, { accents, player, preferred });
}

/**
 * Fetches country data and renders the accent explorer cards (US, UK, AU, CA) with flags and audio buttons.
 * @param {Object} entry - The normalized word data returned by the dictionary API.
 * @param {{accents: HTMLElement, player: HTMLAudioElement, preferred: string}} context - The DOM elements and user preference needed to render the accents.
 * @param {HTMLElement} context.accents - The container element where accent tiles are appended.
 * @param {HTMLAudioElement} context.player - The audio element used to play accent pronunciations.
 * @param {string} context.preferred - The user's currently selected preferred accent code.
 */
async function renderAccents(entry, { accents, player, preferred }) {
  let countries;
  try {
    countries = await fetchAccentCountries();
  } catch {
    accents.innerHTML = `<p class="missing">Could not load accent info.</p>`;
    return;
  }
  for (const a of FALLBACK_ORDER) {
    const c = countries[a];
    const url = entry.audio[a];
    const tile = el(`
      <div class="accent ${url ? "" : "disabled"}">
        ${c.flag ? `<img src="${c.flag}" alt="${escapeHtml(c.flagAlt)}" loading="lazy" width="48">` : ""}
        <p><strong>${a}</strong> · ${escapeHtml(c.name)}</p>
        <p class="muted">${escapeHtml(c.region)}</p>
        ${url ? `<button type="button" data-audio="${escapeHtml(url)}">Listen ${a}</button>` : `<p class="missing">No audio</p>`}
      </div>
    `);
    tile.querySelector("[data-audio]")?.addEventListener("click", (e) => {
      player.src = e.currentTarget.dataset.audio;
      player.play().catch(() => {});
    });
    accents.appendChild(tile);
  }
  if (entry.availableAccents.length === 0) {
    const note = el(`<p class="missing">No US/UK/AU/CA audio for this word.</p>`);
    accents.appendChild(note);
  }
}

/**
 * Escapes special HTML characters in a string to prevent XSS injection when rendering HTML.
 * @param {*} s - The input value to convert and escape as a safe HTML string.
 */
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}
