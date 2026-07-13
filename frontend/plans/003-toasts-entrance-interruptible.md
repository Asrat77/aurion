# 003 — Toasts: real entrance, interruptible, origin-correct

- **Status**: DONE
- **Commit**: uncommitted (fresh repo)
- **Severity**: HIGH
- **Category**: Interruptibility / Physicality
- **Estimated scope**: 1 file (`src/components/ToastHost.tsx`)

## Problem

`ToastHost` applies `animate-[fadeIn_0.3s_ease]` but **no `@keyframes fadeIn`
exists** anywhere in the project — the class is a dead reference, so toasts snap
in with no motion. Toasts also stack (up to several visible) and are triggered
rapidly (add-to-cart, wishlist), so a keyframe would restart from zero and jump.

```tsx
/* src/components/ToastHost.tsx:19 — current */
className={`bg-[var(--bg-elevated)] border ${colors[t.type]} px-5 py-3.5 rounded-lg text-sm font-medium shadow-2xl animate-[fadeIn_0.3s_ease]`}
```

## Target

Transition-based mount so a newly-added toast animates from
`translateX(16px) + opacity:0` to rest, and the stack shifting is a transition
(retargets, never restarts). Enter with a strong ease-out, ≤250ms.

Implement with a per-toast `mounted` flag (set in `useEffect`) driving classes:

```tsx
// initial (pre-mount):   opacity-0 translate-x-4
// mounted:               opacity-100 translate-x-0
// wrapper transition:    transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]
```

(Toasts come from the top-right; entering from `translate-x-4` — i.e. from the
right edge — is origin-consistent with where they live.)

## Repo conventions to follow

- `ToastHost` already maps `useUiStore((s) => s.toasts)`. Keep the store as-is
  (it already auto-dismisses at 3500ms). Add local mount state per toast, or
  extract a `<ToastItem>` component that owns its own `useEffect` mount flag.
- Tailwind arbitrary easing is used elsewhere (`animate-[...]`); an arbitrary
  cubic-bezier in `ease-[...]` is consistent. Prefer the `--ease-out` token via
  `ease-[var(--ease-out)]` for cohesion with plan 001.

## Steps

1. Extract a `ToastItem` component inside `ToastHost.tsx` taking `toast` as prop.
2. In `ToastItem`, `const [mounted, setMounted] = useState(false)` and
   `useEffect(() => { const id = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(id); }, [])`.
3. Apply wrapper classes: `transition-[transform,opacity] duration-200 ease-[var(--ease-out)]`
   plus `mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"`.
4. Remove the dead `animate-[fadeIn_0.3s_ease]` class.

## Boundaries

- Do not change toast colors, copy, dismiss timing, or the store.
- Only `transform` and `opacity` may animate (GPU-safe).
- No new dependencies (no Framer Motion).

## Verification

- **Mechanical**: `tsc`/`eslint`/`build` clean.
- **Feel check**: trigger several toasts quickly (spam "Add to cart") — each new
  toast slides in from the right and fades in; existing toasts shifting position
  never flicker or restart. At 10% DevTools speed the entrance eases out (fast
  then settling), not linear.
- **Done when**: no reference to `fadeIn` remains; toasts animate on mount.
