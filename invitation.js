/* ==========================================================================
   AIKA — scroll-driven "Love, Aika" morph
   The signature text lives as ONE fixed-position element. On every scroll
   frame we measure where it should be (position + font-size) by
   interpolating between its "hero" state (centered, huge, on the landing
   section) and its "settled" state (small, sitting inside the homepage
   panel, matching the reference layout).
   ========================================================================== */

(function () {
  "use strict";

  var track   = document.getElementById("morph-track");
  var slot    = document.getElementById("signature-slot");
  var signature;

  // ---- build the signature element once ----
  function buildSignature() {
    signature = document.createElement("div");
    signature.id = "signature";
    signature.setAttribute("aria-hidden", "true"); // decorative echo; real text is in the DOM flow elsewhere for a11y
    signature.innerHTML =
      '<span class="word word--love">Love,</span>' +
      '<span class="word word--aika">Aika</span>';
    document.body.appendChild(signature);
  }

  // ---- accessible, non-animated text for screen readers ----
  function addAccessibleHeading() {
    var h1 = document.createElement("h1");
    h1.className = "sr-only-signature";
    h1.style.position = "absolute";
    h1.style.width = "1px";
    h1.style.height = "1px";
    h1.style.overflow = "hidden";
    h1.style.clip = "rect(0 0 0 0)";
    h1.textContent = "Love, Aika — An Evening of Elegance, October 24, 2026";
    document.body.insertBefore(h1, document.body.firstChild);
  }

  // ---- measurement helpers ----
  // HERO state: centered in the landing viewport, large.
  function getHeroRect() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var fontSize = clamp(vw * 0.11, 64, 168); // big, matches "Love," headline scale
    return {
      centerX: vw / 2,
      centerY: vh * 0.60, // sits in the reserved .landing__stack area
      fontSize: fontSize
    };
  }

  // SETTLED state: matches the reserved slot inside the homepage panel.
  function getSettledRect() {
    var r = slot.getBoundingClientRect();
    // Font-size driven primarily off slot HEIGHT (not width) so the two-line
    // script signature reliably fits inside the reserved box on any viewport,
    // including narrow mobile widths where panel width stays large but the
    // slot height is comparatively tighter.
    var fontSize = clamp(r.height * 0.46, 28, 66);
    return {
      centerX: r.left + r.width * 0.30,
      centerY: r.top + r.height * 0.46,
      fontSize: fontSize
    };
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // ---- scroll progress across the morph track ----
  function getProgress() {
    var trackRect = track.getBoundingClientRect();
    var trackTop = trackRect.top;
    var trackHeight = trackRect.height;
    var vh = window.innerHeight;

    // progress = 0 when track's top reaches viewport top (landing fully shown, about to leave)
    // progress = 1 when track's bottom reaches viewport top (homepage fully in place)
    var raw = (0 - trackTop) / (trackHeight - vh * 0.15);
    return clamp(raw, 0, 1);
  }

  var ticking = false;

  function update() {
    ticking = false;

    var p = getProgress();
    var eased = easeInOutCubic(p);

    var hero = getHeroRect();
    var settled = getSettledRect();

    var cx = lerp(hero.centerX, settled.centerX, eased);
    var cy = lerp(hero.centerY, settled.centerY, eased);
    var fs = lerp(hero.fontSize, settled.fontSize, eased);

    signature.style.left = cx + "px";
    signature.style.top = cy + "px";
    signature.style.fontSize = fs + "px";
    signature.style.transform = "translate(-42%, -50%)"; // visually center the script text's ink

    // ambient florals: fade slightly as we settle into the homepage
    document.querySelectorAll(".floral").forEach(function (f) {
      f.style.opacity = String(lerp(0.9, 0.5, eased));
    });
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  // ---- first-visit fade-in ----
  // Both .landing__inner and #signature fade in together, driven purely by
  // the body.is-loading class (see style.css). We only need to remove the
  // class one frame after paint so the browser registers the initial
  // (hidden) state before the transition starts — otherwise the browser
  // may collapse the "from" and "to" states into a single frame and skip
  // the animation entirely.
  function playLoadFade() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        document.body.classList.remove("is-loading");
      });
    });
  }

  function init() {
    buildSignature();
    addAccessibleHeading();
    update();
    playLoadFade();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();