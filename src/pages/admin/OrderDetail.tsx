import { ArrowLeft, Building, CircleCheck, CircleX, Clock, Edit2, Loader2, Phone, Printer, Save, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { PRODUCTS } from '../../data/catalog';
import { readJSON } from '../../services/storage';
import type { AdminProduct } from '../../services/productService';
import { buildLines, sumTotals } from '../../lib/calc';

const EVENT_STYLE: Record<OrderStatus, { icon: typeof Clock; cls: string; label: string }> = {
  pending: { icon: Clock, cls: 'bg-turmeric text-maroon', label: 'Order placed' },
  approved: { icon: CircleCheck, cls: 'bg-leaf text-white', label: 'Approved' },
  rejected: { icon: CircleX, cls: 'bg-chilli text-white', label: 'Rejected' },
};

const INPUT_CLS =
  'w-full rounded-xl border-2 border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-chilli transition';

/* ------------------------------------------------------------------ edit panel */

function EditOrderPanel({
  order,
  onSave,
  onCancel,
  saving,
}: {
  order: Order;
  onSave: (patch: { customer?: { name: string; phone: string; company?: string }; quantities?: Record<number, number>; note?: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [custName, setCustName] = useState(order.customer.name);
  const [custPhone, setCustPhone] = useState(order.customer.phone);
  const [custCompany, setCustCompany] = useState(order.customer.company ?? '');
  const [note, setNote] = useState('');

  // Build quantities from existing order items
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    const q: Record<number, number> = {};
    for (const item of order.items) q[item.productId] = item.boxes;
    return q;
  });

  // Merge static + admin products for display
  const allProducts = useMemo(() => {
    const adminProds = readJSON<AdminProduct[]>('admin-products', []);
    const staticProds = PRODUCTS as unknown as AdminProduct[];
    const byId = new Map<number, AdminProduct>();
    for (const p of [...staticProds, ...adminProds]) byId.set(p.id, p);
    return Array.from(byId.values());
  }, []);

  const activeProducts = useMemo(
    () => allProducts.filter((p) => !('active' in p) || (p as AdminProduct).active),
    [allProducts],
  );

  const categoryList = useMemo(() => {
    const cats = new Set(activeProducts.map((p) => p.category));
    return Array.from(cats).sort();
  }, [activeProducts]);

  const [activeCategory, setActiveCategory] = useState<string>('all');

  const visibleProducts = useMemo(
    () => (activeCategory === 'all' ? activeProducts : activeProducts.filter((p) => p.category === activeCategory)),
    [activeProducts, activeCategory],
  );

  // Recalculate preview lines
  const previewLines = useMemo(() => {
    return buildLines(activeProducts as Parameters<typeof buildLines>[0], quantities);
  }, [activeProducts, quantities]);
  const previewTotals = useMemo(() => sumTotals(previewLines), [previewLines]);

  const setQty = (id: number, val: string) => {
    const n = Math.max(0, Math.floor(Number(val) || 0));
    setQuantities((q) => {
      if (n === 0) {
        const next = { ...q };
        delete next[id];
        return next;
      }
      return { ...q, [id]: n };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;
    onSave({
      customer: { name: custName.trim(), phone: custPhone.trim(), company: custCompany.trim() || undefined },
      quantities: Object.keys(quantities).length > 0 ? quantities : undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Customer */}
      <div className="rounded-2xl bg-white p-5 ring-1 ring-ink/[0.06]">
        <h3 className="font-display text-base font-bold text-maroon mb-4">Customer details</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink/60 uppercase tracking-wider">Name *</label>
            <input required value={custName} onChange={(e) => setCustName(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink/60 uppercase tracking-wider">Phone *</label>
            <input required value={custPhone} onChange={(e) => setCustPhone(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink/60 uppercase tracking-wider">Company</label>
            <input value={custCompany} onChange={(e) => setCustCompany(e.target.value)} placeholder="Optional" className={INPUT_CLS} />
          </div>
        </div>
      </div>

      {/* Items editor */}
      <div className="rounded-2xl bg-white p-5 ring-1 ring-ink/[0.06]">
        <h3 className="font-display text-base font-bold text-maroon mb-3">Order items</h3>

        {/* Category tabs */}
        <div className="no-scrollbar -mx-1 mb-4 flex gap-1 overflow-x-auto px-1">
          {['all', ...categoryList].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap',
                activeCategory === cat ? 'bg-maroon text-cream' : 'bg-ink/5 text-ink/65 hover:bg-ink/10',
              )}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-left text-[0.68rem] uppercase tracking-wider text-ink/50">
              <tr>
                <th className="py-2 pr-3 font-bold">Product</th>
                <th className="px-3 py-2 font-bold">Weight</th>
                <th className="px-3 py-2 text-right font-bold">Boxes</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((p) => (
                <tr key={p.id} className={cn('border-t border-ink/[0.06]', (quantities[p.id] ?? 0) > 0 && 'bg-turmeric/5')}>
                  <td className="py-2 pr-3">
                    <p className="font-medium leading-tight">{p.name}</p>
                    <p className="text-[0.65rem] text-ink/40">{p.category}</p>
                  </td>
                  <td className="px-3 py-2 text-ink/60">{p.weight}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={quantities[p.id] ?? ''}
                      onChange={(e) => setQty(p.id, e.target.value)}
                      placeholder="0"
                      className="w-20 rounded-lg border-2 border-ink/10 px-2 py-1 text-right text-sm outline-none focus:border-chilli ml-auto block"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Preview totals */}
        {previewLines.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-ink/[0.06] pt-4 text-sm">
            <span className="font-bold text-maroon">Preview:</span>
            <span>{fmtInt(previewTotals.boxes)} boxes</span>
            <span>{fmtInt(previewTotals.packets)} packets</span>
            <span>{fmtCbm(previewTotals.cbm)} CBM</span>
            <span>{fmtKg(previewTotals.kg)} kg</span>
          </div>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink/70">Admin note (optional)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for editing this order"
          className={INPUT_CLS}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-full px-5 py-2.5 font-bold ring-1 ring-ink/15 hover:bg-ink/5 disabled:opacity-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-maroon px-5 py-2.5 font-bold text-cream hover:bg-maroon/90 disabled:opacity-70"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ main page */

export default function OrderDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

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

  const handleEditSave = async (patch: Parameters<typeof orderService.updateOrder>[1]) => {
    setEditSaving(true);
    try {
      const updated = await orderService.updateOrder(order.id, patch, user?.name ?? 'Admin');
      setOrder(updated);
      setEditing(false);
      toast.success(`Order ${updated.ref} updated successfully.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the order.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-maroon">
          <ArrowLeft className="size-4" aria-hidden="true" /> All orders
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="focus-dark inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-ink/10 hover:bg-ink/5"
          >
            <Edit2 className="size-4" aria-hidden="true" /> Edit order
          </button>
          <button type="button" onClick={() => window.print()} className="focus-dark inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-ink/10 hover:bg-ink/5">
            <Printer className="size-4" aria-hidden="true" /> Print
          </button>
        </div>
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

      {/* Approve / Reject modal */}
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

      {/* Edit order modal */}
      <Modal
        open={editing}
        onClose={() => !editSaving && setEditing(false)}
        locked={editSaving}
        size="lg"
        title="Edit order"
        description={`${order.ref} · ${order.customer.name}`}
      >
        <div className="mt-4">
          <EditOrderPanel
            order={order}
            onSave={handleEditSave}
            onCancel={() => setEditing(false)}
            saving={editSaving}
          />
        </div>
      </Modal>
    </div>
  );
}
