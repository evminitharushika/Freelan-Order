import { animate, motion, useInView } from 'framer-motion';
import { Boxes, Globe, PackageCheck, Truck, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { company } from '../../config/company';
import { PRODUCTS, STATS } from '../../data/catalog';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = usePrefersReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return (
    <span ref={ref} className="tabular">
      {value}
      {suffix}
    </span>
  );
}

interface Item {
  icon: LucideIcon;
  value?: { to: number; suffix?: string };
  title: string;
  body: string;
  placeholder?: boolean;
}

const ITEMS: Item[] = [
  { icon: PackageCheck, value: { to: STATS.products, suffix: '+' }, title: 'Products', body: `Across ${STATS.categories} categories and ${STATS.packFormats} pack formats.` },
  { icon: Boxes, value: { to: STATS.bulkItems }, title: 'Wholesale & bulk lines', body: 'Ordered by the box, with 1 kg to 5 kg bulk packs.' },
  ...(company.claims.islandWide.show ? [{ icon: Truck, title: company.claims.islandWide.title, body: company.claims.islandWide.body, placeholder: true }] : []),
  ...(company.claims.exportQuality.show ? [{ icon: Globe, title: company.claims.exportQuality.title, body: company.claims.exportQuality.body, placeholder: true }] : []),
];

const MARQUEE = Array.from(new Set(PRODUCTS.map((p) => p.name.replace(/\s*-\s*(Bottle|Canisters)$/i, '')))).slice(0, 28);

export function TrustStrip() {
  return (
    <section aria-labelledby="why-heading" className="relative z-20 bg-cream text-maroon">
      {/* Spice-market ticker */}
      <div className="relative -rotate-1 overflow-hidden border-y-4 border-maroon bg-turmeric py-3" aria-hidden="true">
        <div className="flex w-max animate-[marquee_60s_linear_infinite] gap-8 whitespace-nowrap font-display text-2xl font-black italic sm:text-3xl">
          {[...MARQUEE, ...MARQUEE].map((n, i) => (
            <span key={i} className="flex items-center gap-8">
              {n}
              <span className="text-chilli">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs font-extrabold tracking-[0.3em] text-chilli uppercase">Why Freelan</p>
            <h2 id="why-heading" className="mt-3 font-display text-4xl leading-[1.02] font-black tracking-tight sm:text-5xl">
              From the island's spice gardens to your <span className="scribble">shelves</span>.
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {ITEMS.map((item, i) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 160, damping: 22 }}
                className="group relative overflow-hidden rounded-3xl border-2 border-maroon/10 bg-white p-6 transition-colors hover:border-chilli/40 sm:p-7"
              >
                <div className="absolute -top-10 -right-10 size-32 rounded-full bg-turmeric/25 transition-transform duration-500 group-hover:scale-150" aria-hidden="true" />
                <item.icon className="relative size-8 text-chilli" aria-hidden="true" />
                <p className={`relative mt-5 font-display font-black tracking-tight ${item.value ? 'text-5xl' : 'text-3xl leading-tight sm:text-4xl'}`}>
                  {item.value ? <Counter to={item.value.to} suffix={item.value.suffix} /> : item.title}
                </p>
                {item.value && <p className="relative mt-1 text-lg font-bold">{item.title}</p>}
                <p className="relative mt-2 text-sm leading-relaxed text-maroon/70">{item.body}</p>
                {item.placeholder && (
                  <span className="relative mt-3 inline-block rounded-full bg-turmeric/30 px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wider text-maroon uppercase">
                    Editable placeholder
                  </span>
                )}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
