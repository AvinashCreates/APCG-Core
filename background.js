/**
 * APCG background service worker.
 * Owns the only piece of state this extension has: a local, per-day
 * commit count in chrome.storage.local. Nothing here ever leaves the
 * device — there is no network call in this file.
 */

const THRESHOLDS = { GREEN_MAX: 5, YELLOW_MAX: 30 };

function localDateKey(date = new Date()) {
  // Use the LOCAL calendar day, not UTC, so "today" matches the user's clock.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `commits:${y}-${m}-${d}`;
}

function colorForCount(count) {
  if (count <= THRESHOLDS.GREEN_MAX) return "green";
  if (count <= THRESHOLDS.YELLOW_MAX) return "yellow";
  return "red";
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "APCG_REGISTER_COMMIT") {
    const key = localDateKey();
    chrome.storage.local.get([key], (result) => {
      const total = (result[key] || 0) + 1;
      chrome.storage.local.set({ [key]: total }, () => {
        sendResponse({ success: true, totalToday: total, color: colorForCount(total) });
      });
    });
    return true; // keep the message channel open for the async sendResponse
  }

  if (message?.type === "APCG_GET_TODAY") {
    const key = localDateKey();
    chrome.storage.local.get([key], (result) => {
      const total = result[key] || 0;
      sendResponse({ totalToday: total, color: colorForCount(total) });
    });
    return true;
  }
});
