export type Role = "buyer" | "vendor" | "admin";

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  vendor?: Vendor | null;
}

export interface Vendor {
  id: number;
  storeName: string;
  slug: string;
  commissionRate: number;
  status: "pending" | "active" | "suspended";
  bio: string | null;
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
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  vendorName?: string;
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

export interface RequestForQuote {
  id: number;
  reference: string;
  companyName: string;
  contactName: string | null;
  email: string;
  country: string | null;
  productInterest: string;
  estimatedQuantity: string | null;
  specifications: string | null;
  status: "new" | "reviewing" | "quoted" | "closed";
  createdAt: string;
}
