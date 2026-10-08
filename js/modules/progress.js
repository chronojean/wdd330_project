// Progress page: totals, per-status counts, streak, review totals.

import { getWords, getProgress } from "./storage.js";

export function refreshProgress() {
  const box = document.getElementById("progress-stats");
  if (!box) return;
  const words = getWords();
  const by = { new: 0, learning: 0, learned: 0 };
  for (const w of words) {
    if (by[w.status] !== undefined) by[w.status] += 1;
  }
  const p = getProgress();
  box.innerHTML = `
    <div class="stat"><span>Total words</span><strong>${words.length}</strong></div>
    <div class="stat"><span>New</span><strong>${by.new}</strong></div>
    <div class="stat"><span>Learning</span><strong>${by.learning}</strong></div>
    <div class="stat"><span>Learned</span><strong>${by.learned}</strong></div>
    <div class="stat"><span>Streak (days)</span><strong>${p.streak || 0}</strong></div>
    <div class="stat"><span>Reviews: knew</span><strong>${p.reviews?.known || 0}</strong></div>
    <div class="stat"><span>Reviews: didn't know</span><strong>${p.reviews?.unknown || 0}</strong></div>`;
}

export function initProgress() {
  document.getElementById("progress-start-review")?.addEventListener("click", () => {
    document.querySelector('[data-view="review"]')?.click();
  });
  refreshProgress();
}
