import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { CATEGORIES, dominantPack, featuredFor, type CategoryMeta } from '../../data/catalog';
import { useMediaQuery, usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { useOrderStart } from '../../hooks/useOrderStart';
import { cn } from '../../lib/format';
import { ScrollTrigger, gsap, scrollToTarget } from '../../lib/scroll';
import { shapeFor, type PackPalette } from '../product/PackIllustration';
import { ProductImage, categoryImage, itemImage } from '../product/ProductImage';

const N = CATEGORIES.length;

const BRAND = ['#D90429', '#FFC300', '#FFF8EC', '#4A0410'];
const LIGHT = new Set(['#FFC300', '#FFF8EC']);

/** Pack colours that stand out from both the panel background and the accent disc behind the pack. */
function packPaletteFor(c: CategoryMeta): PackPalette {
  const taken = new Set([c.bg.toUpperCase(), c.accent.toUpperCase()]);
  const body = BRAND.find((b) => !taken.has(b)) ?? '#D90429';
  const accent = LIGHT.has(body) ? '#D90429' : '#FFC300';
  return { body, accent, ink: LIGHT.has(body) ? '#4A0410' : '#FFF8EC' };
}

/** Precomputed per-category data so scrolling never recomputes. */
const PANELS = CATEGORIES.map((c) => ({
  meta: c,
  featured: featuredFor(c.name, 6),
  shape: shapeFor(dominantPack(c.name), c.name),
  palette: packPaletteFor(c),
}));

const pad = (n: number) => String(n).padStart(2, '0');

function SeeAll({ meta, className }: { meta: CategoryMeta; className?: string }) {
  const { startOrder } = useOrderStart();
  return (
    <button
      type="button"
      onClick={() => startOrder(`/order?category=${meta.slug}`)}
      className={cn('group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-extrabold uppercase tracking-wider transition active:scale-95', className)}
      style={{ background: meta.fg, color: meta.bg === '#FFF8EC' ? '#FFC300' : meta.bg }}
    >
      See all {meta.count} & order
      <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
    </button>
  );
}

function ItemCards({ panel, limit, play = true }: { panel: (typeof PANELS)[number]; limit: number; play?: boolean }) {
  const { meta } = panel;
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {panel.featured.slice(0, limit).map((f, i) => (
        <motion.li
          key={f.slug}
          initial={{ opacity: 0, y: 18 }}
          animate={play ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.25 + i * 0.06, type: 'spring', stiffness: 260, damping: 26 }}
          className="flex items-center gap-3 rounded-2xl p-2.5 pr-3 backdrop-blur-sm"
          style={{ background: `color-mix(in srgb, ${meta.fg} 12%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${meta.fg} 18%, transparent)` }}
        >
          <ProductImage
            sources={[itemImage(f.slug)]}
            alt={f.name}
            shape={panel.shape}
            name={f.name}
            palette={panel.palette}
            className="h-12 w-10 shrink-0"
          />
          <div className="min-w-0">
            <p className="truncate text-sm leading-tight font-bold" title={f.name}>
              {f.name}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium opacity-75">{f.sizes.join(' · ')}</p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ desktop: pinned, scroll-driven */

function PinnedShowcase() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const [dir, setDir] = useState(1);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ctx = gsap.context(() => {
      const setArtY = gsap.quickTo(artRef.current, 'y', { duration: 0.5, ease: 'power3.out' });
      const setGhostX = gsap.quickTo(ghostRef.current, 'xPercent', { duration: 0.6, ease: 'power3.out' });
      triggerRef.current = ScrollTrigger.create({
        trigger: wrap,
        start: 'top top',
        end: () => `+=${window.innerHeight * (N - 1) * 0.85}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        snap: { snapTo: 1 / (N - 1), duration: { min: 0.2, max: 0.55 }, delay: 0.08, ease: 'power2.inOut' },
        onUpdate: (self) => {
          const pos = self.progress * (N - 1);
          const idx = Math.round(pos);
          if (idx !== activeRef.current) {
            setDir(idx > activeRef.current ? 1 : -1);
            activeRef.current = idx;
            setActive(idx);
          }
          const local = pos - idx; // -0.5..0.5 within a step
          setArtY(local * -90);
          setGhostX(-self.progress * 30);
        },
      });
    }, wrap);
    return () => {
      ctx.revert();
      triggerRef.current = null;
    };
  }, []);

  const jump = (i: number) => {
    const st = triggerRef.current;
    if (!st) return;
    scrollToTarget(st.start + ((st.end - st.start) * i) / (N - 1) + 2);
  };

  const panel = PANELS[active];
  const { meta } = panel;

  return (
    <div ref={wrapRef} className="relative h-[100svh] overflow-hidden transition-colors duration-700 ease-out" style={{ background: meta.bg, color: meta.fg }}>
      <div className="grain absolute inset-0" aria-hidden="true" />

      {/* Ghost typography */}
      <div ref={ghostRef} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 whitespace-nowrap will-change-transform">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={meta.slug}
            initial={{ opacity: 0, y: 60 * dir }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 * dir }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="block font-display text-[26vw] leading-none font-black tracking-tighter uppercase"
            style={{ color: 'transparent', WebkitTextStroke: `2px color-mix(in srgb, ${meta.fg} 16%, transparent)` }}
          >
            {meta.short}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="relative mx-auto grid h-full max-w-7xl grid-cols-12 items-center gap-6 px-8 pt-20 pb-10">
        {/* Copy + cards */}
        <div className="col-span-5 self-center">
          <div className="mb-4 flex items-center gap-3 text-xs font-extrabold tracking-[0.3em] uppercase">
            <span className="tabular" style={{ color: meta.accent }}>
              {pad(active + 1)} / {pad(N)}
            </span>
            <span className="h-px w-10 opacity-40" style={{ background: meta.fg }} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={meta.slug} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 0.8, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.3 }}>
                {meta.tagline}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="relative h-[clamp(4.2rem,7.4vw,7rem)] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.h3
                key={meta.slug}
                custom={dir}
                initial={{ y: `${105 * dir}%` }}
                animate={{ y: '0%' }}
                exit={{ y: `${-105 * dir}%` }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-x-0 top-0 font-display text-[clamp(3.4rem,6.4vw,6rem)] leading-[1] font-black tracking-tight whitespace-nowrap"
              >
                {meta.name === 'Appertizers' ? 'Appetizers' : meta.name}
              </motion.h3>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={meta.slug} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
              <p className="mt-3 max-w-md text-base leading-relaxed opacity-85 xl:text-lg">{meta.description}</p>
              <div className="mt-6 max-w-lg">
                <ItemCards panel={panel} limit={6} />
              </div>
              <SeeAll meta={meta} className="mt-6" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hero art */}
        <div className="col-span-6 col-start-6 flex h-full items-center justify-center">
          <div ref={artRef} className="relative aspect-square w-full max-w-[min(42vw,62vh)] will-change-transform">
            <motion.div
              className="absolute inset-[10%] rounded-full"
              animate={{ background: meta.accent, opacity: 0.95 }}
              transition={{ duration: 0.7 }}
              style={{ boxShadow: '0 40px 90px -30px rgba(0,0,0,0.45)' }}
            />
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.div
                key={meta.slug}
                initial={{ opacity: 0, y: 160 * dir, scale: 0.7, rotate: -10 * dir }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, y: -160 * dir, scale: 0.8, rotate: 8 * dir }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="absolute inset-[4%] flex items-center justify-center"
              >
                <ProductImage
                  sources={[categoryImage(meta.slug)]}
                  alt={`${meta.name} by Freelan`}
                  shape={panel.shape}
                  name={meta.name === 'Appertizers' ? 'Appetizers' : meta.name}
                  sublabel={`${meta.count} products`}
                  palette={panel.palette}
                  priority={active === 0}
                  className="size-[86%] drop-shadow-[0_40px_50px_rgba(0,0,0,0.35)]"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress rail */}
        <nav aria-label="Product categories" className="col-span-1 flex h-full flex-col justify-center">
          <ol className="relative ml-auto flex flex-col gap-1.5 border-r-2 pr-0" style={{ borderColor: `color-mix(in srgb, ${meta.fg} 20%, transparent)` }}>
            {CATEGORIES.map((c, i) => (
              <li key={c.slug} className="relative">
                <button
                  type="button"
                  onClick={() => jump(i)}
                  aria-current={i === active ? 'step' : undefined}
                  className={cn('block py-0.5 pr-4 text-right text-[0.7rem] font-bold tracking-wider uppercase transition-all', i === active ? 'opacity-100' : 'opacity-45 hover:opacity-80')}
                >
                  {c.short}
                </button>
                {i === active && (
                  <motion.span layoutId="rail-dot" className="absolute top-1/2 -right-[7px] size-3 -translate-y-1/2 rounded-full" style={{ background: meta.accent }} />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ mobile: stacked sticky panels */

function StackedShowcase() {
  const listRef = useRef<HTMLDivElement>(null);

  // A panel taller than the screen sticks only once its bottom is reached, so its CTA is never covered.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const panels = Array.from(list.children) as HTMLElement[];
    const update = () => {
      for (const el of panels) el.style.top = `${Math.min(0, window.innerHeight - el.offsetHeight)}px`;
    };
    update();
    const ro = new ResizeObserver(update);
    panels.forEach((el) => ro.observe(el));
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div ref={listRef}>
      {PANELS.map((panel, i) => {
        const { meta } = panel;
        return (
          <article
            key={meta.slug}
            className="sticky flex min-h-[100svh] flex-col justify-center overflow-hidden rounded-t-[2rem] px-5 pt-20 pb-10 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.45)] first:rounded-none"
            style={{ background: meta.bg, color: meta.fg, zIndex: i + 1 }}
            aria-labelledby={`cat-${meta.slug}`}
          >
            <div className="grain absolute inset-0" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 top-16 font-display text-[34vw] leading-none font-black uppercase"
              style={{ color: 'transparent', WebkitTextStroke: `1.5px color-mix(in srgb, ${meta.fg} 16%, transparent)` }}
            >
              {pad(i + 1)}
            </span>
            <motion.div initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.35 }} className="relative">
              <motion.p
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                className="text-xs font-extrabold tracking-[0.28em] uppercase"
                style={{ color: meta.accent }}
              >
                {pad(i + 1)} / {pad(N)} · {meta.tagline}
              </motion.p>
              <div className="overflow-hidden">
                <motion.h3
                  id={`cat-${meta.slug}`}
                  variants={{ hidden: { y: '100%' }, show: { y: '0%', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}
                  className="mt-2 font-display text-[2.9rem] leading-[1.02] font-black tracking-tight"
                >
                  {meta.name === 'Appertizers' ? 'Appetizers' : meta.name}
                </motion.h3>
              </div>
              <motion.div
                variants={{ hidden: { opacity: 0, scale: 0.8, y: 40, rotate: -6 }, show: { opacity: 1, scale: 1, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } } }}
                className="relative mx-auto my-5 aspect-square w-[62vw] max-w-[300px]"
              >
                <div className="absolute inset-[8%] rounded-full" style={{ background: meta.accent }} />
                <ProductImage
                  sources={[categoryImage(meta.slug)]}
                  alt={`${meta.name} by Freelan`}
                  shape={panel.shape}
                  name={meta.name === 'Appertizers' ? 'Appetizers' : meta.name}
                  sublabel={`${meta.count} products`}
                  palette={panel.palette}
                  className="absolute inset-[6%] drop-shadow-[0_24px_30px_rgba(0,0,0,0.35)]"
                />
              </motion.div>
              <motion.p variants={{ hidden: { opacity: 0 }, show: { opacity: 0.85 } }} className="text-[0.95rem] leading-relaxed">
                {meta.description}
              </motion.p>
              <div className="mt-4">
                <ItemCards panel={panel} limit={4} />
              </div>
              <SeeAll meta={meta} className="mt-5 w-full justify-center" />
            </motion.div>
          </article>
        );
      })}
    </div>
  );
}

export function ProductShowcase() {
  const desktop = useMediaQuery('(min-width: 1024px) and (min-height: 620px)');
  const reduce = usePrefersReducedMotion();

  return (
    <section id="products" aria-labelledby="products-heading" className="relative">
      <h2 id="products-heading" className="sr-only">
        Our products
      </h2>
      {desktop && !reduce ? <PinnedShowcase /> : <StackedShowcase />}
    </section>
  );
}
