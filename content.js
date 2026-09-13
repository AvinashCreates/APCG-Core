/**
 * APCG content script
 * Runs only on instagram.com (see manifest host_permissions).
 * Detects one "Commit" = one Reel watched to completion, defined as
 * the video's playhead wrapping from near-duration back to the start
 * while the video is actually visible on screen (the active reel).
 *
 * Reels loop, so "completion" isn't a single play/ended event — it's
 * detected as a loop-wrap. This intentionally counts each full loop,
 * since watching the same reel twice in a row is still two commits
 * of attention.
 */

const REEL_CONFIG = {
  MIN_DURATION_SEC: 3,      // ignore stray non-reel video elements
  MAX_DURATION_SEC: 180,    // ignore long-form video (e.g. IGTV/live)
  WRAP_TAIL_SEC: 0.75,      // "near duration" window that counts as the end
  WRAP_HEAD_SEC: 0.75,      // "near zero" window that counts as the restart
  VISIBILITY_THRESHOLD: 0.6 // fraction of the video that must be on-screen
};

const observedVideos = new WeakMap(); // video -> { lastTime, isVisible, awaitingWrap }
const visibilityObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const state = observedVideos.get(entry.target);
      if (state) state.isVisible = entry.intersectionRatio >= REEL_CONFIG.VISIBILITY_THRESHOLD;
    }
  },
  { threshold: [0, REEL_CONFIG.VISIBILITY_THRESHOLD, 1] }
);

function isReelLikeVideo(video) {
  const d = video.duration;
  return !isNaN(d) && d >= REEL_CONFIG.MIN_DURATION_SEC && d <= REEL_CONFIG.MAX_DURATION_SEC;
}

function attachVideo(video) {
  if (observedVideos.has(video)) return;

  const state = { lastTime: 0, isVisible: false, awaitingWrap: false };
  observedVideos.set(video, state);
  visibilityObserver.observe(video);

  video.addEventListener("timeupdate", () => {
    if (!isReelLikeVideo(video)) return;
    const { duration, currentTime } = video;
    const prev = state.lastTime;

    const nearEnd = currentTime >= duration - REEL_CONFIG.WRAP_TAIL_SEC;
    const nearStart = currentTime <= REEL_CONFIG.WRAP_HEAD_SEC;
    const wentBackwardsSharply = prev - currentTime > duration * 0.5;

    if (nearEnd) {
      state.awaitingWrap = true;
    }

    if (state.awaitingWrap && nearStart && wentBackwardsSharply) {
      state.awaitingWrap = false;
      if (state.isVisible && document.visibilityState === "visible") {
        registerCommit(video.currentSrc || video.src, duration);
      }
    }

    state.lastTime = currentTime;
  });

  // A normal (non-looping) <video> firing 'ended' also counts as one commit.
  video.addEventListener("ended", () => {
    if (isReelLikeVideo(video) && state.isVisible && document.visibilityState === "visible") {
      registerCommit(video.currentSrc || video.src, video.duration);
    }
  });
}

function scanForVideos() {
  document.querySelectorAll("video").forEach(attachVideo);
}

function registerCommit(sourceId, duration) {
  chrome.runtime.sendMessage(
    { type: "APCG_REGISTER_COMMIT", payload: { sourceId, duration, timestamp: Date.now() } },
    (response) => {
      if (chrome.runtime.lastError) {
        // Extension context can be invalidated on reload; fail silently.
        return;
      }
      if (response && response.success) {
        console.debug(`[APCG] Commit #${response.totalToday} today`);
      }
    }
  );
}

// Instagram is a heavy SPA — new <video> elements are added continuously
// as the user scrolls the Reels feed. Watch the DOM for new ones.
const domObserver = new MutationObserver(scanForVideos);
domObserver.observe(document.documentElement, { childList: true, subtree: true });

scanForVideos();
