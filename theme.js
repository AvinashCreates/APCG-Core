/**
 * APCG theme engine — loads the saved palette + typeface from
 * chrome.storage.local and applies them as data-attributes on <html>,
 * which theme.css then reads. Shared by popup.js, dashboard.js, settings.js.
 */

const APCG_THEME_KEY = "apcg_theme_settings";

const APCG_PALETTES = [
  { id: "midnight-green", name: "Midnight Green", desc: "Default — dark, calm, focused" },
  { id: "swiss", name: "Swiss", desc: "White, black & signal red — order from chaos" },
  { id: "luxury-minimal", name: "Luxury Minimal", desc: "Black & gold — the scarcity signal" },
  { id: "harvest-neutral", name: "Harvest Neutral", desc: "Warm neutrals, cozy autumn" },
  { id: "burnt-sienna", name: "Burnt Sienna", desc: "Deep rust, warm dusk tones" },
  { id: "cozy-amber", name: "Cozy Amber", desc: "Golden, inviting, fireside" }
];

const APCG_FONTS = [
  { id: "poppins", name: "Poppins", sample: "Geometric sans · friendly, digital-native" },
  { id: "futura", name: "Futura", sample: "Geometric, modern, confident" },
  { id: "garamond", name: "Garamond", sample: "Classic, elegant, literary" },
  { id: "times", name: "Times New Roman", sample: "Traditional, highly legible" }
];

const APCG_THEME_DEFAULTS = { theme: "midnight-green", font: "poppins" };

function apcgApplyTheme(settings) {
  const s = Object.assign({}, APCG_THEME_DEFAULTS, settings || {});
  document.documentElement.setAttribute("data-theme", s.theme);
  document.documentElement.setAttribute("data-font", s.font);
  return s;
}

function apcgLoadTheme(callback) {
  chrome.storage.local.get([APCG_THEME_KEY], (result) => {
    const settings = apcgApplyTheme(result[APCG_THEME_KEY]);
    if (typeof callback === "function") callback(settings);
  });
}

function apcgSaveTheme(partial, callback) {
  chrome.storage.local.get([APCG_THEME_KEY], (result) => {
    const merged = Object.assign({}, APCG_THEME_DEFAULTS, result[APCG_THEME_KEY], partial);
    chrome.storage.local.set({ [APCG_THEME_KEY]: merged }, () => {
      apcgApplyTheme(merged);
      if (typeof callback === "function") callback(merged);
    });
  });
}

// Apply immediately (pre-DOMContentLoaded) to avoid a flash of default theme.
apcgLoadTheme();
