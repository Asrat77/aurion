# 001 — Motion-token foundation, kill `transition: all`

- **Status**: DONE
- **Commit**: uncommitted (fresh repo)
- **Severity**: HIGH
- **Category**: Easing & duration / Performance
- **Estimated scope**: 1 file (`src/app/globals.css`)

## Problem

All shared components animate with `transition: all var(--transition)` where
`--transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1)`. Two problems:

1. `transition: all` animates every property change off the GPU (layout/paint),
   and animates things we never intended.
2. `cubic-bezier(0.4, 0, 0.2, 1)` is the generic Material "standard" curve — too
   weak for deliberate UI motion, which should be a strong `ease-out`.

```css
/* src/app/globals.css:22 — current */
--transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
/* :121 .btn, :169 .card, :188 .input — current */
transition: all var(--transition);
```

## Target

Add motion tokens, then scope transitions to the exact GPU/color properties.

```css
/* target — add to :root in src/app/globals.css */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);     /* strong ease-out for UI */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);  /* iOS-like drawer curve */
--dur-press: 140ms;
--dur-hover: 200ms;
--dur-panel: 300ms;

/* .btn */   transition: transform var(--dur-press) var(--ease-out), background var(--dur-hover) var(--ease-out), box-shadow var(--dur-hover) var(--ease-out), color var(--dur-hover) var(--ease-out);
/* .card */  transition: transform var(--dur-hover) var(--ease-out), border-color var(--dur-hover) var(--ease-out), box-shadow var(--dur-hover) var(--ease-out);
/* .input */ transition: border-color var(--dur-hover) var(--ease-out), box-shadow var(--dur-hover) var(--ease-out);
```

Keep the legacy `--transition` var (other code references it) but stop using it
on these three selectors.

## Repo conventions to follow

- All design tokens live in `:root` in `src/app/globals.css` (e.g. `--gold`,
  `--radius-md`). Add the motion tokens in the same block.
- Tailwind v4 `@theme` mirrors color tokens; motion tokens are used from raw CSS
  only, so they don't need `@theme` entries.

## Steps

1. In `:root` (after `--transition`), add the five motion tokens above.
2. `.btn` (~:121): replace `transition: all var(--transition);` with the scoped `.btn` transition above.
3. `.card` (~:169): replace with the scoped `.card` transition.
4. `.input`/`select.input`/`textarea.input` (~:188): replace with the scoped `.input` transition.

## Boundaries

- Motion properties only. Do not touch colors, layout, or markup.
- Do not delete `--transition` (still referenced elsewhere).
- No new dependencies.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npx eslint .` clean; `npm run build` succeeds.
- **Feel check**: hover a `.btn` — background/lift eases out crisply (<300ms). In
  DevTools Animations panel at 10% speed, confirm no `width`/`height`/`margin`
  are animating (only transform/background/box-shadow/color/border).
- **Done when**: no `transition: all` remains on `.btn`/`.card`/`.input`.
