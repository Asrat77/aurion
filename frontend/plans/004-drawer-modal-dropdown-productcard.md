# 004 — Drawer curve, modal + dropdown entrances, ProductCard hover

- **Status**: DONE
- **Commit**: uncommitted (fresh repo)
- **Severity**: MEDIUM
- **Category**: Physicality & origin / Easing
- **Estimated scope**: 3 files (`CartDrawer.tsx`, `AuthModal.tsx`, `Navbar.tsx`, `ProductCard.tsx`)
- **Depends on**: 001 (tokens)

## Problem

- **CartDrawer** (`src/components/cart/CartDrawer.tsx:23`): slides with
  `transition-transform duration-300` = Tailwind's default `cubic-bezier(0.4,0,0.2,1)`.
  A drawer should use an iOS-style curve.
- **AuthModal** (`src/components/auth/AuthModal.tsx`): renders instantly, no
  entrance. A modal should fade + scale from `0.97` (centered — modals are exempt
  from origin-anchoring).
- **User dropdown** (`src/components/Navbar.tsx`, `{dropdownOpen && …}`): appears
  with no motion and no `transform-origin`. It hangs from the top-right avatar.
- **ProductCard** (`src/components/products/ProductCard.tsx:24`): `transition-all`
  + `hover:-translate-y-1`, hover ungated.

## Target

```tsx
// CartDrawer panel: replace `duration-300` easing with the drawer curve
transition-transform duration-[400ms] ease-[var(--ease-drawer)]
// overlay: give it a matching fade
transition-opacity duration-[400ms] ease-[var(--ease-out)]

// AuthModal container: mount flag → scale/opacity, centered
transition-[transform,opacity] duration-200 ease-[var(--ease-out)]
mounted ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"

// User dropdown: origin top-right + mount flag
origin-top-right transition-[transform,opacity] duration-150 ease-[var(--ease-out)]
open ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"

// ProductCard: scope transition, gate hover
transition-[transform,border-color,box-shadow] duration-200 ease-[var(--ease-out)]
// wrap hover:-translate-y-1 etc in a hover-capable check (Tailwind: keep hover: but
// rely on plan 006 reduced-motion; false-hover on touch is mitigated by press being
// the primary affordance here — acceptable, but prefer @media hover if converting to CSS)
```

## Repo conventions to follow

- Modal/dropdown entrances use the same `requestAnimationFrame` mount-flag pattern
  as plan 003 (`ToastItem`). Reuse it.
- Never animate from `scale(0)`; start at `scale(0.97)` + opacity (AUDIT §3).
- Modals stay centered — do NOT anchor transform-origin to a trigger.

## Steps

1. **CartDrawer**: panel `transition-transform duration-300` →
   `transition-transform duration-[400ms] ease-[var(--ease-drawer)]`; overlay add
   `duration-[400ms] ease-[var(--ease-out)]`.
2. **AuthModal**: add `mounted` rAF flag; container gets the transform/opacity
   classes above. (Modal exit can stay instant — unmount — acceptable for v1.)
3. **Navbar dropdown**: add `origin-top-right` + transition classes; drive
   scale/opacity off `dropdownOpen`. Keep it mounted while animating out if
   feasible, else instant close is acceptable.
4. **ProductCard**: swap `transition-all` for the scoped transition list.

## Boundaries

- `transform`/`opacity`/`border-color`/`box-shadow` only.
- Do not restructure component logic beyond adding a mount flag.
- No new dependencies.

## Verification

- **Mechanical**: `tsc`/`eslint`/`build` clean.
- **Feel check**: open cart → panel glides from the right with an iOS feel
  (fast out, gentle settle), overlay fades in tandem. Open auth modal → it
  scales up subtly from 0.97 (not from nothing, not from a corner). Open user
  dropdown → it grows from the top-right, not the center. At 10% speed confirm
  each origin.
- **Done when**: drawer uses `--ease-drawer`; modal and dropdown both have
  scale+opacity entrances; ProductCard no longer uses `transition-all`.
