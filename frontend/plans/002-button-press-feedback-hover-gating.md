# 002 — Button press feedback + gate hovers to hover devices

- **Status**: DONE
- **Commit**: uncommitted (fresh repo)
- **Severity**: HIGH (press feedback) / MEDIUM (hover gating)
- **Category**: Physicality & origin / Accessibility
- **Estimated scope**: 1 file (`src/app/globals.css`)
- **Depends on**: 001 (motion tokens)

## Problem

`.btn` responds only on `:hover` with a `translateY(-2px)` lift, and only on
release-adjacent states — there is no **press** feedback. Apple's rule: respond
on pointer-down, instantly. Also the hover lift fires on touch devices as a
false hover after tap.

```css
/* src/app/globals.css — current */
.btn-primary:hover { ... transform: translateY(-2px); }
.card:hover { ... transform: translateY(-3px); }
```

## Target

```css
/* target */
.btn:active { transform: scale(0.97); transition: transform var(--dur-press) var(--ease-out); }

/* gate lifts behind real hover */
@media (hover: hover) and (pointer: fine) {
  .btn-primary:hover { background: var(--gold-light); box-shadow: 0 8px 30px rgba(200,164,92,0.4); transform: translateY(-2px); }
  .card:hover { border-color: var(--border-gold); box-shadow: var(--shadow-gold); transform: translateY(-3px); }
}
```

`:active` scale must not be gated (touch users need press feedback too). Keep the
scale subtle (0.97).

## Repo conventions to follow

- `apple-design` skill exemplar: `.button:active { transform: scale(0.97); transition: transform 100ms ease-out; }` — we use the 140ms `--dur-press` token from plan 001 for consistency.

## Steps

1. Add `.btn:active { transform: scale(0.97); transition: transform var(--dur-press) var(--ease-out); }`.
2. Move `.btn-primary:hover` and `.card:hover` transform/box-shadow rules inside a `@media (hover: hover) and (pointer: fine)` block. Leave non-motion hover styling (e.g. `.btn-outline:hover` background) as-is or move too — but movement/shadow especially must be gated.
3. Also gate ProductCard's Tailwind `hover:-translate-y-1` — see plan 004 (handled there) or convert here if simpler.

## Boundaries

- Do not change button colors or sizes.
- `:disabled { transform: none !important; }` already exists — keep it; it must still win over `:active`.

## Verification

- **Mechanical**: `tsc`/`eslint`/`build` clean.
- **Feel check**: press-and-hold any button — it dips to 0.97 instantly and
  springs back on release. On a touch device (or DevTools device mode), tapping a
  button does NOT leave it stuck in the lifted state.
- **Done when**: every `.btn` has press feedback; hover lifts only apply on
  `hover: hover` devices.
