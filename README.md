# wdd330_project

> Working rules (mandatory header, always respect):
> 1. Work by phase, one phase at a time.
> 2. At the end of each phase, append a report below in this README without rewriting previous phases (append only).
> 3. This README is the phase completion report.
> 4. Each report includes: What I did / How I did it / Why I did it / Which Trello cards I resolved.
> 5. Format: `## Phase N — name` + those 4 sections in 3-5 lines max + links to key files. No long dumps.
> 6. Never `git commit` nor `git push`. Jean Pierre does that on review.

## Phase 1 — Base and layout
- What: `index.html`, `css/styles.css`, `js/modules/main.js` with Search/Vocabulary/Review/Progress nav and 4 base panels.
- How: static shell + dynamic `showView()` with `aria-current`, desktop topnav and mobile tabbar, `view-in` animation with `prefers-reduced-motion`, SEO meta and skip-link.
- Why: cover setup + responsive layout, Ubuntu identity/gradient only on actions for AA contrast, and set the entry point for Phases 2-5.
- Trello: `1 Project setup`, `2 Responsive layout and navigation` (base, without moving to Done, you move it).

## Phase 2 — Search and accents
- What: `js/modules/dictionaryApi.js`, `countriesApi.js`, `search.js` + search form, US/UK/AU preference and explorer in `index.html`.
- How: Dictionary parses `-us/-uk/-au` into `availableAccents` plus 404; Countries uses `alpha/` with `fields=` and 7-day cache; `pickAudio()` uses preferred or US→UK→AU fallback with notice, shimmer loading.
- Why: join both APIs as the teacher asked, report when an accent is missing, and never promise CEFR.
- Trello: `3 dictionaryApi.js module`, `4 Search view`, `8 Accent explorer` partial (cache/fields + audio-bound UI, without moving to Done).

## Phase 3 — Persistence and saving
- What: `js/modules/storage.js` + Save form in search with manual level and Spanish note.
- How: `localStorage` with `be_words_v1`/`be_preferred_accent`/`be_progress_v1`, `saveWord()` validates A1–B2 and duplicates, `recordReview()` with daily streak; search imports prefs from storage.
- Why: CEFR is manual (the API provides none), store word/definition/level/note/status and leave `recordReview()` ready for Phase 5.
- Trello: `5 storage.js (localStorage)`, `6 Save word` in code, without moving to Done.

## Phase 4 — Vocabulary and filters
- What: `js/modules/vocabulary.js` + Vocabulary panel with summary, filters and `Start review`.
- How: reads `getWords()`/`getProgress()`, filters by A1–B2 level and status, `setWordStatus()`/`deleteWord()` with re-render, Total/Learned/Streak summary, refresh on view enter.
- Why: complete the filterable list plus status change/delete, and open the door to Phase 5 Review/Progress.
- Trello: `7 Vocabulary list with filters` in code, `8` already covered in Phase 2, without moving to Done.

## Phase 5 — Review and progress
- What: `js/modules/review.js`, `progress.js` + Review/Progress panels in `index.html` and styles.
- How: queue of `new`/`learning` words, flip front/back, `Knew/Didn't know` updates status via `setWordStatus()` plus `recordReview()` streak; arrows/space keyboard, empty and complete states; progress shows totals per status plus reviews.
- Why: close the study loop with animation and keyboard support while keeping `reduced-motion` and English-only UI.
- Trello: `9 Flashcard review`, `10 Progress page` in code, without moving to Done.

## Phase 6 — Close and quality
- What: fixed `pickAudio()` unused param, added `eslint.config.js`, `package.json` with `npm run lint`, `.gitignore`; verified English-only UI/docs and file map.
- How: manual pass for 404/no-audio fallbacks, keyboard paths, `fields=` countries calls, gradient-on-actions contrast, landmarks/labels, `reduced-motion`; Node was unavailable here so `lint` is left for your machine.
- Why: meet W07 clean/ESLint/a11y/SEO/animation/static+dynamic rules and leave deploy ready without touching git.
- Trello: `11 Testing and bug fixes` in code, `12 Deployment and final submission` left to you (publish + Canvas), without moving to Done.