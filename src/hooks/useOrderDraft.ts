import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PRODUCT_BY_ID } from '../data/catalog';
import { lineFor, sumTotals } from '../lib/calc';
import type { Quantities, Totals } from '../lib/types';
import { draftService } from '../services/draftService';

/** In-progress box quantities, persisted (debounced) so a refresh doesn't lose the order. */
export function useOrderDraft() {
  const [quantities, setQuantities] = useState<Quantities>(() => {
    // Drop ids that no longer exist after a catalogue update.
    const stored = draftService.getQuantities();
    return Object.fromEntries(Object.entries(stored).filter(([id, q]) => PRODUCT_BY_ID.has(Number(id)) && q > 0));
  });
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => draftService.setQuantities(quantities), 250);
    return () => window.clearTimeout(timer.current);
  }, [quantities]);

  const setQty = useCallback((id: number, boxes: number) => {
    setQuantities((prev) => {
      if ((prev[id] ?? 0) === boxes) return prev;
      const next = { ...prev };
      if (boxes > 0) next[id] = boxes;
      else delete next[id];
      return next;
    });
  }, []);

  const clear = useCallback(() => setQuantities({}), []);

  const totals: Totals = useMemo(
    () =>
      sumTotals(
        Object.entries(quantities).map(([id, q]) => {
          const p = PRODUCT_BY_ID.get(Number(id));
          return p ? lineFor(p, q) : { boxes: 0, packets: 0, cbm: 0, kg: 0 };
        }),
      ),
    [quantities],
  );

  const lineCount = Object.keys(quantities).length;

  return { quantities, setQty, clear, totals, lineCount };
}
