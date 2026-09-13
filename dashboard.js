const THRESHOLDS = { GREEN_MAX: 5, YELLOW_MAX: 30 };
const DAYS_TO_SHOW = 210; // 30-wide grid, ~7 months
const BADGE_MILESTONES = [
  { days: 90, label: "90-Day Peace" },
  { days: 30, label: "30-Day Peace" },
  { days: 7, label: "7-Day Peace" }
];

function dateKeyFromOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `commits:${y}-${m}-${day}`;
}

function colorForCount(count) {
  if (count === undefined) return "empty";
  if (count <= THRESHOLDS.GREEN_MAX) return "green";
  if (count <= THRESHOLDS.YELLOW_MAX) return "yellow";
  return "red";
}

function statusLabel(color) {
  switch (color) {
    case "green": return "Peace achieved";
    case "yellow": return "Controlled budget";
    case "red": return "Procrastination zone";
    default: return "No reels watched yet";
  }
}

function computeStreaks(countsByOffset) {
  let current = 0;
  for (let i = 0; i < countsByOffset.length; i++) {
    const count = countsByOffset[i];
    if (count === undefined) {
      if (i === 0) continue;
      break;
    }
    if (count <= THRESHOLDS.YELLOW_MAX) current++; else break;
  }

  let longest = 0, running = 0;
  for (const count of countsByOffset) {
    if (count !== undefined && count <= THRESHOLDS.YELLOW_MAX) {
      running++;
      longest = Math.max(longest, running);
    } else if (count !== undefined) {
      running = 0;
    }
  }

  const badge = BADGE_MILESTONES.find((b) => current >= b.days);
  return { current, longest, badgeLabel: badge ? badge.label : "—" };
}

function render(counts) {
  const todayCount = counts[0] ?? 0;
  const todayColor = colorForCount(todayCount);

  document.getElementById("todayCount").textContent = todayCount;
  document.getElementById("todayStatus").textContent = statusLabel(todayColor);

  const { current, longest, badgeLabel } = computeStreaks(counts);
  document.getElementById("currentStreak").textContent = current;
  document.getElementById("longestStreak").textContent = longest;
  document.getElementById("badgeLabel").textContent = badgeLabel;

  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  for (let i = counts.length - 1; i >= 0; i--) {
    const cell = document.createElement("div");
    cell.className = `cell ${colorForCount(counts[i])}`;
    cell.title = counts[i] === undefined ? "No data" : `${counts[i]} commits`;
    grid.appendChild(cell);
  }
}

function loadAndRender() {
  const keys = [];
  for (let i = 0; i < DAYS_TO_SHOW; i++) keys.push(dateKeyFromOffset(i));

  chrome.storage.local.get(keys, (result) => {
    const counts = keys.map((k) => result[k]);
    render(counts);
  });
}

/**
 * Single-page router: every "page" (Home, How it works, Dev log, About,
 * Privacy, Contact) lives in this one dashboard.html as a <section class="page">,
 * shown/hidden by hash. No other .html files exist — this is deliberate,
 * so the whole site travels as one file inside the extension.
 */
const VALID_PAGES = ["home", "how", "blog", "about", "privacy", "contact"];

function showPage(pageId) {
  const target = VALID_PAGES.includes(pageId) ? pageId : "home";

  document.querySelectorAll(".page").forEach((el) => {
    el.classList.toggle("active", el.id === `page-${target}`);
  });
  document.querySelectorAll("[data-page]").forEach((el) => {
    el.classList.toggle("active", el.dataset.page === target);
  });
  window.scrollTo({ top: 0 });
}

function routeFromHash() {
  const hash = location.hash.replace("#", "");
  showPage(hash);
}

document.addEventListener("DOMContentLoaded", () => {
  loadAndRender();
  routeFromHash();
});
window.addEventListener("hashchange", routeFromHash);
