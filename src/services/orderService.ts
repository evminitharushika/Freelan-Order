import { PRODUCT_BY_ID } from '../data/catalog';
import { buildLines, sumTotals } from '../lib/calc';
import type { Customer, Order, OrderLine, OrderStatus, Quantities } from '../lib/types';
import { delay, readJSON, writeJSON } from './storage';

export interface OrderQuery {
  search?: string;
  status?: OrderStatus | 'all';
  sort?: 'newest' | 'oldest';
  page?: number;
  pageSize?: number;
}

export interface OrderPage {
  items: Order[];
  total: number;
  page: number;
  pageCount: number;
}

export interface OrderStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

/** Order contract: replace the mock with fetch calls to a real API without touching components. */
export interface OrderService {
  create(customer: Customer, quantities: Quantities): Promise<Order>;
  list(query?: OrderQuery): Promise<OrderPage>;
  stats(): Promise<OrderStats>;
  get(idOrRef: string): Promise<Order | null>;
  setStatus(id: string, status: Exclude<OrderStatus, 'pending'>, by: string, note?: string): Promise<Order>;
}

const ORDERS_KEY = 'orders';
const SEQ_KEY = 'order-seq';

const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function nextRef(date: Date): string {
  const year = date.getFullYear();
  const seq = readJSON<Record<string, number>>(SEQ_KEY, {});
  const n = (seq[year] ?? 0) + 1;
  writeJSON(SEQ_KEY, { ...seq, [year]: n });
  return `FL-${year}-${String(n).padStart(4, '0')}`;
}

function linesFrom(quantities: Quantities): OrderLine[] {
  const products = Object.keys(quantities)
    .map((id) => PRODUCT_BY_ID.get(Number(id)))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);
  return buildLines(products, quantities);
}

/* ------------------------------------------------------------------ seed data */

const SEED: Array<{ customer: Customer; daysAgo: number; status: OrderStatus; qty: Quantities; reason?: string }> = [
  { customer: { name: 'Nimal Perera', phone: '0771234567', company: 'Perera Stores' }, daysAgo: 1, status: 'pending', qty: { 1: 4, 7: 6, 64: 3, 109: 10 } },
  { customer: { name: 'Fathima Rizna', phone: '0712345678', company: 'Rizna Super Mart' }, daysAgo: 2, status: 'pending', qty: { 3: 2, 31: 5, 77: 4, 159: 3, 183: 6 } },
  { customer: { name: 'Kasun Jayawardena', phone: '0759876543' }, daysAgo: 3, status: 'approved', qty: { 187: 8, 189: 6, 195: 4, 199: 5 } },
  { customer: { name: 'Tharushi Fernando', phone: '0765554433', company: 'Ceylon Hotel Supplies' }, daysAgo: 5, status: 'approved', qty: { 94: 10, 95: 6, 103: 8, 105: 4, 107: 3 } },
  { customer: { name: 'Mohamed Ifham', phone: '0701112223', company: 'Ifham Traders' }, daysAgo: 6, status: 'rejected', qty: { 139: 5, 147: 4, 151: 2 }, reason: 'Delivery area not covered this month.' },
  { customer: { name: 'Sanduni Wickramasinghe', phone: '0778889990' }, daysAgo: 8, status: 'pending', qty: { 162: 4, 164: 3, 167: 2, 169: 6 } },
  { customer: { name: 'Ravi Shankar', phone: '0723334445', company: 'Jaffna Spice House' }, daysAgo: 10, status: 'approved', qty: { 84: 12, 87: 8, 66: 5, 79: 4 } },
  { customer: { name: 'Dilani Gunasekara', phone: '0746667778', company: 'Green Leaf Café' }, daysAgo: 13, status: 'pending', qty: { 172: 3, 174: 4, 178: 2, 180: 2, 156: 3 } },
  { customer: { name: 'Ashan Silva', phone: '0769990001' }, daysAgo: 16, status: 'rejected', qty: { 209: 10, 210: 4 }, reason: 'Duplicate of an earlier order.' },
  { customer: { name: 'Priyanka Rajapaksha', phone: '0715556667', company: 'PR Distributors' }, daysAgo: 20, status: 'approved', qty: { 2: 8, 12: 10, 36: 6, 70: 5, 214: 4, 245: 6 } },
];

function seed(): Order[] {
  const now = Date.now();
  const ordered = [...SEED].sort((a, b) => b.daysAgo - a.daysAgo); // oldest first so refs increase with time
  const orders = ordered.map((s, i) => {
    const created = new Date(now - s.daysAgo * 86_400_000 - (i % 5) * 3_600_000);
    const items = linesFrom(s.qty);
    const history: Order['history'] = [{ status: 'pending', at: created.toISOString(), by: s.customer.name, note: 'Order placed' }];
    if (s.status !== 'pending') {
      history.push({
        status: s.status,
        at: new Date(created.getTime() + 20 * 3_600_000).toISOString(),
        by: 'Freelan Admin',
        note: s.reason,
      });
    }
    const order: Order = {
      id: uid(),
      ref: `FL-${created.getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      createdAt: created.toISOString(),
      status: s.status,
      customer: s.customer,
      items,
      totals: sumTotals(items),
      history,
      rejectionReason: s.reason,
    };
    return order;
  });
  const seq: Record<string, number> = {};
  for (const o of orders) {
    const y = o.ref.split('-')[1];
    seq[y] = Math.max(seq[y] ?? 0, Number(o.ref.split('-')[2]));
  }
  writeJSON(SEQ_KEY, seq);
  writeJSON(ORDERS_KEY, orders);
  return orders;
}

function all(): Order[] {
  const stored = readJSON<Order[] | null>(ORDERS_KEY, null);
  return stored ?? seed();
}

function save(orders: Order[]): void {
  writeJSON(ORDERS_KEY, orders);
}

/* ------------------------------------------------------------------ service */

export const orderService: OrderService = {
  async create(customer, quantities) {
    await delay(500);
    const items = linesFrom(quantities);
    if (items.length === 0) throw new Error('Add at least one box before submitting.');
    const existing = all(); // seeds first, so the reference sequence continues after the samples
    const now = new Date();
    const order: Order = {
      id: uid(),
      ref: nextRef(now),
      createdAt: now.toISOString(),
      status: 'pending',
      customer,
      items,
      totals: sumTotals(items),
      history: [{ status: 'pending', at: now.toISOString(), by: customer.name, note: 'Order placed' }],
    };
    save([order, ...existing]);
    return order;
  },

  async list({ search = '', status = 'all', sort = 'newest', page = 1, pageSize = 8 } = {}) {
    await delay(120);
    const q = search.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    let rows = all().filter((o) => status === 'all' || o.status === status);
    if (q) {
      rows = rows.filter(
        (o) =>
          o.ref.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          (o.customer.company ?? '').toLowerCase().includes(q) ||
          (digits.length >= 3 && o.customer.phone.replace(/\D/g, '').includes(digits)),
      );
    }
    rows.sort((a, b) => (sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)));
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    return { items: rows.slice((safePage - 1) * pageSize, safePage * pageSize), total: rows.length, page: safePage, pageCount };
  },

  async stats() {
    const rows = all();
    return {
      total: rows.length,
      pending: rows.filter((o) => o.status === 'pending').length,
      approved: rows.filter((o) => o.status === 'approved').length,
      rejected: rows.filter((o) => o.status === 'rejected').length,
    };
  },

  async get(idOrRef) {
    await delay(120);
    return all().find((o) => o.id === idOrRef || o.ref === idOrRef) ?? null;
  },

  async setStatus(id, status, by, note) {
    await delay(350);
    const orders = all();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Order not found');
    const current = orders[idx];
    const updated: Order = {
      ...current,
      status,
      rejectionReason: status === 'rejected' ? note || undefined : undefined,
      history: [...current.history, { status, at: new Date().toISOString(), by, note: note || undefined }],
    };
    orders[idx] = updated;
    save(orders);
    return updated;
  },
};
