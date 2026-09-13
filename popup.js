const THRESHOLDS = { GREEN_MAX: 5, YELLOW_MAX: 30 };
const WEEKS_TO_SHOW = 10; // compact popup grid, ~10 calendar weeks
const MONTHS_TO_SHOW = 6;
const BADGE_MILESTONES = [
  { days: 90, label: "90-Day Peace" },
  { days: 30, label: "30-Day Peace" },
  { days: 7, label: "7-Day Peace" }
];

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function dateKey(d) { return `commits:${ymd(d)}`; }
function dateKeyFromOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return dateKey(d);
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

/** Build a Sunday-aligned week x day matrix ending today, like a GitHub heatmap. */
function buildCalendarGrid(weeksToShow, result) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysBack = weeksToShow * 7 - 1 - today.getDay(); // walk back to a Sunday
  const start = new Date(today);
  start.setDate(start.getDate() - daysBack);

  const columns = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const column = [];
    for (let dow = 0; dow < 7; dow++) {
      if (cursor > today) {
        column.push(null); // future day within the current week — not rendered
      } else {
        const key = dateKey(cursor);
        column.push({ date: new Date(cursor), count: result[key] });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    columns.push(column);
  }
  return columns;
}

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function renderWeekGrid(columns) {
  const grid = document.getElementById("grid");
  const monthLabels = document.getElementById("monthLabels");
  grid.innerHTML = "";
  monthLabels.innerHTML = "";

  let lastMonth = -1;
  columns.forEach((column) => {
    const firstReal = column.find((c) => c !== null);
    const label = document.createElement("span");
    if (firstReal && firstReal.date.getMonth() !== lastMonth) {
      label.textContent = MONTH_ABBR[firstReal.date.getMonth()];
      lastMonth = firstReal.date.getMonth();
    }
    monthLabels.appendChild(label);

    column.forEach((cellData) => {
      const cell = document.createElement("div");
      if (cellData === null) {
        cell.className = "cell";
        cell.style.visibility = "hidden";
      } else {
        cell.className = `cell ${colorForCount(cellData.count)}`;
        cell.title = cellData.count === undefined
          ? `${ymd(cellData.date)} — no data`
          : `${ymd(cellData.date)} — ${cellData.count} commits`;
      }
      grid.appendChild(cell);
    });
  });
}

function renderMonthView(result) {
  const container = document.getElementById("monthView");
  container.innerHTML = "";

  const today = new Date();
  const months = [];
  for (let i = MONTHS_TO_SHOW - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(d);
  }

  const monthTotals = months.map((monthStart) => {
    const y = monthStart.getFullYear();
    const m = monthStart.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const isCurrentMonth = y === today.getFullYear() && m === today.getMonth();
    const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;

    let total = 0, tracked = 0;
    for (let day = 1; day <= daysElapsed; day++) {
      const key = dateKey(new Date(y, m, day));
      if (result[key] !== undefined) { total += result[key]; tracked++; }
    }
    const avg = tracked > 0 ? total / tracked : undefined;
    return { label: MONTH_ABBR[m], total, avg };
  });

  const maxTotal = Math.max(1, ...monthTotals.map((m) => m.total));

  monthTotals.forEach((m) => {
    const row = document.createElement("div");
    row.className = "month-bar-row";

    const label = document.createElement("span");
    label.className = "month-bar-label";
    label.textContent = m.label;

    const track = document.createElement("div");
    track.className = "month-bar-track";
    const fill = document.createElement("div");
    fill.className = "month-bar-fill";
    fill.style.width = `${Math.round((m.total / maxTotal) * 100)}%`;
    const colorKey = colorForCount(m.avg);
    fill.style.background = colorKey === "empty" ? "var(--empty)" : `var(--${colorKey})`;
    track.appendChild(fill);

    const value = document.createElement("span");
    value.className = "month-bar-value";
    value.textContent = m.tracked === 0 ? "—" : m.total;

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    container.appendChild(row);
  });
}

function wireViewToggle() {
  const buttons = document.querySelectorAll("#viewToggle .toggle-btn");
  const gridBody = document.querySelector(".grid-body");
  const monthLabels = document.getElementById("monthLabels");
  const monthView = document.getElementById("monthView");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.toggle("active", b === btn));
      const isWeek = btn.dataset.view === "week";
      gridBody.hidden = !isWeek;
      monthLabels.hidden = !isWeek;
      monthView.hidden = isWeek;
    });
  });
}

function render(counts, result) {
  const todayCount = counts[0] ?? 0;
  const todayColor = colorForCount(todayCount);

  document.getElementById("todayCount").textContent = todayCount;
  document.getElementById("todayStatus").textContent = statusLabel(todayColor);
  document.getElementById("todayStatus").style.color =
    todayColor === "empty" ? "var(--muted)" : `var(--${todayColor === "yellow" ? "yellow" : todayColor === "red" ? "red" : "accent-text"})`;

  const { current, longest, badgeLabel } = computeStreaks(counts);
  document.getElementById("currentStreak").textContent = current;
  document.getElementById("longestStreak").textContent = longest;
  document.getElementById("badgeLabel").textContent = badgeLabel;

  renderWeekGrid(buildCalendarGrid(WEEKS_TO_SHOW, result));
  renderMonthView(result);
}

function loadAndRender() {
  const DAYS_FOR_STREAKS = WEEKS_TO_SHOW * 7 + 7;
  const keys = [];
  for (let i = 0; i < DAYS_FOR_STREAKS; i++) keys.push(dateKeyFromOffset(i));

  chrome.storage.local.get(keys, (result) => {
    const counts = keys.map((k) => result[k]);
    render(counts, result);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadAndRender();
  wireViewToggle();
});
