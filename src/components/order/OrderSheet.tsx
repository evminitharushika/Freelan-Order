import { memo } from 'react';
import type { ProductGroup } from '../../data/catalog';
import { lineFor } from '../../lib/calc';
import { cn, fmtCbm, fmtInt, fmtKg } from '../../lib/format';
import type { Product, Quantities } from '../../lib/types';
import { PackBadge } from './PackBadge';
import { QuantityStepper } from './QuantityStepper';

interface SheetProps {
  groups: ProductGroup[];
  quantities: Quantities;
  onChange: (id: number, boxes: number) => void;
  showCategory: boolean;
}

const rowLabel = (p: Product) => `${p.name} ${p.weight} ${p.packType ?? ''}`.trim();

/* ------------------------------------------------------------------ desktop table */

const TableRow = memo(function TableRow({ product: p, qty, onChange }: { product: Product; qty: number; onChange: (id: number, boxes: number) => void }) {
  const line = lineFor(p, qty);
  const unavailable = p.packetsPerBox == null;
  return (
    <tr className={cn('border-t border-ink/[0.06] transition-colors', qty > 0 ? 'bg-turmeric/20' : 'hover:bg-cream-200/50')}>
      <td className="py-2.5 pr-3 pl-6">
        <span className="tabular font-semibold">{p.weight}</span>
        <span className="ml-2 text-xs text-ink/40">#{p.id}</span>
      </td>
      <td className="px-3 py-2.5">
        <PackBadge type={p.packType} />
      </td>
      <td className="tabular px-3 py-2.5 text-right text-ink/70">{p.packetsPerBox ?? '—'}</td>
      <td className="tabular px-3 py-2.5 text-right text-ink/70">{p.cbmPerBox != null ? fmtCbm(p.cbmPerBox) : '—'}</td>
      <td className="px-3 py-1.5 text-center">
        {unavailable ? (
          <span className="text-xs font-semibold text-ink/50">Ask us for pack size</span>
        ) : (
          <QuantityStepper value={qty} onChange={(v) => onChange(p.id, v)} label={rowLabel(p)} size="sm" />
        )}
      </td>
      <td className={cn('tabular px-3 py-2.5 text-right', qty > 0 ? 'font-bold text-ink' : 'text-ink/30')}>{fmtInt(line.packets)}</td>
      <td className={cn('tabular px-3 py-2.5 text-right', qty > 0 ? 'font-bold text-ink' : 'text-ink/30')}>{fmtCbm(line.cbm)}</td>
      <td className={cn('tabular py-2.5 pr-6 pl-3 text-right', qty > 0 ? 'font-bold text-ink' : 'text-ink/30')}>{fmtKg(line.kg)}</td>
    </tr>
  );
});

export function OrderTable({ groups, quantities, onChange, showCategory }: SheetProps) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_0_rgba(0,0,0,0.04),0_20px_50px_-30px_rgba(74,4,16,0.35)] ring-1 ring-ink/[0.06]">
      <table className="w-full text-sm">
        <caption className="sr-only">Order sheet. Enter the number of boxes for each item.</caption>
        <thead className="bg-maroon text-left text-[0.7rem] tracking-wider text-cream/85 uppercase">
          <tr>
            <th scope="col" className="py-3 pr-3 pl-6 font-bold">Item / weight</th>
            <th scope="col" className="px-3 py-3 font-bold">Pack</th>
            <th scope="col" className="px-3 py-3 text-right font-bold">Pkts / box</th>
            <th scope="col" className="px-3 py-3 text-right font-bold">CBM / box</th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-turmeric">Box quantity</th>
            <th scope="col" className="px-3 py-3 text-right font-bold">Order qty (pkts)</th>
            <th scope="col" className="px-3 py-3 text-right font-bold">CBM</th>
            <th scope="col" className="py-3 pr-6 pl-3 text-right font-bold">Kg</th>
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.key}>
            <tr className="border-t-4 border-cream">
              <th scope="rowgroup" colSpan={8} className="bg-cream-200/40 py-2.5 pr-6 pl-6 text-left">
                <span className="font-display text-lg font-bold text-maroon">{g.name}</span>
                {showCategory && <span className="ml-3 rounded-full bg-maroon/8 px-2 py-0.5 text-[0.68rem] font-bold text-maroon/70">{g.category}</span>}
                <span className="ml-3 text-xs font-medium text-ink/45">
                  {g.items.length} size{g.items.length === 1 ? '' : 's'}
                </span>
              </th>
            </tr>
            {g.items.map((p) => (
              <TableRow key={p.id} product={p} qty={quantities[p.id] ?? 0} onChange={onChange} />
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ mobile cards */

const CardRow = memo(function CardRow({ product: p, qty, onChange }: { product: Product; qty: number; onChange: (id: number, boxes: number) => void }) {
  const line = lineFor(p, qty);
  const unavailable = p.packetsPerBox == null;
  return (
    <li className={cn('px-4 py-3 transition-colors', qty > 0 && 'bg-turmeric/20')}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="tabular text-base font-bold">{p.weight}</span>
            <PackBadge type={p.packType} />
          </div>
          <p className="tabular mt-1 text-xs text-ink/55">
            {p.packetsPerBox ?? '—'} pkts/box · {p.cbmPerBox != null ? fmtCbm(p.cbmPerBox) : '—'} CBM/box
          </p>
        </div>
        {unavailable ? (
          <span className="text-right text-xs font-semibold text-ink/50">Ask us for
            <br />
            pack size
          </span>
        ) : (
          <QuantityStepper value={qty} onChange={(v) => onChange(p.id, v)} label={rowLabel(p)} />
        )}
      </div>
      {qty > 0 && (
        <dl className="tabular mt-2 grid grid-cols-3 gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs">
          <div>
            <dt className="text-ink/50">Packets</dt>
            <dd className="font-bold">{fmtInt(line.packets)}</dd>
          </div>
          <div>
            <dt className="text-ink/50">CBM</dt>
            <dd className="font-bold">{fmtCbm(line.cbm)}</dd>
          </div>
          <div>
            <dt className="text-ink/50">Kg</dt>
            <dd className="font-bold">{fmtKg(line.kg)}</dd>
          </div>
        </dl>
      )}
    </li>
  );
});

export function OrderCards({ groups, quantities, onChange, showCategory }: SheetProps) {
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <section key={g.key} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink/[0.06] [content-visibility:auto] [contain-intrinsic-size:auto_180px]" aria-label={g.name}>
          <header className="flex items-baseline justify-between gap-2 border-b border-ink/[0.06] bg-cream-200/40 px-4 py-2.5">
            <h3 className="font-display text-lg leading-tight font-bold text-maroon">{g.name}</h3>
            {showCategory && <span className="shrink-0 text-[0.68rem] font-bold text-maroon/60">{g.category}</span>}
          </header>
          <ul className="divide-y divide-ink/[0.06]">
            {g.items.map((p) => (
              <CardRow key={p.id} product={p} qty={quantities[p.id] ?? 0} onChange={onChange} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
