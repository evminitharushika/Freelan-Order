import type { Customer, Quantities } from '../lib/types';
import { readJSON, removeKey, writeJSON } from './storage';

/**
 * Client-side state for an in-progress order (customer details + box quantities) and small UI flags.
 * This stays client-side even with a real backend.
 */
const CUSTOMER_KEY = 'draft-customer';
const QTY_KEY = 'draft-quantities';
const INTRO_KEY = 'intro-seen';

export const draftService = {
  getCustomer: (): Customer | null => readJSON<Customer | null>(CUSTOMER_KEY, null),
  setCustomer: (c: Customer): void => writeJSON(CUSTOMER_KEY, c),

  getQuantities: (): Quantities => readJSON<Quantities>(QTY_KEY, {}),
  setQuantities: (q: Quantities): void => writeJSON(QTY_KEY, q),

  /** Called after a successful submit. Keeps the customer so their next order is pre-filled. */
  clearQuantities: (): void => removeKey(QTY_KEY),

  hasSeenIntro: (): boolean => readJSON<boolean>(INTRO_KEY, false),
  markIntroSeen: (): void => writeJSON(INTRO_KEY, true),
};
