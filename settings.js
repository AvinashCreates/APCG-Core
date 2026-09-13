// Small static swatch colors purely for the picker cards below — these are
// fixed reference dots (not live CSS vars) so every palette is visible
// side-by-side regardless of which theme is currently active.
const PALETTE_PREVIEW_COLORS = {
  "midnight-green": ["#0a0a0b", "#3ad472", "#f2f2f3"],
  "swiss": ["#ffffff", "#e3312a", "#111111"],
  "luxury-minimal": ["#0b0b0a", "#c9a24b", "#f0ece2"],
  "harvest-neutral": ["#211c18", "#c98a4b", "#f3ece3"],
  "burnt-sienna": ["#1e1512", "#b1532b", "#f5e9e0"],
  "cozy-amber": ["#201a10", "#e0a736", "#f6efdd"]
};

const FONT_SAMPLE_STACK = {
  poppins: "'Poppins', sans-serif",
  futura: "Futura, 'Century Gothic', 'Futura Geometric', sans-serif",
  garamond: "Garamond, 'EB Garamond', Georgia, serif",
  times: "'Times New Roman', Times, serif"
};

function buildPaletteGrid(current) {
  const container = document.getElementById("paletteGrid");
  container.innerHTML = "";
  APCG_PALETTES.forEach((p) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `swatch-card${p.id === current.theme ? " selected" : ""}`;
    card.dataset.theme = p.id;

    const dots = document.createElement("div");
    dots.className = "swatch-dots";
    PALETTE_PREVIEW_COLORS[p.id].forEach((c) => {
      const dot = document.createElement("span");
      dot.className = "swatch-dot";
      dot.style.background = c;
      dots.appendChild(dot);
    });

    const name = document.createElement("span");
    name.className = "swatch-name";
    name.textContent = p.name;
    const desc = document.createElement("span");
    desc.className = "swatch-desc";
    desc.textContent = p.desc;

    card.appendChild(dots);
    card.appendChild(name);
    card.appendChild(desc);
    card.addEventListener("click", () => selectTheme(p.id));
    container.appendChild(card);
  });
}

function buildFontGrid(current) {
  const container = document.getElementById("fontGrid");
  container.innerHTML = "";
  APCG_FONTS.forEach((f) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `font-card${f.id === current.font ? " selected" : ""}`;
    card.dataset.font = f.id;

    const sample = document.createElement("div");
    sample.className = "font-sample";
    sample.style.fontFamily = FONT_SAMPLE_STACK[f.id];
    sample.textContent = "Aa Bg Wr";

    const name = document.createElement("span");
    name.className = "font-name";
    name.textContent = f.name;
    const desc = document.createElement("span");
    desc.className = "font-desc";
    desc.textContent = f.sample;

    card.appendChild(sample);
    card.appendChild(name);
    card.appendChild(desc);
    card.addEventListener("click", () => selectFont(f.id));
    container.appendChild(card);
  });
}

function markSelected(gridId, dataAttr, value) {
  document.querySelectorAll(`#${gridId} .swatch-card, #${gridId} .font-card`).forEach((card) => {
    card.classList.toggle("selected", card.dataset[dataAttr] === value);
  });
}

function flashSaveNote() {
  const note = document.getElementById("saveNote");
  note.classList.add("show");
  clearTimeout(flashSaveNote._t);
  flashSaveNote._t = setTimeout(() => note.classList.remove("show"), 1400);
}

function selectTheme(themeId) {
  apcgSaveTheme({ theme: themeId }, () => {
    markSelected("paletteGrid", "theme", themeId);
    flashSaveNote();
  });
}

function selectFont(fontId) {
  apcgSaveTheme({ font: fontId }, () => {
    markSelected("fontGrid", "font", fontId);
    flashSaveNote();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  apcgLoadTheme((current) => {
    buildPaletteGrid(current);
    buildFontGrid(current);
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    apcgSaveTheme(APCG_THEME_DEFAULTS, (settings) => {
      buildPaletteGrid(settings);
      buildFontGrid(settings);
      flashSaveNote();
    });
  });
});
