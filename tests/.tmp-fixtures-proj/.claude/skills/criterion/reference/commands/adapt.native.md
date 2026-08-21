# Command: adapt (native — iOS/Android)

Adapt native surfaces across device classes and orientations. The native twin of web `adapt.md`:
the breakpoints become size classes, the table→cards collapse becomes split-view and dynamic-type
adaptation. This variant replaces `adapt.md` on native projects — load one, not both.

## The adaptivity dimensions (phone ↔ tablet ↔ foldable)

1. **Size classes, not pixels.** Adapt on iOS size classes / Android window-size classes — the
   platform's own abstraction for phone vs tablet vs split-view. Hard-coded width checks are a
   finding.
2. **The density shift holds.** Compact density on phones (more content per screen) with
   comfortable density on tablets — the same tier system as web `adapt.md`, expressed via
   platform metrics (dynamic type aware, never fixed point sizes).
3. **Multi-pane patterns** — tablets and split view get the two-pane treatment (master-detail,
   navigation split) rather than a stretched phone layout; a tablet layout that is just a wider
   phone layout is a finding.

## The dimensions, by platform

- **iOS:** iPhone → iPad, Split View widths (1/3, 1/2, 2/3), Slide Over, Stage Manager,
  landscape vs portrait, Dynamic Type from smallest to Accessibility XXXL.
- **Android:** compact/medium/expanded window-size classes, orientation, multi-window and
  foldable postures (fold/half-open), font scale up to the platform maximum.

## Data views on native

- Column priority carries over from web: key columns first, actions last; collapse to card/row
  layouts at compact widths; frozen identity where the list scrolls horizontally.
- Lists use the platform's recycling machinery (UICollectionView diffable data sources,
  LazyColumn) — no manual cell management, no full re-render per scroll frame.

## Platform-to-platform strategy

- Same information architecture across iOS and Android; each platform expresses it in its own
  patterns. A shared skeleton with per-platform rendering beats two independently-designed apps.
- Web-to-native: keep the register (Command/Configure/Record/Convince) and the density tier; the
  visual world re-expresses in platform components — the web's exact layout is an
  anti-reference, not a spec.

## Steps

1. Define the device classes in scope (from PRODUCT.md / the project's target matrix).
2. Audit each surface at every class: phone portrait, tablet, split view (both platforms),
   maximum dynamic type — screenshots at each.
3. Fix per the dimensions above; verify no content is reachable-only-by-luck at any class
   (hidden behind scroll that shouldn't exist, clipped at max type).

## Rules

- Adapt keeps the same information hierarchy and register — it re-encodes per platform, never
  deletes content silently.
- Platform patterns beat imported web patterns every time; the job statement per viewport
  (from `new-work.md`) is the invariant across all classes.
