import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/format';

interface Props {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  /** How far the button follows the cursor (0..1) */
  strength?: number;
  variant?: 'turmeric' | 'chilli';
  size?: 'md' | 'lg';
  ariaLabel?: string;
}

/** Big CTA that leans toward the cursor, with a shine sweep and a pulsing ring. */
export function MagneticButton({ children, onClick, className, strength = 0.35, variant = 'turmeric', size = 'lg', ariaLabel }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduce = usePrefersReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.6 });

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const tone =
    variant === 'turmeric'
      ? 'bg-turmeric text-maroon shadow-[0_18px_40px_-12px_rgba(255,195,0,0.65)] hover:bg-turmeric-300'
      : 'bg-chilli text-cream shadow-[0_18px_40px_-12px_rgba(217,4,41,0.6)] hover:bg-chilli-600';

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      aria-label={ariaLabel}
      className={cn(
        'group relative isolate inline-flex items-center justify-center gap-3 rounded-full font-extrabold uppercase tracking-[0.14em] transition-colors',
        size === 'lg' ? 'px-9 py-5 text-base sm:px-11 sm:py-6 sm:text-lg' : 'px-7 py-4 text-sm',
        variant === 'chilli' && 'focus-dark',
        tone,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('absolute inset-0 -z-10 rounded-full animate-pulse-ring', variant === 'turmeric' ? 'bg-turmeric' : 'bg-chilli')} />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shine" />
      </span>
      <span className="relative flex items-center gap-3">{children}</span>
    </motion.button>
  );
}
