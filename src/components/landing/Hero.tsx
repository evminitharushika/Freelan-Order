import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { ArrowDown, ArrowRight, Leaf } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { STATS } from '../../data/catalog';
import { useOrderStart } from '../../hooks/useOrderStart';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { scrollToTarget } from '../../lib/scroll';
import { PackIllustration } from '../product/PackIllustration';
import { MagneticButton } from './MagneticButton';
import { SpiceField } from './SpiceField';
import { SplitText } from './SplitText';

interface Props {
  /** Becomes true once the intro loader has left, so the reveal is seen. */
  ready: boolean;
}

function Float({ mx, my, depth, className, children, delay = 0, play }: { mx: MotionValue<number>; my: MotionValue<number>; depth: number; className?: string; children: ReactNode; delay?: number; play: boolean }) {
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform(my, (v) => v * depth);
  return (
    <motion.div style={{ x, y }} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={play ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{ delay, type: 'spring', stiffness: 120, damping: 18 }}
        className="size-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

const BADGE_TEXT = 'PURE · SRI LANKAN · SPICES · PACKED FRESH · ';

export function Hero({ ready }: Props) {
  const { startOrder } = useOrderStart();
  const reduce = usePrefersReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      rawX.set(Math.max(-1, Math.min(1, e.gamma / 30)));
      rawY.set(Math.max(-1, Math.min(1, (e.beta - 45) / 30)));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('deviceorientation', onTilt, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('deviceorientation', onTilt);
    };
  }, [reduce, rawX, rawY]);

  const glowX = useTransform(mx, (v) => v * -30);
  const glowY = useTransform(my, (v) => v * -20);

  return (
    <section id="top" className="grain relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-chilli text-cream" aria-labelledby="hero-title">
      {/* Layered background: deep edges, saffron heat, turmeric glow */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[radial-gradient(120%_90%_at_20%_10%,#e8173a_0%,#d90429_38%,#9a021c_75%,#4a0410_100%)]" />
      <motion.div
        aria-hidden="true"
        style={{ x: glowX, y: glowY }}
        className="absolute -right-[20vw] top-[8vh] -z-10 size-[80vw] max-w-[1100px] rounded-full bg-[radial-gradient(circle,rgba(255,195,0,0.55)_0%,rgba(255,138,0,0.25)_38%,transparent_68%)] blur-2xl lg:-right-[8vw] lg:size-[62vw]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-maroon/70 to-transparent" />
      <SpiceField className="absolute inset-0 -z-10 size-full" />

      <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-6 px-4 pt-28 pb-24 sm:px-6 lg:grid-cols-12 lg:gap-4 lg:px-8 lg:pt-24">
        <div className="relative lg:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.05 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-cream/25 bg-maroon/25 px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-turmeric backdrop-blur-sm sm:text-xs"
          >
            <Leaf className="size-3.5" aria-hidden="true" /> Spices & food products<span className="hidden sm:inline"> · Sri Lanka</span>
          </motion.p>

          <h1 id="hero-title" className="font-display">
            <SplitText
              text="Freelan"
              by="letter"
              play={ready}
              delay={0.1}
              className="block text-[clamp(4.6rem,19vw,12.5rem)] leading-[0.82] font-black tracking-[-0.045em] text-turmeric drop-shadow-[0_10px_30px_rgba(74,4,16,0.35)]"
            />
            <SplitText
              text="Pure Sri Lankan flavour, packed fresh."
              by="word"
              play={ready}
              delay={0.45}
              className="mt-4 block max-w-[15ch] text-[clamp(2rem,5.6vw,4.1rem)] leading-[1.02] font-semibold tracking-tight text-cream italic"
              wordClassName={(w) => (w.startsWith('flavour') ? 'scribble' : undefined)}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="mt-6 max-w-md text-base leading-relaxed text-cream/80 sm:text-lg"
          >
            {STATS.products} lines of spices, curry blends, flours, soya and more, ordered by the box for shops, hotels and resellers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 1.15, duration: 0.6 }}
            className="mt-9 flex flex-wrap items-center gap-4 sm:gap-6"
          >
            <MagneticButton onClick={() => startOrder()}>
              Order now <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </MagneticButton>
            <button
              type="button"
              onClick={() => scrollToTarget('products')}
              className="group inline-flex items-center gap-2 rounded-full border-2 border-cream/35 px-6 py-4 font-bold text-cream transition hover:border-cream hover:bg-cream/10"
            >
              View products
              <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
            </button>
          </motion.div>
        </div>

        {/* Product art cluster */}
        <div className="relative mx-auto aspect-square w-full max-w-[min(88vw,520px)] lg:col-span-5 lg:max-w-none" aria-hidden="true">
          <motion.div
            className="absolute inset-[6%] rounded-full border-2 border-dashed border-turmeric/35"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-[16%] rounded-full bg-turmeric/95 shadow-[inset_0_-30px_60px_rgba(224,122,0,0.55),0_40px_80px_-30px_rgba(74,4,16,0.8)]" />
          <Float mx={mx} my={my} depth={10} play={ready} delay={0.55} className="absolute top-[18%] left-[2%] w-[34%] -rotate-12">
            <PackIllustration shape="canister" name="Curry Powder" sublabel="200g" palette={{ body: '#4A0410', accent: '#FFC300', ink: '#FFF8EC' }} className="size-full drop-shadow-2xl" />
          </Float>
          <Float mx={mx} my={my} depth={22} play={ready} delay={0.7} className="absolute top-[12%] left-[27%] w-[46%]">
            <PackIllustration shape="pouch" name="Turmeric Powder" sublabel="100g" palette={{ body: '#D90429', accent: '#FFC300', ink: '#FFF8EC' }} className="size-full drop-shadow-[0_30px_40px_rgba(74,4,16,0.55)]" />
          </Float>
          <Float mx={mx} my={my} depth={14} play={ready} delay={0.85} className="absolute top-[30%] right-[1%] w-[30%] rotate-[10deg]">
            <PackIllustration shape="bottle" name="Chilli Crush" sublabel="40g" palette={{ body: '#FFF8EC', accent: '#D90429', ink: '#4A0410' }} className="size-full drop-shadow-2xl" />
          </Float>

          {/* Rotating stamp */}
          <motion.div
            className="absolute right-[4%] bottom-[2%] size-[30%] min-w-24"
            animate={reduce ? undefined : { rotate: -360 }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          >
            <svg viewBox="0 0 120 120" className="size-full">
              <defs>
                <path id="badge-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
              </defs>
              <circle cx="60" cy="60" r="58" fill="#4A0410" />
              <text fontSize="10.4" fontWeight="800" letterSpacing="2.2" fill="#FFC300" fontFamily="Manrope, sans-serif">
                <textPath href="#badge-circle">{BADGE_TEXT}</textPath>
              </text>
              <text x="60" y="70" textAnchor="middle" fontSize="30" fontFamily="Fraunces, serif" fontWeight="900" fill="#FFF8EC">
                F
              </text>
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        type="button"
        onClick={() => scrollToTarget('products')}
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : undefined}
        transition={{ delay: 1.6 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.35em] text-cream/70 hover:text-cream sm:flex"
        aria-label="Scroll to products"
      >
        Scroll
        <span className="flex h-11 w-6 justify-center rounded-full border-2 border-cream/40 pt-2">
          <span className="block h-2.5 w-1 rounded-full bg-turmeric animate-bob" />
        </span>
      </motion.button>
    </section>
  );
}
