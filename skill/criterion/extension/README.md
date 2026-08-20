# Criterion Design Detector — browser extension

The browser half of the deterministic detector: runs the criterion anti-pattern rules against
the **live DOM** of whatever page you're viewing. No LLM, no API key, no data leaves the
browser.

Rule ids mirror `../scripts/check.mjs` where the rule is computable from computed styles;
DOM-only rules (`img-no-lazy`, `deprecated-motion`) use the same ids as the CLI.

## Install

1. Open `chrome://extensions` (or `edge://extensions` / `brave://extensions`).
2. Enable **Developer mode**.
3. **Load unpacked** → select this `extension/` folder.
4. Pin the extension; click **Scan this page** on any tab.

## What it detects (from computed styles)

| Rule | What |
|---|---|
| `banned-font` | Inter/Roboto/Arial/… as a computed font |
| `pure-black` | `#000` text or backgrounds |
| `pure-gray-text` | the known weak grays as text color |
| `gray-on-color` | gray text on chromatic backgrounds |
| `radius-too-large` | ≥16px radius (avatar/icon elements exempt) |
| `purple-blue-gradient` | the purple→blue fingerprint, computed |
| `elastic-easing` | cubic-bezier with out-of-range values |
| `transition-all` / `slow-feedback` | `transition: all`, >500ms motion |
| `deprecated-motion` | `<blink>` / `<marquee>` |
| `img-no-lazy` | images without loading/width/height |

## Known limitations

- Same-origin iframes are scanned recursively; cross-origin frames are skipped (no access).
- `img-no-lazy` marks the first image as a note (assumed LCP candidate) — a heuristic, not a
  fact; treat notes as prompts to look.
- Computed styles only: rules that need source-level signals (e.g., `SELECT *`) stay CLI-only.

## Relationship to the CLI

- The CLI (`scripts/check.mjs`) is the source-code checker (pre-merge, CI).
- The extension is the **live-page** checker (post-deploy, any site).
- Both speak the same rule vocabulary; a CLI finding means the code must change, an extension
  finding means the rendered page currently violates the floor.
