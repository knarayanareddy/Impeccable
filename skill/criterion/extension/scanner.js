// Criterion scanner — injected into the page, collects computable anti-pattern evidence.
// Rule ids mirror skill/criterion/scripts/check.mjs where the check is computable from the DOM.
// Pure collection: no DOM mutation, no network, no storage. Exposed as window.__criterionScan
// so the popup can inject this file and then call the function.
(() => {
  const BANNED_FONTS = /\b(inter|roboto|arial|helvetica|open sans|lato|montserrat|poppins)\b/i;

  const el = (node) => {
    const n = node.nodeName.toLowerCase();
    if (node.id) return n + "#" + node.id;
    if (node.className && typeof node.className === "string") {
      const c = node.className.trim().split(/\s+/).slice(0, 2).join(".");
      if (c) return n + "." + c;
    }
    return n;
  };

  window.__criterionScan = () => {
    const findings = [];

    // --- style rules (check.mjs parity) ---
    for (const node of document.querySelectorAll("*")) {
      const s = getComputedStyle(node);

      // banned-font (T1)
      const ff = s.fontFamily;
      if (ff && BANNED_FONTS.test(ff) && !/IBM Plex|Public Sans|Source Sans|JetBrains|Space Grotesk/i.test(ff)) {
        findings.push({ rule: "banned-font", severity: "warning",
          message: "Banned default font — choose a deliberate typeface.",
          detail: ff.split(",")[0].trim(), el: el(node) });
      }

      // pure-black (C3)
      const black = (v) => /^rgb\(0,\s*0,\s*0\)$|^#000$|^black$/i.test(v.trim());
      if (black(s.color) || black(s.backgroundColor)) {
        findings.push({ rule: "pure-black", severity: "error",
          message: "Pure black — use a tinted near-black.", detail: s.color, el: el(node) });
      }

      // pure-gray-text (C2) — the known weak grays as text color
      if (/^rgb\((?:107,\s*114,\s*128|156,\s*163,\s*175|161,\s*161,\s*170|128,\s*128,\s*128)\)$/.test(s.color.trim())) {
        findings.push({ rule: "pure-gray-text", severity: "warning",
          message: "Pure gray as text — likely below 4.5:1 on light surfaces.",
          detail: s.color, el: el(node) });
      }

      // gray-on-color (C2) — gray text sitting on a chromatic background
      const isGray = (v) => { const m = v.match(/(\d+),\s*(\d+),\s*(\d+)/); return m && Math.max(...m.slice(1)) - Math.min(...m.slice(1)) < 20; };
      const isChromatic = (v) => { const m = v.match(/(\d+),\s*(\d+),\s*(\d+)/); return m && Math.max(...m.slice(1)) - Math.min(...m.slice(1)) >= 20; };
      if (isGray(s.color) && s.backgroundColor && s.backgroundColor !== "rgba(0, 0, 0, 0)" && isChromatic(s.backgroundColor)) {
        findings.push({ rule: "gray-on-color", severity: "warning",
          message: "Gray text on a colored background — verify the pair ≥ 4.5:1.",
          detail: s.color + " on " + s.backgroundColor, el: el(node) });
      }

      // radius-too-large (S3) — data-dense regions only; avatars/icons exempt
      const r = parseFloat(s.borderRadius) || 0;
      const avatarish = /(avatar|img|icon|logo|profile|photo|thumb)/i.test(el(node));
      if (r >= 16 && !avatarish) {
        findings.push({ rule: "radius-too-large", severity: "warning",
          message: "Radius ≥16px on a data-dense region — 4–8px belongs in Command/Configure.",
          detail: s.borderRadius, el: el(node) });
      }

      // purple-blue-gradient (C1)
      const bg = s.backgroundImage || "";
      if (/gradient/i.test(bg)) {
        const purple = /#(?:6366f1|8b5cf6|7c3aed|a855f7|4f46e5|6d28d9|9333ea)\b/i.test(bg);
        const blue = /#(?:3b82f6|2563eb|1d4ed8|0ea5e9|60a5fa)\b/i.test(bg);
        if (purple && blue) {
          findings.push({ rule: "purple-blue-gradient", severity: "error",
            message: "Purple→blue gradient — the category-level AI fingerprint.",
            detail: bg.slice(0, 80), el: el(node) });
        }
      }

      // elastic-easing (I1)
      const ease = s.transitionTimingFunction || s.animationTimingFunction;
      if (ease) {
        const bez = ease.match(/cubic-bezier\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)/);
        if (bez) {
          const vals = bez.slice(1).map(Number);
          if (vals.some((v) => v < 0 || v > 1)) {
            findings.push({ rule: "elastic-easing", severity: "error",
              message: "Bounce/elastic/back easing — reads as a toy in tools.", detail: ease, el: el(node) });
          }
        }
      }

      // transition-all (I2)
      if (s.transitionProperty && s.transitionProperty.split(",").some((p) => p.trim() === "all")) {
        findings.push({ rule: "transition-all", severity: "warning",
          message: "`transition: all` — transition the specific property.", detail: s.transitionProperty, el: el(node) });
      }

      // slow-feedback (I2) — >500ms on any transition/animation
      const dur = (v) => { const m = String(v).match(/([\d.]+)s/); return m ? parseFloat(m[1]) * 1000 : 0; };
      const dMax = Math.max(dur(s.transitionDuration), dur(s.animationDuration));
      if (dMax > 500) {
        findings.push({ rule: "slow-feedback", severity: "warning",
          message: "Motion over 500ms on feedback — task motion must be ≤300ms.",
          detail: dMax + "ms", el: el(node) });
      }
    }

    // deprecated elements (blink/marquee)
    for (const tag of ["blink", "marquee"]) {
      for (const node of document.querySelectorAll(tag)) {
        findings.push({ rule: "deprecated-motion", severity: "error",
          message: "<" + tag + "> is removed/obsolete — cut it.", detail: "<" + tag + ">", el: el(node) });
      }
    }

    // img-no-lazy (D1) — img without loading, excluding the first-viewport candidate
    let first = true;
    for (const img of document.querySelectorAll("img")) {
      if (!img.hasAttribute("loading") && !img.hasAttribute("width") && !img.hasAttribute("height")) {
        findings.push({ rule: "img-no-lazy", severity: first ? "info" : "warning",
          message: "<img> without loading/width/height — lazy-load below the fold and reserve layout.",
          detail: img.src ? img.src.slice(0, 60) : "(no src)", el: el(img) });
      }
      first = false;
    }

    return { findings, scanned: document.querySelectorAll("*").length };
  };
})();
