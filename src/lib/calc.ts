import type { OrderLine, Product, Quantities, Totals } from './types';

export const EMPTY_TOTALS: Totals = { boxes: 0, packets: 0, cbm: 0, kg: 0 };

/** Mirrors the spreadsheet formulas: Pkts = boxes × packets/box, CBM = boxes × CBM/box, Kg = Pkts × kg/packet. */
export function lineFor(product: Product, boxes: number): Totals {
  const packets = boxes * (product.packetsPerBox ?? 0);
  return {
    boxes,
    packets,
    cbm: boxes * (product.cbmPerBox ?? 0),
    kg: packets * (product.kgPerPacket ?? 0),
  };
}

export function addTotals(a: Totals, b: Totals): Totals {
  return { boxes: a.boxes + b.boxes, packets: a.packets + b.packets, cbm: a.cbm + b.cbm, kg: a.kg + b.kg };
}

export function sumTotals(lines: Totals[]): Totals {
  return lines.reduce(addTotals, EMPTY_TOTALS);
}

export function buildLines(products: Product[], qty: Quantities): OrderLine[] {
  const lines: OrderLine[] = [];
  for (const p of products) {
    const boxes = qty[p.id] ?? 0;
    if (boxes <= 0) continue;
    lines.push({
      productId: p.id,
      category: p.category,
      name: p.name,
      weight: p.weight,
      packType: p.packType,
      ...lineFor(p, boxes),
    });
  }
  return lines;
}
