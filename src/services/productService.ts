/**
 * Admin-managed products service.
 * Dynamic products created by the admin are stored in localStorage.
 * Static products from products.json are read-only and never stored here.
 * The combined list (static + dynamic) is used everywhere products are displayed.
 */
import type { PackType, Product } from '../lib/types';
import { delay, readJSON, writeJSON } from './storage';

const PRODUCTS_KEY = 'admin-products';
const ID_SEQ_KEY = 'admin-product-seq';

// IDs for admin-created products start at 100000 to avoid collisions with static products.json IDs.
const ADMIN_ID_START = 100_000;

function nextId(): number {
  const seq = readJSON<number>(ID_SEQ_KEY, ADMIN_ID_START - 1);
  const next = Math.max(seq + 1, ADMIN_ID_START);
  writeJSON(ID_SEQ_KEY, next);
  return next;
}

export interface AdminProduct extends Product {
  /** Whether the product is available for ordering. Inactive products are hidden from users. */
  active: boolean;
  /** ISO timestamp when the admin created this product. */
  createdAt: string;
  /** ISO timestamp of last update. */
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  category: string;
  weight: string;
  packType: PackType | null;
  packetsPerBox: number | null;
  cbmPerBox: number | null;
  kgPerPacket: number | null;
  image?: string | null;
  active: boolean;
}

export interface ProductService {
  list(): Promise<AdminProduct[]>;
  get(id: number): Promise<AdminProduct | null>;
  create(input: ProductInput): Promise<AdminProduct>;
  update(id: number, input: Partial<ProductInput>): Promise<AdminProduct>;
  setActive(id: number, active: boolean): Promise<AdminProduct>;
  remove(id: number): Promise<void>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readAll(): AdminProduct[] {
  return readJSON<AdminProduct[]>(PRODUCTS_KEY, []);
}

function saveAll(products: AdminProduct[]): void {
  writeJSON(PRODUCTS_KEY, products);
}

export const productService: ProductService = {
  async list() {
    await delay(120);
    return readAll();
  },

  async get(id) {
    await delay(80);
    return readAll().find((p) => p.id === id) ?? null;
  },

  async create(input) {
    await delay(350);
    if (!input.name.trim()) throw new Error('Product name is required.');
    if (!input.category.trim()) throw new Error('Category is required.');
    if (!input.weight.trim()) throw new Error('Weight / size is required.');
    const now = new Date().toISOString();
    const product: AdminProduct = {
      id: nextId(),
      name: input.name.trim(),
      category: input.category.trim(),
      weight: input.weight.trim(),
      packType: input.packType,
      packetsPerBox: input.packetsPerBox,
      cbmPerBox: input.cbmPerBox,
      kgPerPacket: input.kgPerPacket,
      image: input.image ?? null,
      slug: slugify(input.name.trim()),
      active: input.active,
      createdAt: now,
      updatedAt: now,
    };
    const all = readAll();
    saveAll([...all, product]);
    return product;
  },

  async update(id, input) {
    await delay(300);
    const all = readAll();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found.');
    const current = all[idx];
    const updated: AdminProduct = {
      ...current,
      ...input,
      name: input.name?.trim() ?? current.name,
      category: input.category?.trim() ?? current.category,
      weight: input.weight?.trim() ?? current.weight,
      slug: input.name ? slugify(input.name.trim()) : current.slug,
      updatedAt: new Date().toISOString(),
    };
    if (!updated.name) throw new Error('Product name is required.');
    if (!updated.category) throw new Error('Category is required.');
    if (!updated.weight) throw new Error('Weight / size is required.');
    all[idx] = updated;
    saveAll(all);
    return updated;
  },

  async setActive(id, active) {
    return productService.update(id, { active });
  },

  async remove(id) {
    await delay(200);
    const all = readAll();
    saveAll(all.filter((p) => p.id !== id));
  },
};
