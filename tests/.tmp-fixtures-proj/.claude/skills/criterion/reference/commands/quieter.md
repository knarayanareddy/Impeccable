# Command: quieter

Tone down aggressive or overstimulating data UI. `densify`'s sibling: densify adds information
per viewport, quieter removes noise — visual noise, motion noise, and color noise.

## Steps

1. Identify the noise sources: competing emphasis (three "primary" buttons per region), loud
   status colors, decorative gradients and shadows, motion on every transition, excessive
   contrast jumps, alert-styled information that is not an alert.
2. Reduce in this order:
   - **Emphasis:** one dominant action per region; the rest become secondary/tertiary
     (craft-floor's one-primary-action rule).
   - **Color:** status colors only where a status exists; accent reserved for active/selected;
     neutrals tinted, not gray (`domains/color.md`).
   - **Motion:** keep only comprehension motion; cut ambient and decorative animation
     (`domains/motion.md`).
   - **Depth:** shadows to hairlines; nested containers to one level.
3. Verify: the surface reads calmer in a 3-second glance; hierarchy still visible; check.mjs
   clean; contrast unchanged — quieter never trades contrast for calm.

## Rules

- Quieter reduces stimulation, not information — everything removed must be decoration, never
  data.
- The brief wins: if the brand demands loud, quiet only the data regions, not the brand moments.
