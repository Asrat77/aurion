# AURION Express + Business Product Specification

Status: implementation baseline on `feat/unified-marketplace`
Scope: one Rails/PostgreSQL backend, one Next.js source tree, three channel deployments.

## Product boundary

AURION is one marketplace with shared identity, catalogue, supplier, messaging,
audit, notification, payment, and object-storage infrastructure.

- **Express** is the retail channel: catalogue, product detail, cart, checkout,
  retail order fulfilment, returns, reviews, and buyer protection.
- **Business** is the commercial channel: verified organizations, structured
  RFQs, deterministic supplier matching, competing quotations, immutable
  contracts, protected trades, inspection, shipment, delivery, disputes, and
  refunds.
- **Operations** is the back-office channel for organization verification,
  supplier operations, inspection review, dispute resolution, reconciliation,
  and exception queues.

The channels share authentication, profile, organizations, messages, and
notifications. Express cart and wishlist state is channel-local and never
appears in Business. The contractor Python directory is reference material;
the production matching logic is Ruby and deterministic.

## Roles and authorization

- Express buyer: browse, purchase, track, review, and request refunds.
- Buyer organization: verified company with owner, buyer, finance, and
  operations memberships. Only owner/buyer/finance may accept a quotation,
  contract, or payment obligation.
- Supplier organization: approved, active, verified vendor with commercial
  capabilities and an opportunity inbox.
- Administrator: verify organizations, review inspections, verify delivery,
  resolve disputes, and reconcile provider events.

Every Business state-changing request requires an `Idempotency-Key`. A request
from an organization the actor cannot access is a resource-scoped `404`; a
known organization with an insufficient role is `403`.

## Business transaction state machine

1. A verified buyer organization creates a multi-line RFQ and publishes it.
2. Ruby ranks eligible suppliers and invites at most five.
3. Each supplier creates immutable quotation revisions and submits one or more
   offers independently.
4. The buyer accepts exactly one submitted quotation. PostgreSQL uniqueness and
   a row lock prevent concurrent winners.
5. A `TradeOrder` snapshots all accepted terms and stores a SHA-256 digest. A
   contract PDF is attached through Active Storage.
6. Buyer and supplier accept the exact digest independently. Funding is blocked
   until both acceptances exist.
7. A provider adapter creates a protected transaction. Funding, release, and
   refund state comes only from verified provider events.
8. Required inspection evidence is submitted by the supplier and passed, failed,
   or waived by Operations. A failed inspection blocks shipment and release.
9. The supplier records shipment and supporting documents. Operations verifies
   delivery evidence.
10. The buyer accepts delivery, or release is scheduled for seven calendar days
    after verified delivery when no dispute is open.
11. A dispute freezes release. Operations resolves held money as supplier
    release, buyer refund, or an exact split. Append-only financial movements
    cannot exceed the funded amount or run twice.

The first release uses one supplier and one 100% delivery milestone, while the
schema is milestone-capable for later expansion.

## Deterministic matching

An eligible supplier is active, approved/verified, Business-enabled, capable of
the RFQ category and destination, and within the requested quantity. The score
is stable and explainable:

| Signal | Points |
|---|---:|
| Exact product fit | 40 |
| Category fit | 30 |
| Destination coverage | 20 |
| Quantity/MOQ fit | 15 |
| Lead-time fit | 15 |
| Complete verified organization | 10 |

The top five are sorted by score descending, least-recently-invited supplier,
then stable vendor ID. An invitation is unique per RFQ/vendor. Fewer than three
matches creates an Operations notification; zero matches creates a manual
sourcing exception. Matching does not invent suppliers, certifications, or
statistics.

## Protection and provider boundary

The working public name is **AURION Protected Trade**. “Trade Assurance” is not
shown until branding and legal language are approved by the client.

Staging provides a signed HMAC sandbox adapter and asynchronous provider-event
job. Production fails closed when no approved provider is configured: it never
silently converts a buyer button into mock funds. Live activation is a separate
paid milestone requiring the client’s provider account, seller onboarding,
webhook secret, settlement agreement, regulatory approval, and one controlled
funding/release/refund test.

## Persistence and evidence

Commercial prices are integer minor units with an ISO currency code. Accepted
terms, contract digest, acceptances, provider events, financial movements, trade
events, inspection reports, shipment data, delivery acceptance, dispute
evidence, and resolutions are durable records. Trade events, financial
movements, acceptances, inspection reports, and dispute evidence are append-only
after creation.

Contracts and evidence use Active Storage. Local disk is for development only;
production is configured for the custom Azure Blob service after the client
provisions the account and private container.

## Public API shape

Existing Express `/api/v1` responses remain compatible. Business resources are
organization-scoped under `/api/v1/business` for organizations, RFQs,
opportunities, quotations, trade orders, inspections, shipments, delivery,
disputes, and protected payments. Payment webhooks use:

```text
POST /api/v1/webhooks/payments/:provider
```

The endpoint verifies the raw-body HMAC before parsing, deduplicates the
provider event ID, persists it, and enqueues processing through Solid Queue.
Provider timeouts remain pending and are reconciled; a timeout is never treated
as an automatic failure or release.

## Channel deployment contract

The same `frontend/` commit is deployed as three independently rollbackable
Appwrite Sites using `NEXT_PUBLIC_CHANNEL=express|business|operations`.
Preview URLs are the first acceptance target. Final DNS is a client dependency;
the repository does not assume control of a particular base domain.

Each build has channel-specific shell, metadata, route allowlist, sitemap/canonical
configuration, and absolute links to the other channels. All sites call the
same API origin with host-only auth cookies, exact CORS origins, CSRF tokens,
focus refresh, and global 401 cache invalidation.

## Delivery gates

The staging acceptance report must include:

- Rails tests, PostgreSQL concurrency tests, Zeitwerk, RuboCop, Brakeman,
  Bundler audit, frontend lint/TypeScript/build, and browser UAT at 375, 768,
  1024, and 1440px.
- Express checkout, cancellation, stock, return receipt, refund approval, and
  provider settlement regression.
- Business happy path, duplicate/out-of-order webhook, provider timeout,
  failed inspection, remediation, shipment, delivery auto-release, dispute,
  partial refund, and exact split-allocation scenarios.
- Direct HTTP verification of every financial transition, preview links,
  staging scenarios, environment inventory, runbook, rollback targets, and a
  database restore rehearsal.

## Paid activation milestones

1. **Staging Business vertical slice:** RFQ → matching → competing quotes →
   contract → sandbox funding → inspection → shipment → release or dispute.
2. **Live protected-payment activation:** client-provided approved provider and
   controlled funding/release/refund test.
3. **Production domains and launch:** controlled DNS, rotated secrets, direct
   HTTP/browser UAT, monitoring, and signed acceptance certificate.
4. **Express live payments:** ordinary retail gateway and real refund callbacks;
   this is not represented as escrow.
5. **Future expansion:** milestones, split awards, inspector/carrier APIs,
   automated KYC, supplier performance scoring, and Python/ML only after real
   outcome data proves the workload.

Legal wording, public guarantees, provider procurement, settlement corridors,
refund policy, privacy terms, and regulatory approval remain client-owned
activation dependencies.
