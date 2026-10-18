import { ArrowLeft, Building, CircleCheck, CircleX, Clock, Loader2, Phone, Printer, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { PackBadge } from '../../components/order/PackBadge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { company } from '../../config/company';
import { useAuth } from '../../hooks/useAuth';
import { cn, fmtCbm, fmtDateTime, fmtInt, fmtKg } from '../../lib/format';
import type { Order, OrderStatus } from '../../lib/types';
import { orderService } from '../../services/orderService';

const EVENT_STYLE: Record<OrderStatus, { icon: typeof Clock; cls: string; label: string }> = {
  pending: { icon: Clock, cls: 'bg-turmeric text-maroon', label: 'Order placed' },
  approved: { icon: CircleCheck, cls: 'bg-leaf text-white', label: 'Approved' },
  rejected: { icon: CircleX, cls: 'bg-chilli text-white', label: 'Rejected' },
};

export default function OrderDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    void orderService.get(id).then((o) => {
      if (!alive) return;
      setOrder(o);
      if (o) document.title = `${o.ref} · Freelan admin`;
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (order === undefined) {
    return (
      <div className="grid h-64 place-items-center" role="status" aria-label="Loading order">
        <Loader2 className="size-8 animate-spin text-chilli" />
      </div>
    );
  }
  if (order === null) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-ink/[0.06]">
        <p className="font-display text-2xl font-bold text-maroon">Order not found</p>
        <Link to="/admin" className="mt-4 inline-block font-semibold text-chilli hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const apply = async () => {
    if (!action) return;
    setSaving(true);
    try {
      const updated = await orderService.setStatus(order.id, action, user?.name ?? 'Admin', action === 'rejected' ? reason.trim() : undefined);
      setOrder(updated);
      toast.success(`Order ${updated.ref} ${action}.`);
      setAction(null);
      setReason('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the order.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-maroon">
          <ArrowLeft className="size-4" aria-hidden="true" /> All orders
        </Link>
        <button type="button" onClick={() => window.print()} className="focus-dark inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-ink/10 hover:bg-ink/5">
          <Printer className="size-4" aria-hidden="true" /> Print
        </button>
      </div>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 hidden print:block">
            <p className="font-display text-xl font-black text-chilli">{company.name} · Order</p>
            <p className="text-xs text-ink/70">
              {company.address.oneLine} · {[...company.phones, company.mobile].map((p) => p.display).join(' · ')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-maroon sm:text-3xl">{order.ref}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink/55">Placed {fmtDateTime(order.createdAt)}</p>
        </div>
        {order.status === 'pending' && (
          <div className="no-print flex gap-2">
            <button type="button" onClick={() => setAction('rejected')} className="focus-dark inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-bold text-chilli ring-1 ring-chilli/30 hover:bg-chilli/5">
              <CircleX className="size-4.5" aria-hidden="true" /> Reject
            </button>
            <button type="button" onClick={() => setAction('approved')} className="focus-dark inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-2.5 font-bold text-white hover:bg-leaf/90">
              <CircleCheck className="size-4.5" aria-hidden="true" /> Approve
            </button>
          </div>
        )}
      </header>

      {order.status === 'rejected' && order.rejectionReason && (
        <p className="mt-4 rounded-2xl bg-chilli/8 px-4 py-3 text-sm text-chilli-700">
          <span className="font-bold">Rejection reason:</span> {order.rejectionReason}
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="print-area min-w-0 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.06] sm:p-6 lg:col-span-2" aria-labelledby="items-heading">
          <h2 id="items-heading" className="font-display text-xl font-bold text-maroon">
            Items <span className="text-base font-medium text-ink/45">({order.items.length})</span>
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-[0.68rem] tracking-wider text-ink/50 uppercase">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-bold">Item</th>
                  <th scope="col" className="px-3 py-2 font-bold">Weight</th>
                  <th scope="col" className="px-3 py-2 font-bold">Pack</th>
                  <th scope="col" className="px-3 py-2 text-right font-bold">Boxes</th>
                  <th scope="col" className="px-3 py-2 text-right font-bold">Packets</th>
                  <th scope="col" className="px-3 py-2 text-right font-bold">CBM</th>
                  <th scope="col" className="py-2 pl-3 text-right font-bold">Kg</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((l) => (
                  <tr key={l.productId} className="border-t border-ink/[0.06]">
                    <td className="py-2.5 pr-3">
                      <p className="font-semibold">{l.name}</p>
                      <p className="text-xs text-ink/45">{l.category}</p>
                    </td>
                    <td className="px-3 py-2.5">{l.weight}</td>
                    <td className="px-3 py-2.5">
                      <PackBadge type={l.packType} />
                    </td>
                    <td className="tabular px-3 py-2.5 text-right font-bold">{fmtInt(l.boxes)}</td>
                    <td className="tabular px-3 py-2.5 text-right">{fmtInt(l.packets)}</td>
                    <td className="tabular px-3 py-2.5 text-right">{fmtCbm(l.cbm)}</td>
                    <td className="tabular py-2.5 pl-3 text-right">{fmtKg(l.kg)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-maroon/20 font-bold text-maroon">
                  <th scope="row" colSpan={3} className="py-3 pr-3 text-left">
                    Totals
                  </th>
                  <td className="tabular px-3 py-3 text-right">{fmtInt(order.totals.boxes)}</td>
                  <td className="tabular px-3 py-3 text-right">{fmtInt(order.totals.packets)}</td>
                  <td className="tabular px-3 py-3 text-right">{fmtCbm(order.totals.cbm)}</td>
                  <td className="tabular py-3 pl-3 text-right">{fmtKg(order.totals.kg)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className="min-w-0 space-y-5">
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.06] sm:p-6" aria-labelledby="customer-heading">
            <h2 id="customer-heading" className="font-display text-xl font-bold text-maroon">
              Customer
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User className="size-4.5 text-ink/40" aria-hidden="true" />
                <dt className="sr-only">Name</dt>
                <dd className="font-semibold">{order.customer.name}</dd>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="size-4.5 text-ink/40" aria-hidden="true" />
                <dt className="sr-only">Phone</dt>
                <dd>
                  <a href={`tel:${order.customer.phone.replace(/\s/g, '')}`} className="text-chilli hover:underline">
                    {order.customer.phone}
                  </a>
                </dd>
              </div>
              <div className="flex items-center gap-3">
                <Building className="size-4.5 text-ink/40" aria-hidden="true" />
                <dt className="sr-only">Company</dt>
                <dd className={cn(!order.customer.company && 'text-ink/40 italic')}>{order.customer.company ?? 'No company given'}</dd>
              </div>
            </dl>
          </section>

          <section className="no-print rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.06] sm:p-6" aria-labelledby="timeline-heading">
            <h2 id="timeline-heading" className="font-display text-xl font-bold text-maroon">
              Status timeline
            </h2>
            <ol className="relative mt-5 space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-0.5 before:bg-ink/10">
              {order.history.map((ev, i) => {
                const s = EVENT_STYLE[ev.status];
                return (
                  <li key={i} className="relative flex gap-3">
                    <span className={cn('relative z-10 grid size-8 shrink-0 place-items-center rounded-full', s.cls)}>
                      <s.icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-bold">{s.label}</p>
                      <p className="text-xs text-ink/55">
                        {fmtDateTime(ev.at)}
                        {ev.by ? ` · ${ev.by}` : ''}
                      </p>
                      {ev.note && ev.note !== 'Order placed' && <p className="mt-1 rounded-lg bg-ink/[0.04] px-2.5 py-1.5 text-xs text-ink/70">{ev.note}</p>}
                    </div>
                  </li>
                );
              })}
              {order.status === 'pending' && (
                <li className="relative flex gap-3 opacity-50">
                  <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 border-dashed border-ink/25 bg-white" />
                  <p className="pt-1.5 text-sm font-semibold">Awaiting review</p>
                </li>
              )}
            </ol>
          </section>
        </div>
      </div>

      <Modal
        open={action !== null}
        onClose={() => !saving && setAction(null)}
        locked={saving}
        size="sm"
        title={action === 'approved' ? 'Approve this order?' : 'Reject this order?'}
        description={`${order.ref} · ${order.customer.name} · ${fmtInt(order.totals.boxes)} boxes`}
      >
        {action === 'rejected' && (
          <div className="mt-4">
            <label htmlFor="reject-reason" className="text-sm font-semibold text-ink/80">
              Reason <span className="font-normal text-ink/45">(optional, shown on the order)</span>
            </label>
            <textarea
              id="reject-reason"
              data-autofocus
              rows={3}
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Item out of stock this month"
              className="mt-1.5 w-full rounded-xl border-2 border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-chilli"
            />
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setAction(null)} disabled={saving} className="focus-dark rounded-full px-5 py-3 font-bold ring-1 ring-ink/15 hover:bg-ink/5 disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={saving}
            className={cn(
              'focus-dark inline-flex items-center gap-2 rounded-full px-5 py-3 font-bold text-white disabled:opacity-70',
              action === 'approved' ? 'bg-leaf hover:bg-leaf/90' : 'bg-chilli hover:bg-chilli-600',
            )}
          >
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {action === 'approved' ? 'Yes, approve' : 'Yes, reject'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
