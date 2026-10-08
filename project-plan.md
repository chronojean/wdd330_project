# Benjamin English – WDD 330 Final Project Plan

Source: `Benjamin English - Final Project Proposal.pdf` + Trello board
`https://trello.com/b/JZ3mnbhu/benjamin-english-wdd-330-final-project`
+ `https://byui-cse.github.io/wdd330-ww-course/week07/final-project-requirements.html`
+ teacher feedback below.

## 1. Requirements (W07)

- HTML, CSS, vanilla JS only. No JS framework/library. CSS framework allowed.
- At least 2 third-party APIs, one cannot be OpenWeatherMap.
- All exposed features operational.
- Static + dynamically generated markup.
- CSS animation.
- Clean, commented, organized code (ES modules, classes).
- ESLint error free.
- Frontend standards: valid HTML/CSS, no a11y errors, SEO basics.

## 2. Teacher feedback (verbatim)

> Good work overall Jean Pierre Michel.
> You have a real audience and motivation, a clear module plan, mobile and desktop wireframes for every view, and a Trello board.
> The core idea is solid and clearly scoped for vanilla JS, but several requirements are met only implicitly or not addressed at all.
> Here are some points for you to consider. You may have these resolved with the project requirements set out in
> https://byui-cse.github.io/wdd330-ww-course/week07/final-project-requirements.html
>
> The REST Countries feature feels bolted on. The "accent explorer" shows the flags and regions of English-speaking countries. That data is basically static and could be hardcoded, and REST Countries has no accent data, so the API doesn't deliver what the feature promises. A stronger approach would tie it to the Free Dictionary response. Audio URLs there are often region-tagged (for example, -us.mp3, -uk.mp3, -au.mp3), so the explorer could show the flag and country info only for the accents that actually have audio for the current word. Then both APIs work together. Confirm current REST Countries usage ... it seems that the /all endpoint now requires a fields parameter. Maybe consider using the region or name endpoints with fields set.
> Check all your gradients with color contrast requirements. WCAG AA
> Not sure you named where you are going to use CSS Animation but I am sure you have figured it out
> Clarify that the user picks the A1–B2 level manually. The Free Dictionary API doesn't provide CEFR levels.
> The fallback plan for missing audio and examples is good. Make sure to handle the API's 404 response for unknown words.
>
> This is approvable and solid at its core as a project for WDD 330
> WDD 330 | Final Project Requirements

Interpretation:
1. Accent explorer bolted on — tie to Dictionary audio tags, show flag/country only for accents with audio.
2. REST Countries `/all` now requires `fields` — use `name/` or `region/` endpoints with `fields=`.
3. Gradients must pass WCAG AA contrast.
4. CSS animation location not named — must define.
5. A1–B2 is manual user pick, API has no CEFR.
6. Fallbacks good — must also handle 404 unknown words.

## 3. Current proposal snapshot

App for Spanish-speaking A1–B2 learners: search word, definitions/examples,
phonetic + audio, save with level + Spanish note, vocabulary list with filters,
flashcard review, progress + streak. No account, localStorage.

Modules: `dictionaryApi.js`, `countriesApi.js`, `storage.js`,
`vocabulary.js`, `review.js`, `main.js`.

Trello: Week 5 (6 cards), Week 6 (6 cards), Doing/Done empty.
Board: Benjamin English – WDD 330 Final Project, workspace WDD330 Project.

## 4. Accent preference decision (agreed)

- Global `preferredAccent` US/UK/AU selector in Search view, stored in localStorage. Default US.
- Per word, `dictionaryApi.js` exposes `availableAccents` from `phonetics[].audio`.
- Explorer shows 3 country cards with cached flag/region, enables only accents with audio.
- Player uses `preferredAccent` if available, else fallback US→UK→AU.
- If preferred unavailable: message e.g. `UK no audio for this word, using US`.
- If no audio at all: hide player, show `No pronunciation available`, disable explorer.
- If 404: `Word not found` empty state, no explorer call.

## 5. Trello updates applied (2026-10-08)

No cards deleted or added. Updated 8/12 descriptions:

- `3 dictionaryApi.js module`: Fetch from Free Dictionary API + parse `-us/-uk/-au` to `availableAccents`, handle 404 + missing fields. No CEFR.
- `4 Search view`: accent row only for accents with audio, `preferredAccent` + fallback message, no audio/examples placeholders, 404 empty state, shimmer animation.
- `6 Save word`: MANUALLY selected A1–B2 (user picks, no CEFR from API) + Spanish note.
- `8 Accent explorer`: `name/` endpoints with `?fields=name,flags,region,languages,cca2` (no bare `/all`), cache, show flag/region only for accents with audio, `No audio` disabled state. Both APIs together.
- `2 Responsive layout`: Ubuntu, ink/background, gradient only for key actions with WCAG AA, rounded + pills, tab transition + `prefers-reduced-motion`, SEO meta + landmarks.
- `5 storage.js`: words (word, definition, level manual, note, status) + `preferredAccent` + progress/streak.
- `9 Flashcard review`: CSS flip + keyboard, knew/didn't know, `prefers-reduced-motion`.
- `11 Testing and bug fixes`: phone/desktop, keyboard, API errors (404, no audio, fields param), gradient AA, a11y no errors, ESLint zero, reduced-motion.

Untouched (still valid): `1 Project setup`, `7 Vocabulary list with filters`, `10 Progress page`, `12 Deployment and final submission`.

## 6. Revised build order

### Phase 1 – Base (Trello 1-2)
- `index.html`, `css/`, `js/modules/` with `main.js` entry.
- Responsive: mobile bottom tab bar, desktop top nav Search / Vocabulary / Review / Progress.
- Identity: Ubuntu, #262626 on #FAFAFA, gradient #FCAF45→#E1306C→#833AB4 key actions only.

### Phase 2 – Search (Trello 3-4)
- `dictionaryApi.js` + 404 + missing-field fallbacks + accent tag parsing.
- Search view + accent row + preferred/fallback messaging.

### Phase 3 – Persistence (Trello 5-6)
- `storage.js` schema above.
- Save word form with manual level select.

### Phase 4 – Vocab + Countries cache (Trello 7-8)
- `vocabulary.js`: list, filters level/status, status change, delete, summary.
- `countriesApi.js` with `fields=` + cache.

### Phase 5 – Review + Progress (Trello 9-10)
- `review.js`: flip animation, knew/didn't know, status update.
- Progress: totals, per-status, streak.

### Phase 6 – Close (Trello 11-12)
- Testing matrix from updated card 11.
- ESLint, a11y, contrast, SEO.
- Deploy + Canvas submission. Move cards to Done.
