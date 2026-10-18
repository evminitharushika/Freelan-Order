import { motion } from 'framer-motion';
import { ArrowLeft, ListChecks, PencilLine, Search, Send, Trash2, X } from 'lucide-react';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/brand/Logo';
import { CustomerModal } from '../components/order/CustomerModal';
import { OrderCards, OrderTable } from '../components/order/OrderSheet';
import { ReviewModal } from '../components/order/ReviewModal';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { CATEGORIES, PRODUCTS, groupProducts } from '../data/catalog';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useOrderDraft } from '../hooks/useOrderDraft';
import { useOrderStart } from '../hooks/useOrderStart';
import { buildLines } from '../lib/calc';
import { cn, fmtCbm, fmtInt, fmtKg } from '../lib/format';
import { PACK_TYPES, type PackType } from '../lib/types';
import { draftService } from '../services/draftService';
import { orderService } from '../services/orderService';

function Stat({ label, value, highlight }: { label: string; value: string; highlight: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.62rem] font-bold tracking-[0.18em] text-cream/60 uppercase sm:text-[0.68rem]">{label}</dt>
      <motion.dd key={value} initial={{ opacity: 0.4, y: -3 }} animate={{ opacity: 1, y: 0 }} className={cn('tabular truncate font-display text-lg font-black sm:text-2xl', highlight ? 'text-turmeric' : 'text-cream/50')}>
        {value}
      </motion.dd>
    </div>
  );
}

export default function OrderPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { customer, setCustomer, startOrder } = useOrderStart();
  const { quantities, setQty, clear, totals, lineCount } = useOrderDraft();
  const desktop = useMediaQuery('(min-width: 1024px)');

  const [params, setParams] = useSearchParams();
  const categorySlug = params.get('category') ?? 'all';
  const activeCategory = CATEGORIES.find((c) => c.slug === categorySlug);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [pack, setPack] = useState<PackType | 'all'>('all');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Order sheet · Freelan Sri Lanka';
  }, []);

  const setCategory = (slug: string) => {
    const next = new URLSearchParams(params);
    if (slug === 'all') next.delete('category');
    else next.set('category', slug);
    setParams(next, { replace: true });
  };

  // Quantities only affect filtering in "selected only" mode, so typing a quantity doesn't regroup the sheet otherwise.
  const selectedFilter = selectedOnly ? quantities : null;
  const groups = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const filtered = PRODUCTS.filter(
      (p) =>
        (!activeCategory || p.category === activeCategory.name) &&
        (pack === 'all' || p.packType === pack) &&
        (!selectedFilter || (selectedFilter[p.id] ?? 0) > 0) &&
        (!q || `${p.name} ${p.weight} ${p.category}`.toLowerCase().includes(q)),
    );
    return groupProducts(filtered);
  }, [activeCategory, pack, selectedFilter, deferredSearch]);

  const rowCount = groups.reduce((n, g) => n + g.items.length, 0);
  const selectedPerCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of PRODUCTS) if ((quantities[p.id] ?? 0) > 0) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return m;
  }, [quantities]);

  const lines = useMemo(() => (reviewOpen ? buildLines(PRODUCTS, quantities) : []), [reviewOpen, quantities]);

  const onSubmitClick = () => {
    if (lineCount === 0) {
      toast.error('Add at least one box before submitting your order.');
      return;
    }
    setReviewOpen(true);
  };

  const confirm = useCallback(async () => {
    if (!customer) return;
    setSubmitting(true);
    try {
      const order = await orderService.create(customer, quantities);
      draftService.clearQuantities();
      clear();
      setReviewOpen(false);
      navigate(`/order/success/${order.ref}`, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not place the order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [customer, quantities, clear, navigate, toast]);

  const resetFilters = () => {
    setSearch('');
    setPack('all');
    setSelectedOnly(false);
    setCategory('all');
  };

  return (
    <div className="min-h-[100svh] bg-cream">
      {/* Sticky header: identity, live totals, submit, categories */}
      <header className="sticky top-0 z-40 bg-maroon text-cream shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pt-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" aria-label="Back to Freelan home" className="hidden sm:block">
              <Logo />
            </Link>
            <Link to="/" aria-label="Back to Freelan home" className="sm:hidden">
              <Logo compact />
            </Link>
            {customer && (
              <button
                type="button"
                onClick={() => startOrder(`/order${params.toString() ? `?${params}` : ''}`)}
                className="group flex min-w-0 items-center gap-2 rounded-full bg-cream/10 py-1.5 pr-3 pl-1.5 text-left text-sm hover:bg-cream/15"
                aria-label={`Ordering as ${customer.name}. Edit details`}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-turmeric font-display font-black text-maroon">{customer.name.charAt(0).toUpperCase()}</span>
                <span className="min-w-0">
                  <span className="block text-[0.6rem] leading-none font-bold tracking-widest text-cream/55 uppercase">Ordering as</span>
                  <span className="block truncate font-bold">{customer.name}</span>
                </span>
                <PencilLine className="size-3.5 shrink-0 text-cream/50 group-hover:text-turmeric" aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onSubmitClick}
            aria-disabled={lineCount === 0}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold tracking-wider uppercase transition sm:px-6 sm:py-3',
              lineCount > 0 ? 'bg-turmeric text-maroon hover:bg-turmeric-300 active:scale-95' : 'cursor-not-allowed bg-cream/15 text-cream/50',
            )}
          >
            <Send className="size-4" aria-hidden="true" />
            Submit<span className="hidden sm:inline"> order</span>
          </button>
        </div>

        <dl className="mx-auto grid max-w-7xl grid-cols-4 gap-3 px-4 py-3 sm:px-6 lg:px-8" aria-live="polite" aria-label="Order totals">
          <Stat label="Boxes" value={fmtInt(totals.boxes)} highlight={totals.boxes > 0} />
          <Stat label="Packets" value={fmtInt(totals.packets)} highlight={totals.boxes > 0} />
          <Stat label="CBM" value={fmtCbm(totals.cbm)} highlight={totals.boxes > 0} />
          <Stat label="Kg" value={fmtKg(totals.kg)} highlight={totals.boxes > 0} />
        </dl>

        <nav aria-label="Categories" className="border-t border-cream/10">
          <div className="no-scrollbar mx-auto flex max-w-7xl gap-1.5 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8" role="tablist">
            {[{ slug: 'all', short: 'All', count: PRODUCTS.length, name: 'All' }, ...CATEGORIES].map((c) => {
              const active = c.slug === (activeCategory?.slug ?? 'all');
              const picked = c.slug === 'all' ? lineCount : (selectedPerCategory.get(c.name) ?? 0);
              return (
                <button
                  key={c.slug}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(c.slug)}
                  className={cn(
                    'relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition',
                    active ? 'bg-cream text-maroon' : 'text-cream/75 hover:bg-cream/10 hover:text-cream',
                  )}
                >
                  {c.name === 'Appertizers' ? 'Appetizers' : c.name}
                  <span className={cn('tabular text-xs', active ? 'text-maroon/50' : 'text-cream/40')}>{c.count}</span>
                  {picked > 0 && <span className="tabular grid min-w-5 place-items-center rounded-full bg-turmeric px-1 text-[0.65rem] text-maroon">{picked}</span>}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-5 pb-24 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-ink/10 focus-within:ring-2 focus-within:ring-chilli">
            <Search className="size-4.5 text-ink/40" aria-hidden="true" />
            <label htmlFor="order-search" className="sr-only">
              Search items
            </label>
            <input
              id="order-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items, e.g. turmeric, 250g…"
              className="h-11 w-full bg-transparent outline-none placeholder:text-ink/35"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="focus-dark rounded-full p-1 text-ink/50 hover:text-ink">
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0 [&>*]:shrink-0">
            <label htmlFor="pack-filter" className="sr-only">
              Pack type
            </label>
            <select
              id="pack-filter"
              value={pack}
              onChange={(e) => setPack(e.target.value as PackType | 'all')}
              className="focus-dark h-11 rounded-full bg-white px-4 text-sm font-semibold ring-1 ring-ink/10 outline-none"
            >
              <option value="all">All pack types</option>
              {PACK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-pressed={selectedOnly}
              onClick={() => setSelectedOnly((s) => !s)}
              className={cn(
                'focus-dark inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 transition',
                selectedOnly ? 'bg-turmeric text-maroon ring-turmeric-600' : 'bg-white ring-ink/10 hover:ring-ink/25',
              )}
            >
              <ListChecks className="size-4" aria-hidden="true" />
              Selected only
              {lineCount > 0 && <span className="tabular rounded-full bg-maroon px-1.5 text-xs text-cream">{lineCount}</span>}
            </button>
            <button
              type="button"
              onClick={() => (lineCount ? setConfirmClear(true) : toast.info('Nothing to clear yet.'))}
              className="focus-dark inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-chilli ring-1 ring-ink/10 hover:bg-chilli/5"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Clear all
            </button>
          </div>
        </div>

        <p className="mb-3 text-sm text-ink/55" aria-live="polite">
          Showing {rowCount} of {PRODUCTS.length} items{activeCategory ? ` in ${activeCategory.name}` : ''}.
        </p>

        {groups.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-ink/[0.06]">
            <p className="font-display text-2xl font-bold text-maroon">No items match.</p>
            <p className="mt-2 text-ink/60">{selectedOnly ? 'You haven’t added any boxes in this view yet.' : 'Try a different search or pack type.'}</p>
            <button type="button" onClick={resetFilters} className="focus-dark mt-5 rounded-full bg-chilli px-5 py-2.5 font-bold text-cream">
              Reset filters
            </button>
          </div>
        ) : desktop ? (
          <OrderTable groups={groups} quantities={quantities} onChange={setQty} showCategory={!activeCategory} />
        ) : (
          <OrderCards groups={groups} quantities={quantities} onChange={setQty} showCategory={!activeCategory} />
        )}

        <div className="mt-8 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-maroon/70 hover:text-maroon">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to home
          </Link>
          <p className="text-sm text-ink/50">Your sheet is saved on this device as you go.</p>
        </div>
      </main>

      {customer ? (
        <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} onConfirm={confirm} submitting={submitting} customer={customer} lines={lines} totals={totals} />
      ) : (
        <CustomerModal open initial={null} onClose={() => navigate('/')} onSubmit={setCustomer} />
      )}

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} size="sm" title="Clear the whole sheet?" description={`This removes all ${lineCount} item${lineCount === 1 ? '' : 's'} you've added.`}>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => setConfirmClear(false)} className="focus-dark rounded-full px-5 py-3 font-bold ring-1 ring-ink/15 hover:bg-ink/5">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              clear();
              setSelectedOnly(false);
              setConfirmClear(false);
              toast.success('Order sheet cleared.');
            }}
            className="focus-dark rounded-full bg-chilli px-5 py-3 font-bold text-cream hover:bg-chilli-600"
          >
            Clear all
          </button>
        </div>
      </Modal>
    </div>
  );
}
