import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronLeft, ChevronRight, CircleCheck, CircleX, ClipboardList, Clock, Search } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { cn, fmtCbm, fmtDate, fmtInt, fmtKg } from '../../lib/format';
import type { OrderStatus } from '../../lib/types';
import { orderService, type OrderPage, type OrderStats } from '../../services/orderService';

type StatusFilter = OrderStatus | 'all';
const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

function StatCard({ label, value, icon, tone }: { label: string; value: number | undefined; icon: ReactNode; tone: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.06]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink/60">{label}</p>
        <span className={cn('grid size-9 place-items-center rounded-xl', tone)}>{icon}</span>
      </div>
      <p className="tabular mt-3 font-display text-4xl font-black text-maroon">{value ?? '–'}</p>
    </div>
  );
}

export default function Dashboard({ ordersOnly = false }: { ordersOnly?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as StatusFilter | null) ?? 'all';
  const sort = params.get('sort') === 'oldest' ? 'oldest' : 'newest';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [data, setData] = useState<OrderPage | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);

  /** Filters live in the URL so back/forward and shared links keep the view. */
  const update = useCallback(
    (patch: Record<string, string | null>) =>
      setParams(
        (prev) => {
          if ('q' in patch && (prev.get('q') ?? '') === (patch.q ?? '')) return prev;
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v == null || v === '' || (k === 'status' && v === 'all') || (k === 'page' && v === '1') || (k === 'sort' && v === 'newest')) next.delete(k);
            else next.set(k, v);
          }
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  // Debounce search into the URL
  useEffect(() => {
    const t = window.setTimeout(() => update({ q: search, page: '1' }), 250);
    return () => window.clearTimeout(t);
  }, [search, update]);

  useEffect(() => {
    document.title = `${ordersOnly ? 'Orders' : 'Dashboard'} · Freelan admin`;
  }, [ordersOnly]);

  useEffect(() => {
    let alive = true;
    void orderService.list({ search: params.get('q') ?? '', status, sort, page, pageSize: 8 }).then((d) => alive && setData(d));
    void orderService.stats().then((s) => alive && setStats(s));
    return () => {
      alive = false;
    };
  }, [params, status, sort, page]);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink/50">{ordersOnly ? 'Orders' : `Welcome back, ${user?.name.split(' ')[0] ?? 'Admin'}`}</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-maroon sm:text-4xl">{ordersOnly ? 'All orders' : 'Dashboard'}</h1>
        </div>
      </header>

      {!ordersOnly && (
        <section aria-label="Order statistics" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total orders" value={stats?.total} tone="bg-maroon/10 text-maroon" icon={<ClipboardList className="size-5" aria-hidden="true" />} />
          <StatCard label="Pending" value={stats?.pending} tone="bg-turmeric/30 text-[#7a5a00]" icon={<Clock className="size-5" aria-hidden="true" />} />
          <StatCard label="Approved" value={stats?.approved} tone="bg-leaf/15 text-leaf" icon={<CircleCheck className="size-5" aria-hidden="true" />} />
          <StatCard label="Rejected" value={stats?.rejected} tone="bg-chilli/10 text-chilli" icon={<CircleX className="size-5" aria-hidden="true" />} />
        </section>
      )}

      <section aria-labelledby="orders-heading" className="mt-8 rounded-3xl bg-white shadow-sm ring-1 ring-ink/[0.06]">
        <div className="flex flex-col gap-4 border-b border-ink/[0.06] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 id="orders-heading" className="sr-only">
            Orders
          </h2>
          <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Filter by status">
            {TABS.map((t) => {
              const count = t.key === 'all' ? stats?.total : stats?.[t.key];
              const active = status === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => update({ status: t.key, page: '1' })}
                  className={cn('focus-dark flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition', active ? 'bg-maroon text-cream' : 'text-ink/65 hover:bg-ink/5')}
                >
                  {t.label}
                  {count != null && <span className={cn('tabular rounded-full px-1.5 text-xs', active ? 'bg-cream/20' : 'bg-ink/5')}>{count}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-[#f7f3ee] px-4 focus-within:ring-2 focus-within:ring-chilli lg:w-72 lg:flex-none">
              <Search className="size-4 text-ink/40" aria-hidden="true" />
              <label htmlFor="order-q" className="sr-only">
                Search orders
              </label>
              <input id="order-q" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ref, name, shop or phone" className="h-10 w-full bg-transparent text-sm outline-none" />
            </div>
            <button
              type="button"
              onClick={() => update({ sort: sort === 'newest' ? 'oldest' : 'newest' })}
              className="focus-dark inline-flex shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 ring-ink/10 hover:bg-ink/5"
              aria-label={`Sort by date: ${sort === 'newest' ? 'newest first' : 'oldest first'}. Click to toggle.`}
            >
              {sort === 'newest' ? <ArrowDownWideNarrow className="size-4" aria-hidden="true" /> : <ArrowUpNarrowWide className="size-4" aria-hidden="true" />}
              <span className="hidden sm:inline">{sort === 'newest' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        </div>

        {data && data.items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-xl font-bold text-maroon">No orders found</p>
            <p className="mt-1 text-sm text-ink/55">Try another search or status filter.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="text-left text-[0.7rem] tracking-wider text-ink/50 uppercase">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-bold">Reference</th>
                    <th scope="col" className="px-3 py-3 font-bold">Customer</th>
                    <th scope="col" className="px-3 py-3 font-bold">Phone</th>
                    <th scope="col" className="px-3 py-3 font-bold">
                      <button type="button" onClick={() => update({ sort: sort === 'newest' ? 'oldest' : 'newest' })} className="inline-flex items-center gap-1 uppercase hover:text-ink">
                        Date {sort === 'newest' ? '↓' : '↑'}
                      </button>
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-bold">Boxes</th>
                    <th scope="col" className="px-3 py-3 text-right font-bold">CBM</th>
                    <th scope="col" className="px-3 py-3 text-right font-bold">Kg</th>
                    <th scope="col" className="px-5 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items ?? []).map((o) => (
                    <tr key={o.id} onClick={() => navigate(`/admin/orders/${o.id}`)} className="cursor-pointer border-t border-ink/[0.06] transition hover:bg-turmeric/10">
                      <td className="px-5 py-3.5">
                        <Link to={`/admin/orders/${o.id}`} onClick={(e) => e.stopPropagation()} className="focus-dark font-mono text-[0.8rem] font-bold text-chilli hover:underline">
                          {o.ref}
                        </Link>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="font-semibold">{o.customer.name}</p>
                        {o.customer.company && <p className="text-xs text-ink/50">{o.customer.company}</p>}
                      </td>
                      <td className="tabular px-3 py-3.5 text-ink/70">{o.customer.phone}</td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-ink/70">{fmtDate(o.createdAt)}</td>
                      <td className="tabular px-3 py-3.5 text-right font-semibold">{fmtInt(o.totals.boxes)}</td>
                      <td className="tabular px-3 py-3.5 text-right">{fmtCbm(o.totals.cbm)}</td>
                      <td className="tabular px-3 py-3.5 text-right">{fmtKg(o.totals.kg)}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-ink/[0.06] md:hidden">
              {(data?.items ?? []).map((o) => (
                <li key={o.id}>
                  <Link to={`/admin/orders/${o.id}`} className="focus-dark block px-4 py-4 hover:bg-turmeric/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-chilli">{o.ref}</p>
                        <p className="mt-0.5 truncate font-semibold">{o.customer.name}</p>
                        <p className="text-xs text-ink/55">
                          {o.customer.phone} · {fmtDate(o.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="tabular mt-2 text-xs text-ink/60">
                      {fmtInt(o.totals.boxes)} boxes · {fmtCbm(o.totals.cbm)} CBM · {fmtKg(o.totals.kg)} kg
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {data && data.total > 0 && (
          <nav className="flex items-center justify-between gap-3 border-t border-ink/[0.06] px-4 py-3 sm:px-5" aria-label="Pagination">
            <p className="text-sm text-ink/55">
              Page <span className="font-semibold text-ink">{data.page}</span> of {data.pageCount} · {data.total} order{data.total === 1 ? '' : 's'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={data.page <= 1}
                onClick={() => update({ page: String(data.page - 1) })}
                className="focus-dark grid size-9 place-items-center rounded-full ring-1 ring-ink/10 hover:bg-ink/5 disabled:opacity-35"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                disabled={data.page >= data.pageCount}
                onClick={() => update({ page: String(data.page + 1) })}
                className="focus-dark grid size-9 place-items-center rounded-full ring-1 ring-ink/10 hover:bg-ink/5 disabled:opacity-35"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}
