# APCG — Anti-Procrastination Commitment Grid (v0.1)

A private, local-only Chrome extension that turns "fully watched Reels" into
a GitHub-style contribution grid — inverted, so an empty grid is the win.

## What's actually working in this version
- Detects a completed Reel view on `instagram.com` by watching the `<video>`
  playhead loop (or `ended` fire) while the reel is visibly on screen.
- Stores one counter per **local calendar day** in `chrome.storage.local` —
  nothing leaves the device, no network calls exist in this codebase yet.
- Popup shows: today's count + status color, current streak, longest streak,
  badge earned (7/30/90-day), and a 20-week grid.

## v0.3 — Consolidated into one dashboard
Everything that used to live in the separate `apcg-site` (Home, How it works,
Dev log, About, Privacy, Contact) now lives **inside `dashboard.html` alone**,
as nav-switched sections with hash routing (`dashboard.html#about`, etc).
There is only ever one HTML page besides the popup — no other `.html` files
ship in this extension. `popup.html` now links to just that one dashboard.

## v0.2 — UI pass
`popup.html/css` and `dashboard.html/css/js` (a full-tab expanded view,
linked from the popup) were redesigned to match a dark/green editorial style
you supplied as a reference — no pricing or login screens, since none apply
to a local-only tool. Same underlying tracking logic as v0.1.

## Load it locally (unpacked)
1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this `apcg-extension` folder.
4. Visit `instagram.com`, watch some Reels, then click the extension icon.

## Known limitations (deliberately left for the next iteration)
- **Detection accuracy**: Instagram's DOM changes often; the loop-wrap
  heuristic works today but is the single most fragile part of this project.
  Worth logging edge cases (e.g. autoplay muted previews, ads) as you test.
- **Mobile (the 98% problem)**: this only runs where Chromium extensions run
  (desktop Chrome, or mobile Chromium forks like Kiwi/Yandex). There is no
  way to run a Manifest V3 extension inside the real Instagram iOS/Android
  app — that's a hard platform wall, not a bug to fix. Worth deciding early
  whether "mobile via Kiwi Browser" is an acceptable answer for your
  portfolio scope, or whether you scope v1 to desktop-only and document the
  mobile constraint honestly as a design tradeoff.
- **No sync/backend yet**: the PRDs describe a web dashboard + sync backend.
  Nothing here talks to a server. That's a separate, later build — trying to
  do both at once is likely why the original PRD sprawled.
- **Streak-across-installs**: if a day has zero recorded data (extension not
  installed / not used that day), it's currently treated as a *gap*, not a
  break — otherwise your streak would falsely reset the moment you install
  the extension. Worth deciding if that's the behavior you want long-term.

## Suggested next slice (pick one, not all)
1. Harden the detection logic against Instagram's actual current DOM
   (I don't have live access to test against the real site's markup).
2. Build the "Content Inversion Filter" (blur Reels tab once in the Red
   zone) as a second content-script feature.
3. Start the web dashboard as a fully separate project that only reads an
   exported JSON from the extension — no backend, no sync yet.
