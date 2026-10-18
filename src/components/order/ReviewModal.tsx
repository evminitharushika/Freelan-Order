import { Loader2, Send } from 'lucide-react';
import { cn, fmtCbm, fmtInt, fmtKg } from '../../lib/format';
import type { Customer, OrderLine, Totals } from '../../lib/types';
import { Modal } from '../ui/Modal';
import { PackBadge } from './PackBadge';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  customer: Customer;
  lines: OrderLine[];
  totals: Totals;
}

export function TotalsGrid({ totals, tone = 'light', className }: { totals: Totals; tone?: 'light' | 'dark'; className?: string }) {
  const items = [
    { label: 'Boxes', value: fmtInt(totals.boxes) },
    { label: 'Packets', value: fmtInt(totals.packets) },
    { label: 'CBM', value: fmtCbm(totals.cbm) },
    { label: 'Kg', value: fmtKg(totals.kg) },
  ];
  return (
    <dl className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4', className)}>
      {items.map((i) => (
        <div key={i.label} className={cn('rounded-2xl px-4 py-3', tone === 'dark' ? 'bg-maroon text-cream' : 'bg-cream-200/60 text-maroon')}>
          <dt className="text-[0.68rem] font-bold tracking-wider uppercase opacity-70">{i.label}</dt>
          <dd className="tabular font-display text-2xl font-black">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ReviewModal({ open, onClose, onConfirm, submitting, customer, lines, totals }: Props) {
  return (
    <Modal open={open} onClose={onClose} locked={submitting} size="lg" title="Review your order" description={`${lines.length} line${lines.length === 1 ? '' : 's'} for ${customer.name}${customer.company ? ` · ${customer.company}` : ''} · ${customer.phone}`}>
      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-ink/10">
        <div className="max-h-[42dvh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-maroon text-left text-[0.68rem] tracking-wider text-cream/85 uppercase">
              <tr>
                <th scope="col" className="px-3 py-2.5 font-bold">Item</th>
                <th scope="col" className="hidden px-3 py-2.5 font-bold sm:table-cell">Pack</th>
                <th scope="col" className="px-3 py-2.5 text-right font-bold">Boxes</th>
                <th scope="col" className="px-3 py-2.5 text-right font-bold">Pkts</th>
                <th scope="col" className="hidden px-3 py-2.5 text-right font-bold sm:table-cell">CBM</th>
                <th scope="col" className="px-3 py-2.5 text-right font-bold">Kg</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.productId} className="border-t border-ink/[0.06]">
                  <td className="px-3 py-2">
                    <span className="font-semibold">{l.name}</span> <span className="text-ink/60">{l.weight}</span>
                    <PackBadge type={l.packType} className="ml-1 sm:hidden" />
                  </td>
                  <td className="hidden px-3 py-2 sm:table-cell">
                    <PackBadge type={l.packType} />
                  </td>
                  <td className="tabular px-3 py-2 text-right font-bold">{l.boxes}</td>
                  <td className="tabular px-3 py-2 text-right">{fmtInt(l.packets)}</td>
                  <td className="tabular hidden px-3 py-2 text-right sm:table-cell">{fmtCbm(l.cbm)}</td>
                  <td className="tabular px-3 py-2 text-right">{fmtKg(l.kg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TotalsGrid totals={totals} className="mt-4" />

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={submitting} className="focus-dark rounded-full px-6 py-3.5 font-bold text-ink/70 ring-1 ring-ink/15 hover:bg-ink/5 disabled:opacity-50">
          Keep editing
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          data-autofocus
          className="focus-dark inline-flex items-center justify-center gap-2 rounded-full bg-chilli px-7 py-3.5 font-extrabold text-cream shadow-lg shadow-chilli/25 hover:bg-chilli-600 disabled:opacity-70"
        >
          {submitting ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          {submitting ? 'Placing order…' : 'Confirm & place order'}
        </button>
      </div>
    </Modal>
  );
}
