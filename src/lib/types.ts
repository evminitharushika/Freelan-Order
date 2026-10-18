export const PACK_TYPES = ['Printed Pouch', 'Unprinted Pouch', 'Standup Pouch', 'Bottle/Canister', 'Box', 'Cup'] as const;
export type PackType = (typeof PACK_TYPES)[number];

export interface Product {
  id: number;
  category: string;
  name: string;
  weight: string;
  packType: PackType | null;
  packetsPerBox: number | null;
  cbmPerBox: number | null;
  kgPerPacket: number | null;
  slug: string;
  /** Set by `npm run match-images`: /products/items/<file> or null when no photo is matched. */
  image?: string | null;
}

export interface Customer {
  name: string;
  phone: string;
  company?: string;
}

export interface Totals {
  boxes: number;
  packets: number;
  cbm: number;
  kg: number;
}

/** A snapshot of a product at order time, so orders stay valid if the catalogue changes. */
export interface OrderLine extends Totals {
  productId: number;
  category: string;
  name: string;
  weight: string;
  packType: PackType | null;
}

export type OrderStatus = 'pending' | 'approved' | 'rejected';

export interface OrderEvent {
  status: OrderStatus;
  at: string;
  by?: string;
  note?: string;
}

export interface Order {
  id: string;
  ref: string;
  createdAt: string;
  status: OrderStatus;
  customer: Customer;
  items: OrderLine[];
  totals: Totals;
  history: OrderEvent[];
  rejectionReason?: string;
}

/** productId -> number of boxes */
export type Quantities = Record<number, number>;

export interface AdminProfile {
  name: string;
  email: string;
}
