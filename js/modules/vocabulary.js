/**
 * @file Vocabulary view module. Renders the user's saved words, summary statistics,
 * level/status filters, status updates, and word deletion.
 */

import { getWords, setWordStatus, deleteWord, getProgress } from "./storage.js";

/**
 * Escapes special HTML characters in a string to prevent XSS injection when rendering HTML.
 * @param {*} s - The input value to convert and escape as a safe HTML string.
 */
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

/**
 * Updates the vocabulary summary counters and renders the filtered list of saved word cards.
 */
export function refreshVocabulary() {
  const summary = document.getElementById("vocab-summary");
  const list = document.getElementById("vocab-list");
  const levelFilter = document.getElementById("vocab-filter-level");
  const statusFilter = document.getElementById("vocab-filter-status");
  if (!summary || !list) return;

  const words = getWords();
  const progress = getProgress();
  const learned = words.filter((w) => w.status === "learned").length;

  summary.innerHTML = `
    <span>Total: <strong>${words.length}</strong></span>
    <span>Learned: <strong>${learned}</strong></span>
    <span>Streak: <strong>${progress.streak || 0}</strong></span>`;

  const level = levelFilter?.value || "all";
  const status = statusFilter?.value || "all";
  const filtered = words.filter(
    (w) =>
      (level === "all" || w.level === level) &&
      (status === "all" || w.status === status)
  );

  list.innerHTML = "";
  if (filtered.length === 0) {
    list.innerHTML = `<p class="muted">No words here yet. Search and save your first word.</p>`;
    return;
  }

  for (const w of filtered) {
    const card = document.createElement("article");
    card.className = "vocab-card";
    card.innerHTML = `
      <h3>${escapeHtml(w.word)} <span class="badge">${escapeHtml(w.level)}</span>
        <span class="badge status-${escapeHtml(w.status)}">${escapeHtml(w.status)}</span></h3>
      ${w.definition ? `<p class="def">${escapeHtml(w.definition)}</p>` : ""}
      ${w.note ? `<p class="ex">Note: ${escapeHtml(w.note)}</p>` : ""}
      <div class="vocab-actions">
        <label>Status
          <select data-status>
            ${["new", "learning", "learned"].map((s) => `<option value="${s}" ${w.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </label>
        <button type="button" data-del>Delete</button>
      </div>`;
    card.querySelector("[data-status]").addEventListener("change", (e) => {
      setWordStatus(w.id, e.target.value);
      refreshVocabulary();
    });
    card.querySelector("[data-del]").addEventListener("click", () => {
      if (confirm(`Delete "${w.word}"?`)) {
        deleteWord(w.id);
        refreshVocabulary();
      }
    });
    list.appendChild(card);
  }
}

/**
 * Initializes the vocabulary view by attaching filter and review button listeners and rendering the initial list.
 */
export function initVocabulary() {
  document.getElementById("vocab-filter-level")?.addEventListener("change", refreshVocabulary);
  document.getElementById("vocab-filter-status")?.addEventListener("change", refreshVocabulary);
  document.getElementById("vocab-start-review")?.addEventListener("click", () => {
    document.querySelector('[data-view="review"]')?.click();
  });
  refreshVocabulary();
}
