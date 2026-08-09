export type Role = "buyer" | "vendor" | "admin";

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  vendor?: Vendor | null;
}

export type VendorStatus = "pending" | "active" | "suspended" | "rejected";

export interface Vendor {
  id: number;
  storeName: string;
  slug: string;
  commissionRate: number;
  status: VendorStatus;
  bio: string | null;
}

/** A Vendor record with the details supplied when applying to sell. */
export interface VendorApplication extends Vendor {
  contactName: string | null;
  contactPhone: string | null;
  businessRegistration: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  productFocus: string | null;
  payoutMethod: string | null;
  appliedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  ownerEmail: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  stock: number;
  emoji: string;
  origin: string;
  freeShipping: boolean;
  rating: number | null;
  reviewsCount: number;
  status: "draft" | "active";
  category: Category;
  vendor: { id: number; storeName: string; slug: string };
  /** Null for retail-only products. */
  wholesale: WholesaleTerms | null;
}

export interface PriceTier {
  minQuantity: number;
  unitPriceCents: number;
}

export interface WholesaleTerms {
  moq: number;
  unitOfMeasure: string | null;
  leadTimeDays: number | null;
  packaging: string | null;
  sampleAvailable: boolean;
  samplePriceCents: number | null;
  priceTiers: PriceTier[];
}

export type Incoterm = "EXW" | "FOB" | "CIF" | "CFR" | "DAP";

export interface Message {
  id: number;
  body: string;
  /** True when the signed-in user sent it — used to place the bubble. */
  mine: boolean;
  senderName: string;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  id: number;
  subject: string;
  /** The other party: the vendor's store name, or the buyer's name. */
  counterpartName: string;
  vendorSlug: string;
  orderId: number | null;
  orderReference: string | null;
  productSlug: string | null;
  productName: string | null;
  unreadCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string;
  createdAt: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface ProductFacets {
  origins: string[];
  priceRange: { minCents: number; maxCents: number };
  freeShippingCount: number;
  inStockCount: number;
}

export interface CartLine {
  productId: number;
  slug: string;
  name: string;
  emoji: string;
  priceCents: number;
  qty: number;
  vendorName: string;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type FulfillmentStatus =
  | "awaiting"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: number;
  productId: number;
  productSlug: string | null;
  productName: string;
  emoji?: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  commissionCents: number;
  netCents: number;
  fulfillmentStatus: FulfillmentStatus;
  refundStatus: RefundStatus | null;
  refundable: boolean;
  reviewable: boolean;
  reviewed: boolean;
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  vendorId?: number;
  vendorName?: string;
}

export type RefundStatus = "open" | "approved" | "rejected";

export type RefundReason =
  | "not_received"
  | "damaged"
  | "not_as_described"
  | "wrong_item"
  | "other";

export interface RefundRequest {
  id: number;
  orderId: number;
  orderReference: string;
  orderItemId: number;
  productName: string;
  vendorName: string;
  reason: RefundReason;
  reasonLabel: string;
  detail: string | null;
  status: RefundStatus;
  amountCents: number;
  currency: string;
  fxRate: number;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  buyerEmail?: string;
}

export interface Review {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  status: "published" | "hidden";
  authorName: string;
  productName: string;
  productSlug: string;
  createdAt: string;
}

export interface ReviewSummary {
  average: number | null;
  total: number;
  /** Count of reviews at each star rating, keyed "1".."5". */
  distribution: Record<string, number>;
}

export interface PendingReview {
  orderItemId: number;
  orderReference: string;
  productId: number;
  productSlug: string | null;
  productName: string;
  emoji: string | null;
  deliveredAt: string | null;
}

export interface OrderEvent {
  id: number;
  label: string;
  note: string | null;
  orderItemId: number | null;
  createdAt: string;
}

export interface Order {
  id: number;
  reference: string;
  status: OrderStatus;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  fxRate: number;
  paymentMethod: string | null;
  shippingAddress: Record<string, string>;
  buyerEmail?: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellable: boolean;
  createdAt: string;
  items: OrderItem[];
  events: OrderEvent[];
}

export interface OrderQuote {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  fxRate: number;
  taxLabel: string;
  freeShippingApplied: boolean;
}

export interface Payout {
  id: number;
  amountCents: number;
  status: "pending" | "paid";
  orderReference: string;
  productName: string;
  createdAt: string;
}

export type RequestForQuoteStatus = "new" | "reviewing" | "quoted" | "closed";

export interface RequestForQuote {
  id: number;
  reference: string;
  companyName: string;
  contactName: string | null;
  email: string;
  country: string | null;
  productInterest: string;
  productId: number | null;
  productName: string | null;
  productSlug: string | null;
  estimatedQuantity: string | null;
  specifications: string | null;
  incoterm: Incoterm | null;
  destinationPort: string | null;
  targetPriceCents: number | null;
  sampleRequested: boolean;
  inspectionRequired: boolean;
  quotedUnitPriceCents: number | null;
  quotedLeadTimeDays: number | null;
  quoteNote: string | null;
  quotedAt: string | null;
  status: RequestForQuoteStatus;
  createdAt: string;
}

export type OrganizationKind = "buyer" | "supplier";
export type OrganizationRole = "owner" | "buyer" | "finance" | "operations";

export interface OrganizationMembership {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: OrganizationRole;
  status: "active" | "suspended";
}

export interface BusinessOrganization {
  id: number;
  name: string;
  legalName: string | null;
  kind: OrganizationKind;
  status: "pending" | "active" | "suspended";
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  country: string | null;
  registrationNumber: string | null;
  verifiedAt: string | null;
  memberships?: OrganizationMembership[];
}

export interface SupplierInvitation {
  id: number;
  requestForQuoteId: number;
  reference: string;
  vendorId: number;
  vendorName: string;
  score: number;
  reasons: string[];
  status: "invited" | "viewed" | "declined" | "quoted" | "awarded";
  invitedAt: string | null;
}

export interface QuotationItem {
  id: number;
  productId: number | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  currency: string;
}

export interface BusinessQuotation {
  id: number;
  requestForQuoteId: number;
  vendorId: number;
  vendorName: string;
  revision: number;
  status: "draft" | "submitted" | "withdrawn" | "accepted" | "rejected" | "expired";
  currency: string;
  incoterm: Incoterm | null;
  leadTimeDays: number | null;
  shippingCents: number;
  totalCents: number;
  validUntil: string | null;
  note: string | null;
  submittedAt: string | null;
  acceptedAt: string | null;
  items: QuotationItem[];
}

export interface BusinessRFQ extends RequestForQuote {
  organizationId: number;
  buyerId: number;
  currency: string;
  items: {
    id: number;
    productId: number | null;
    description: string;
    quantity: number;
    unitOfMeasure: string | null;
    specifications: string | null;
  }[];
  invitations: SupplierInvitation[];
  quotations: BusinessQuotation[];
}

export interface BusinessTradeOrder {
  id: number;
  reference: string;
  requestForQuoteId: number;
  quotationId: number;
  buyerOrganizationId: number;
  supplierOrganizationId: number;
  supplierName: string;
  status: string;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  incoterm: Incoterm | null;
  destinationPort: string | null;
  terms: Record<string, unknown>;
  termsSha256: string;
  contractAvailable: boolean;
  inspectionRequired: boolean;
  fundedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  acceptances: {
    organizationId: number;
    organizationName: string;
    userId: number;
    userName: string;
    role: string;
    termsSha256: string;
    acceptedAt: string;
  }[];
  protectedPayment: {
    provider: string;
    status: string;
    amountCents: number;
    currency: string;
    fundedAt: string | null;
    releasedAt: string | null;
  } | null;
  inspection: { id: number; status: string; outcome: string | null; notes: string | null } | null;
  shipment: { id: number; carrier: string | null; trackingNumber: string | null; status: string; shippedAt: string | null; deliveredAt: string | null; deliveryVerifiedAt: string | null } | null;
  disputes: { id: number; reason: string; status: string; amountCents: number; detail: string; createdAt: string; resolvedAt: string | null }[];
  events?: { type: string; details: Record<string, unknown>; actorId: number | null; createdAt: string }[];
}
