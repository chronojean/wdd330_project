/**
 * @file Application entry point. Manages view navigation (Search, Vocabulary, Review, Progress)
 * and initializes all feature modules on startup.
 */

import { initSearch } from "./search.js";
import { initVocabulary, refreshVocabulary } from "./vocabulary.js";
import { initReview, refreshReview } from "./review.js";
import { initProgress, refreshProgress } from "./progress.js";

const buttons = document.querySelectorAll("[data-view]");
const panels = document.querySelectorAll("[data-panel]");
const VALID_VIEWS = new Set(["search", "vocabulary", "review", "progress"]);

/**
 * Displays the selected view panel and hides all other panels.
 * @param {string} view - The name of the view to display ("search", "vocabulary", "review", or "progress").
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

/**
 * Sets up click event listeners on navigation buttons to switch views and refresh their data.
 */
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

/**
 * Initializes all application modules, navigation, and displays the default search view.
 */
function init() {
  initNavigation();
  initSearch();
  initVocabulary();
  initReview();
  initProgress();
  showView("search");
}

init();
