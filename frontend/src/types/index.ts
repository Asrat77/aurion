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

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  emoji?: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  commissionCents: number;
  netCents: number;
  vendorName?: string;
}

export interface Order {
  id: number;
  reference: string;
  status: "pending" | "paid" | "fulfilled" | "cancelled";
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
  createdAt: string;
  items: OrderItem[];
}

export interface Payout {
  id: number;
  amountCents: number;
  status: "pending" | "paid";
  orderReference: string;
  productName: string;
  createdAt: string;
}
