# AURION contractor review — 2026-08-04

Source: `~/Downloads/AURION_Markets_Product_Technical_Review.docx` (five pages,
prepared 4 August 2026). This note records the branch review against local
`master`; it is not a replacement for the contractor's original document.

## Review state

- Branch: `polish/contractor-review`
- Head: `c14299a`
- Base: `master` at `6979621`
- Working tree was clean at review time.
- Backend: 132 tests, 401 assertions, 0 failures.
- Frontend: lint, TypeScript, and production build passed.
- The branch was not pushed or published.

## Standards findings

1. **Inventory is not concurrency-safe.** Checkout checks stock before the
   transaction and decrements an unlocked row. Concurrent checkouts can
   oversell or create negative stock.
2. **Refund and cancellation can restock twice.** Approval increments a
   refunded line, while later cancellation releases stock for the whole order.
3. **Refund claims are race-prone.** The open-claim index is not unique and
   claim resolution is not locked; parallel requests can double-restock.
4. **Pricing trusts two country inputs.** Tax/shipping use top-level `country`,
   while the persisted destination comes from `shipping_address`.
5. **N+1s remain in conversations and order-line serialization.**

## Specification findings

1. **Refunds are incomplete.** Approval restocks damaged/wrong goods without a
   return state, vendors cannot see refund status, and partially refunded lines
   remain in vendor revenue summaries.
2. **P0-6 is partial.** Product detail still lacks multiple images and variants.
3. **Localization is partial.** Vendor dashboard, messages, and refund UI use
   English literals despite being named critical journeys.
4. **ETB price filters use the wrong units.** Values entered in the displayed
   currency are sent as base USD cents without inverse FX conversion.
5. **The broader backlog is not complete.** Coupons/promotions, reverse
   logistics, performance scores, support ticketing, SEO/PWA work, and broader
   forex rules remain absent.
6. **VAT and shipping policy need confirmation.** The branch introduces rates,
   zones, and thresholds that were not specified by the contractor.

## Deliberate deferrals

Real payments remain deferred pending Chapa business credentials. Appwrite
Function skeletons do not apply to this Rails API backend. Product variants,
multiple images, and coupons were deliberately deferred and need an explicit
follow-up decision before being described as complete.

## Recommended order of work

1. Make stock and refund transitions database-safe and idempotent.
2. Finish translation coverage across all customer, vendor, and admin surfaces.
3. Fix ETB filter conversion and clarify VAT/shipping policy.
4. Decide whether variants, image storage, coupons, and reverse logistics are
   in this release or a separate follow-up.
