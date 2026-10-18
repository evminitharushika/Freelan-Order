import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Printer, ShoppingBasket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Logo } from '../components/brand/Logo';
import { PackBadge } from '../components/order/PackBadge';
import { TotalsGrid } from '../components/order/ReviewModal';
import { company, whatsappLink } from '../config/company';
import { useOrderStart } from '../hooks/useOrderStart';
import { fmtCbm, fmtDateTime, fmtInt, fmtKg } from '../lib/format';
import type { Order } from '../lib/types';
import { orderService } from '../services/orderService';

function whatsappMessage(o: Order): string {
  const lines = o.items.slice(0, 25).map((l) => `• ${l.name} ${l.weight}${l.packType ? ` (${l.packType})` : ''}: ${l.boxes} box${l.boxes === 1 ? '' : 'es'}`);
  if (o.items.length > 25) lines.push(`…and ${o.items.length - 25} more`);
  return [
    `Hi ${company.shortName}, I just placed order ${o.ref}.`,
    `Name: ${o.customer.name}${o.customer.company ? ` (${o.customer.company})` : ''}`,
    `Phone: ${o.customer.phone}`,
    '',
    ...lines,
    '',
    `Total: ${o.totals.boxes} boxes · ${fmtInt(o.totals.packets)} pkts · ${fmtCbm(o.totals.cbm)} CBM · ${fmtKg(o.totals.kg)} kg`,
  ].join('\n');
}

function burst() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#D90429', '#FFC300', '#FFFFFF', '#FF8A00'];
  const fire = (ratio: number, opts: confetti.Options) => confetti({ origin: { y: 0.6 }, colors, disableForReducedMotion: true, particleCount: Math.floor(220 * ratio), ...opts });
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

export default function OrderSuccess() {
  const { ref = '' } = useParams();
  const { startOrder } = useOrderStart();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    document.title = `Order ${ref} · Freelan Sri Lanka`;
    let alive = true;
    void orderService.get(ref).then((o) => {
      if (!alive) return;
      setOrder(o);
      if (o) window.setTimeout(burst, 250);
    });
    return () => {
      alive = false;
    };
  }, [ref]);

  if (order === undefined) {
    return <div className="min-h-[100svh] bg-chilli" role="status" aria-label="Loading order" />;
  }

  if (order === null) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-cream px-6 text-center">
        <div>
          <p className="font-display text-4xl font-black text-maroon">Order not found</p>
          <p className="mt-2 text-ink/60">We couldn’t find order {ref} on this device.</p>
          <Link to="/" className="mt-6 inline-block rounded-full bg-chilli px-6 py-3 font-bold text-cream">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-cream print:bg-white">
      <section className="grain relative overflow-hidden bg-chilli px-4 pt-6 pb-28 text-cream sm:px-6 print:hidden">
        <div aria-hidden="true" className="absolute top-10 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-turmeric/30 blur-3xl" />
        <div className="relative mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" aria-label="Freelan home">
            <Logo />
          </Link>
        </div>
        <div className="relative mx-auto mt-12 max-w-4xl text-center">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
            className="mx-auto grid size-24 place-items-center rounded-full bg-turmeric text-maroon shadow-[0_20px_50px_-15px_rgba(255,195,0,0.8)]"
          >
            <svg viewBox="0 0 52 52" className="size-12" aria-hidden="true">
              <motion.path
                d="M14 27 l8 8 l16 -18"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.45, duration: 0.5, ease: 'easeOut' }}
              />
            </svg>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 font-display text-[clamp(2.6rem,8vw,5rem)] leading-none font-black tracking-tight">
            Thank you, {order.customer.name.split(' ')[0]}!
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mx-auto mt-4 max-w-md text-lg text-cream/80">
            Your order is in. Our team will call {order.customer.phone} to confirm delivery.
          </motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.65 }} className="mt-8 inline-flex flex-col items-center rounded-3xl border-2 border-dashed border-turmeric/60 bg-maroon/30 px-8 py-4">
            <span className="text-xs font-bold tracking-[0.3em] text-cream/60 uppercase">Order reference</span>
            <span className="tabular font-display text-3xl font-black tracking-wide text-turmeric sm:text-4xl">{order.ref}</span>
          </motion.div>
        </div>
      </section>

      <main className="relative mx-auto -mt-16 max-w-4xl px-4 pb-20 sm:px-6 print:mt-0 print:max-w-none print:px-0">
        <article className="print-area rounded-3xl bg-white p-5 shadow-[0_30px_60px_-30px_rgba(74,4,16,0.4)] ring-1 ring-ink/[0.06] sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-5">
            <div>
              <div className="mb-3 hidden print:block">
                <p className="font-display text-2xl font-black text-chilli">{company.name}</p>
                <p className="text-xs text-ink/70">
                  {company.address.oneLine} · {[...company.phones, company.mobile].map((p) => p.display).join(' · ')}
                </p>
              </div>
              <h2 className="font-display text-2xl font-bold text-maroon">Order summary</h2>
              <p className="mt-1 text-sm text-ink/60">
                {order.ref} · {fmtDateTime(order.createdAt)} · <span className="font-semibold text-[#a37b00]">Pending confirmation</span>
              </p>
            </div>
            <div className="text-sm sm:text-right">
              <p className="font-bold">{order.customer.name}</p>
              {order.customer.company && <p className="text-ink/70">{order.customer.company}</p>}
              <p className="text-ink/70">{order.customer.phone}</p>
            </div>
          </header>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-[0.68rem] tracking-wider text-ink/50 uppercase">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-bold">Item</th>
                  <th scope="col" className="px-3 py-2 font-bold">Pack</th>
                  <th scope="col" className="px-3 py-2 text-right font-bold">Boxes</th>
                  <th scope="col" className="px-3 py-2 text-right font-bold">Pkts</th>
                  <th scope="col" className="px-3 py-2 text-right font-bold">CBM</th>
                  <th scope="col" className="py-2 pl-3 text-right font-bold">Kg</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((l) => (
                  <tr key={l.productId} className="border-t border-ink/[0.06]">
                    <td className="py-2 pr-3">
                      <span className="font-semibold">{l.name}</span> <span className="text-ink/60">{l.weight}</span>
                    </td>
                    <td className="px-3 py-2">
                      <PackBadge type={l.packType} />
                    </td>
                    <td className="tabular px-3 py-2 text-right font-bold">{l.boxes}</td>
                    <td className="tabular px-3 py-2 text-right">{fmtInt(l.packets)}</td>
                    <td className="tabular px-3 py-2 text-right">{fmtCbm(l.cbm)}</td>
                    <td className="tabular py-2 pl-3 text-right">{fmtKg(l.kg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TotalsGrid totals={order.totals} tone="dark" className="mt-6" />
        </article>

        <div className="no-print mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <button type="button" onClick={() => window.print()} className="focus-dark inline-flex items-center justify-center gap-2 rounded-full bg-maroon px-6 py-3.5 font-bold text-cream hover:bg-maroon-900">
            <Printer className="size-5" aria-hidden="true" /> Download PDF / print
          </button>
          <a
            href={whatsappLink(whatsappMessage(order))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f9d55] px-6 py-3.5 font-bold text-white hover:bg-[#178a49]"
          >
            <MessageCircle className="size-5" aria-hidden="true" /> Send on WhatsApp
          </a>
          <button type="button" onClick={() => startOrder()} className="focus-dark inline-flex items-center justify-center gap-2 rounded-full bg-turmeric px-6 py-3.5 font-bold text-maroon hover:bg-turmeric-300">
            <ShoppingBasket className="size-5" aria-hidden="true" /> Place another order
          </button>
        </div>
        <p className="no-print mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-maroon/70 hover:text-maroon">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
