// Entry point: navigation + app startup (Phase 1-5).

import { initSearch } from "./search.js";
import { initVocabulary, refreshVocabulary } from "./vocabulary.js";
import { initReview, refreshReview } from "./review.js";
import { initProgress, refreshProgress } from "./progress.js";

const buttons = document.querySelectorAll("[data-view]");
const panels = document.querySelectorAll("[data-panel]");
const VALID_VIEWS = new Set(["search", "vocabulary", "review", "progress"]);

/**
 * Show one view, hide the rest.
 * @param {string} view - search | vocabulary | review | progress
 */
export function showView(view) {
  const target = VALID_VIEWS.has(view) ? view : "search";
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== target;
  });
  buttons.forEach((btn) => {
    if (btn.dataset.view === target) {
      btn.setAttribute("aria-current", "page");
    } else {
      btn.removeAttribute("aria-current");
    }
  });
}

function initNavigation() {
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      showView(btn.dataset.view);
      if (btn.dataset.view === "vocabulary") refreshVocabulary();
      if (btn.dataset.view === "review") refreshReview();
      if (btn.dataset.view === "progress") refreshProgress();
    });
  });
}

function init() {
  initNavigation();
  initSearch();
  initVocabulary();
  initReview();
  initProgress();
  showView("search");
}

init();
