# 005 — Global `prefers-reduced-motion` guard

- **Status**: DONE
- **Commit**: uncommitted (fresh repo)
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file (`src/app/globals.css`)
- **Depends on**: 001–004 (so the guard covers the new motion)

## Problem

Nothing in the app respects `prefers-reduced-motion`. Users who request reduced
motion still get drawer slides, modal scales, toast movement, hover lifts, and
button presses.

## Target

Reduced motion means **fewer and gentler**, not zero — keep opacity/color
feedback, drop movement and scaling.

```css
/* target — add near the end of src/app/globals.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 120ms !important; /* keep opacity/color, but snappy */
    scroll-behavior: auto !important;
  }
  /* Drop movement/scale specifically, keep the fade */
  .btn:active { transform: none !important; }
  .btn-primary:hover, .card:hover { transform: none !important; }
}
```

## Repo conventions to follow

- Global rules live at the bottom of `src/app/globals.css` after component
  classes (that's where the reset and utility rules already sit).

## Steps

1. Append the `@media (prefers-reduced-motion: reduce)` block above to the end of
   `globals.css`.
2. Verify the transform-nulling selectors match the ones introduced in plans
   001–004 (adjust if class names differ).

## Boundaries

- Do not remove opacity/color transitions — comprehension feedback stays.
- Do not add JS; this is CSS-only. (Components using the rAF mount flag still
  mount; the transition-duration cap keeps their movement minimal.)

## Verification

- **Mechanical**: `tsc`/`eslint`/`build` clean.
- **Feel check**: DevTools → Rendering → "Emulate prefers-reduced-motion:
  reduce". Open cart drawer, auth modal, dropdown, fire a toast, press a button:
  opacity still changes, but there is no sliding/scaling/lifting movement.
- **Done when**: with reduced-motion on, no element visibly translates or scales.
