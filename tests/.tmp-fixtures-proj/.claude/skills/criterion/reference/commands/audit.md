# Command: audit

Technical quality check: accessibility, contrast, performance, responsive behavior, tokens. Finds the
defects — it does not fix them. No code edits.

## Steps

1. Establish scope: the target surface(s). Run `scripts/check.mjs --target <path>` first for the
   deterministic anti-pattern set.
2. **Accessibility** (per domains/accessibility.md):
   - Contrast scan on composites (not just declared values): every text/icon/border pairing — pass/fail
     with ratios.
   - Keyboard walk: every interactive element reachable, visible focus, logical order, no traps.
   - Semantics: buttons, `th scope`, labels, one h1, landmarks, `aria-live` on dynamic regions.
   - Screen-reader sanity on one table + one form (structure announced correctly?).
   - Reduced-motion and 200% zoom checks.
3. **Responsive:** render at 320 / 375 / 768 / 1280 — layout integrity, no page-level horizontal scroll,
   touch targets, data-view adaptation (does the table have column priority or a collapsed view?).
4. **Performance:** obvious blockers — render-blocking assets, unoptimized images, layout thrash,
   long tasks on interaction, oversized bundles; flag what `optimize` should fix.
5. **Tokens:** are colors/fonts/spacing from the design system or raw values? Count violations and
   list the top offenders.
6. **Output a ranked punch list:** severity (Blocker / Major / Minor), file:line, rule, and the fix.
   Blockers = craft-floor violations. Sort by severity then by user impact.

## Rules

- Screenshots at the widths you check; cite specific elements, never vague impressions.
- Do not fix anything in audit — the fix is a follow-up command (`polish`, `align`, `harden`...).
- End with a one-line verdict and the count per severity.
