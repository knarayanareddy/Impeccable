# Command: audit (native — iOS/Android)

Platform-aware technical audit for native apps. Covers iOS and Android together; per-OS specifics
point at each platform's own conformance guidance. This variant replaces `audit.md` on native
projects — load one, not both.

## Steps

1. Establish the platform(s) in scope and their versions (from PRODUCT.md / the project config).
2. **Platform conformance**
   - iOS: against the platform's Human Interface Guidelines — navigation patterns, system
     components, safe areas, SF-symbols convention.
   - Android: against Material guidance — back handling, predictive-back, system bars, adaptive
     icons.
   - Deviations from platform patterns must be deliberate and named; silent invention of
     platform-like controls is a finding.
3. **Accessibility (screen readers)**
   - iOS/VoiceOver: accessibility labels, traits, and hints on every interactive element; custom
     controls have the full trait set (not label-only); rotor headings structure the screen.
   - Android/TalkBack: contentDescription, live regions (`announceForAccessibility`), focus
     order matches visual order.
   - Both: dynamic type / font scale up to the largest sizes without truncation; touch targets
     ≥ 44×44pt (iOS) / 48×48dp (Android) after scaling.
4. **Contrast and color** — same WCAG floor as web (4.5:1 text / 3:1 UI), plus dark-mode pairs
   verified on both platforms (automatic dark mode is the default expectation, not a feature).
5. **Adaptivity** — see `adapt.native.md`: phone ↔ tablet, split view, orientation, dynamic type
   class changes; no hard-coded dimensions.
6. **Performance** — main-thread blocking (frozen frames, slow lists without recycling —
   UICollectionView/LazyColumn), image decode, startup time, memory warnings.
7. **State & persistence** — state restoration across process death, orientation, and
   backgrounding; unsaved-state loss on interruption is a finding.
8. **Output** — the same ranked punch list as web `audit.md` (Blocker/Major/Minor/Nit), plus a
   platform column (iOS / Android / both).

## Rules

- Audit finds; it does not fix. Fixes route through the same commands as web (`polish`,
  `harden`, `align`-equivalents applied with platform tools).
- Judge against the platform's own conventions, not web habits — a custom control that matches
  the platform's patterns is correct even when it doesn't match the web's.
