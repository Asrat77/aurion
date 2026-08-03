# AURION tomorrow build discovery

Status: Approved and implemented
Date: 2026-08-02
Target: A polished, working link suitable for the contractor review on 2026-08-03

## Outcome

Make AURION feel like a credible Ethiopian premium-commerce platform with two clear entry points:

1. Shop Ethiopian products at retail.
2. Source Ethiopian products at commercial scale.

The contractor should immediately recognize the B2B idea from the handoff, then discover that it has been integrated into a stronger server-backed marketplace instead of left as a browser-only demo.

## Evidence reviewed

- Current application: Next.js 16 frontend and Rails 8 API at commit `404e440` on `master`.
- Current remote: local `master` matched `origin/master` after fetch.
- Current live frontend: `https://aurion.appwrite.network`.
- Current live API: Azure Container Apps revision `aurion-api--0000006`, healthy on 2026-08-02.
- Contractor handoff: `/Users/asrat/Downloads/aurion-html/`.
- Brand assets:
  - transparent blue and gold emblem, 816 by 830 PNG;
  - gold-on-black AURION GLOBAL HOLDINGS PLC artwork, 1500 by 1500 PNG.
- Current verification: 42 Rails tests passed with 98 assertions, frontend lint passed, and the optimized Next.js build passed.

The contractor README references a "2026 Master Playbook" and a separate production Next.js package, but neither was included in the supplied folder. The static handoff is therefore treated as the available feature proposal, not as an authoritative architecture specification.

## Handoff reconciliation

| Contractor idea | Current application | Decision |
| --- | --- | --- |
| Storefront and product catalog | Already server-backed with 17 products, search, category filters, sorting, detail pages, wishlist, and vendor attribution | Preserve and redesign |
| Cart and checkout | Already stronger: persistent cart, multi-step checkout, mock payment fallback, order persistence, and order history | Preserve and refine |
| Order success | Already integrated into checkout | Preserve and refine |
| Admin GMV and orders | Already stronger: overview, products, orders, customers, analytics, and vendors | Preserve and redesign |
| B2B sourcing form | Missing | Build as a real Rails-backed RFQ flow |
| RFQ admin pipeline | Missing | Add an admin RFQ view and summary count |
| MOQ, FOB price, quantity, packaging, certification, and destination context | Present only as static copy in the handoff | Surface in the B2B experience without inventing unavailable certifications or prices |
| Supabase rewrite | Conflicts with the working Rails backend | Reject for tomorrow |
| Stripe, Chapa, email, and PDF generation | Partial payment architecture exists; email and PDF delivery do not | Keep out of tomorrow's critical path |

## Current experience audit

### What is already good

- A coherent dark and gold foundation is already in place.
- Desktop and 375px mobile layouts are usable.
- Authentication, cart, checkout, vendor, buyer, and admin paths are implemented.
- The live frontend and API are reachable.
- Loading, empty, error, and not-found primitives already exist.

### What prevents the experience from standing out

- The supplied brand marks are not used. The navigation currently shows a generic letter A in a circle.
- The home page leads with a broad conglomerate story and future divisions. It does not immediately communicate the contractor's marketplace and B2B sourcing proposition.
- The hero coffee imagery and "technology, commerce and industry" headline tell competing stories.
- The store has no visible path for wholesale buyers, MOQ-based sourcing, or quote requests.
- The contact page is only a mail link, so it cannot serve as the proposed sourcing funnel.
- Category-level Unsplash mappings reuse the same image for unrelated products. Several remote images timed out during the audit.
- API failures are shown as "No products match," which incorrectly makes a connection problem look like an empty catalog.
- Product and admin API responses are slowed by multiple database round trips to the remote Postgres instance. The live products endpoint measured roughly 1.6 to 1.8 seconds while warm during this audit.
- Search and sort consume two full rows on desktop, reducing product visibility above the fold.
- Several icon-only controls are smaller than the recommended 44px touch target.
- The authentication modal is visually functional but does not expose a dialog landmark in the accessibility tree.
- Current contact details and future-division claims are not verified by the supplied contractor files. They should not be amplified as facts without owner confirmation.

## Approved-design proposal

### Direction: Sovereign Ethiopian Commerce

A refined, cinematic export-house aesthetic: obsidian black and deep Abyssinian navy, brushed gold, warm parchment text, and restrained geometric patterning inspired by Ethiopian textile and architectural forms.

The memorable interaction is a dual-path opening:

- `SHOP THE ORIGIN` for retail buyers.
- `SOURCE AT SCALE` for commercial buyers.

The page should feel editorial and deliberate rather than like a generic dashboard. Motion will be concentrated in the opening brand reveal, route transitions, card image reveals, and the RFQ success state. Reduced-motion preferences remain respected.

### Brand asset decision

- Use the transparent blue and gold emblem as the primary product mark in the navigation, favicon, mobile menu, and key branded surfaces.
- Treat the 1500px gold-on-black artwork as art direction and presentation material, not as a second competing logo in the interface.
- Preserve `AURION GLOBAL HOLDINGS PLC` as the parent identity while making `AURION MARKETS` the main customer-facing product.

### Information architecture

- Home
- Marketplace
- Source at Scale
- About AURION
- Account and cart utilities
- Role-gated Vendor and Admin workspaces

The public navigation must never expose an Admin link to unauthenticated users.

## Tomorrow-ready implementation scope

### 1. Brand and shell

- Integrate the supplied emblem as a responsive optimized asset.
- Redesign navigation, mobile menu, footer, focus states, touch targets, and page transitions.
- Add a skip link and proper dialog semantics.
- Replace placeholder navigation branding with the actual AURION identity.

### 2. Conversion-focused home page

- Replace the split corporate hero with the dual retail and B2B entry point.
- Introduce AURION Markets in the first viewport.
- Add a compact "origin to global market" story using only claims present in the current app or contractor handoff.
- Feature retail categories and a B2B sourcing panel.
- Keep future divisions secondary and avoid unverified operational claims.

### 3. Marketplace upgrade

- Tighten search, category, sort, card density, and responsive behavior.
- Add a persistent "Need commercial quantities? Request a quote" path.
- Improve image handling so a timeout produces a designed branded fallback.
- Distinguish API errors from zero search results and provide a retry action.
- Improve above-the-fold image loading and remove the observed LCP warning.

### 4. Real B2B RFQ flow

- Add a Rails `RequestForQuote` record with a generated reference and initial `new` status.
- Capture company, contact name, work email, country, product interest, estimated quantity, and specifications.
- Add public create and success responses with server-side validation.
- Build a premium `/source` experience that explains the process without promising unimplemented PDF or email delivery.
- Add automated model and request tests.

### 5. Admin RFQ pipeline

- Add an RFQ count to the overview.
- Add an RFQ workspace showing reference, company, country, product, quantity, email, status, and submission time.
- Keep status management read-only for tomorrow unless time remains. The contractor handoff only proves the need for intake and visibility.

### 6. Performance and resilience

- Reduce unnecessary product-list database round trips where safely possible.
- Preserve useful skeletons but avoid a multi-second empty-looking storefront.
- Add explicit React Query error states for catalog and admin views.
- Recheck live CORS, auth cookies, responsive layout, and image failure behavior.

## Explicitly out of scope for tomorrow

- Replacing Rails with Supabase.
- Real quotation emails through Resend.
- PDF catalogs or proforma invoice generation.
- A complete RFQ negotiation and status automation system.
- New real-payment credentials or payment-provider production activation.
- Invented certifications, stock, pricing, shipping promises, customer logos, or testimonials.
- Publishing, pushing, production deployment, or credential changes without separate owner authorization.

## Acceptance criteria

- The first viewport clearly presents AURION Markets and offers both retail and B2B paths.
- The supplied AURION emblem is visibly and consistently integrated.
- A visitor can submit an RFQ and receive a branded confirmation with a reference.
- The submitted RFQ appears to an authenticated admin.
- Existing retail catalog, cart, checkout, orders, vendor, and admin paths continue to work.
- API failure and zero-results states are visibly different.
- All meaningful images have suitable alt text; all icon buttons have accessible names and at least 44px targets.
- Layouts are verified at 375, 768, 1024, and 1440px without horizontal overflow.
- Reduced-motion preferences are respected.
- Rails tests, frontend lint, TypeScript, and production build pass.
- No contact, certification, operational, or corporate claim is added without evidence from the current repo, contractor files, or owner confirmation.

## Approval requested

Approve this brief to begin implementation. Approval also confirms these three proposed decisions:

1. Lead with AURION Markets while retaining Global Holdings as the parent brand.
2. Use the transparent blue and gold emblem as the canonical web mark for tomorrow's build.
3. Implement the contractor's B2B concept as a real Rails-backed RFQ and admin pipeline, not as localStorage and not as a Supabase rewrite.
