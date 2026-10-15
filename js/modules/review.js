/**
 * @file Flashcard review module. Manages the review queue of unlearned words, card flipping,
 * keyboard shortcuts, and recording review answers.
 */

import { getWords, setWordStatus, recordReview } from "./storage.js";

let queue = [];
let index = 0;
let flipped = false;

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
 * Rebuilds the review queue with unlearned words, resets the session state, and renders the first flashcard.
 */
export function refreshReview() {
  queue = getWords().filter((w) => w.status !== "learned");
  index = 0;
  flipped = false;
  render();
}

/**
 * Renders the current flashcard, session progress counter, or empty/completion message into the review stage.
 */
function render() {
  const counter = document.getElementById("review-counter");
  const stage = document.getElementById("review-stage");
  if (!counter || !stage) return;
  stage.innerHTML = "";

  if (queue.length === 0) {
    counter.textContent = "";
    stage.innerHTML = `<p class="muted">Nothing to review. Save words in Search or check Vocabulary.</p>`;
    return;
  }
  if (index >= queue.length) {
    counter.textContent = "";
    stage.innerHTML = `<p><strong>Session complete.</strong> You reviewed ${queue.length} card(s).</p>`;
    return;
  }

  const card = queue[index];
  counter.textContent = `Card ${index + 1} of ${queue.length}`;

  const wrap = document.createElement("div");
  wrap.className = "flashcard";
  wrap.innerHTML = `
    <button type="button" class="flash-inner${flipped ? " flipped" : ""}" data-flip aria-pressed="${flipped}">
      <span class="flash-face flash-front">
        <strong>${escapeHtml(card.word)}</strong>
        <span class="badge">${escapeHtml(card.level)}</span>
        <span class="muted">Tap to flip</span>
      </span>
      <span class="flash-face flash-back">
        <span>${escapeHtml(card.definition || "No definition saved.")}</span>
        ${card.note ? `<span class="ex">Note: ${escapeHtml(card.note)}</span>` : ""}
      </span>
    </button>
    <div class="flash-actions">
      <button type="button" data-no>Didn't know</button>
      <button type="button" data-yes>Knew it</button>
    </div>`;
  stage.appendChild(wrap);

  wrap.querySelector("[data-flip]").addEventListener("click", () => {
    flipped = !flipped;
    render();
  });
  wrap.querySelector("[data-no]").addEventListener("click", () => answer(false));
  wrap.querySelector("[data-yes]").addEventListener("click", () => answer(true));
}

/**
 * Processes the user's answer for the current flashcard, updates word status and streak, and advances to the next card.
 * @param {boolean} known - True if the user knew the word, false otherwise.
 */
function answer(known) {
  const card = queue[index];
  if (!card) return;
  setWordStatus(card.id, known ? "learned" : "learning");
  recordReview(known);
  index += 1;
  flipped = false;
  render();
}

/**
 * Initializes the review view by setting up restart and keyboard navigation listeners and starting a review session.
 */
export function initReview() {
  document.getElementById("review-restart")?.addEventListener("click", refreshReview);
  document.getElementById("view-review")?.addEventListener("keydown", (e) => {
    if (index >= queue.length) return;
    if (e.key === "ArrowLeft") answer(false);
    if (e.key === "ArrowRight") answer(true);
    if (e.key === " " || e.key === "Enter") {
      const active = document.activeElement;
      if (active?.dataset?.flip !== undefined) return; // Let button handle it.
      e.preventDefault();
      flipped = !flipped;
      render();
    }
  });
  refreshReview();
}
