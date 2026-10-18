import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface Props {
  onDone: () => void;
}

const LETTERS = 'Freelan'.split('');

/** ~1.2s branded intro. The parent decides whether to show it (first visit only, motion allowed). */
export function Loader({ onDone }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 1250);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center overflow-hidden bg-chilli text-cream"
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      exit={{ clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
      role="status"
      aria-label="Loading Freelan"
    >
      <motion.div
        className="absolute size-[60vmax] rounded-full bg-turmeric/30 blur-3xl"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
      <div className="relative flex overflow-hidden font-display text-7xl font-black tracking-tight sm:text-8xl" aria-hidden="true">
        {LETTERS.map((l, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: '0%' }}
            transition={{ delay: 0.08 + i * 0.05, type: 'spring', stiffness: 300, damping: 26 }}
          >
            {l}
          </motion.span>
        ))}
      </div>
      <div className="relative mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-cream/20">
        <motion.div className="h-full origin-left rounded-full bg-turmeric" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.05, ease: [0.65, 0, 0.35, 1] }} />
      </div>
      <motion.p
        className="relative mt-4 text-xs font-bold uppercase tracking-[0.4em] text-cream/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Grinding fresh
      </motion.p>
    </motion.div>
  );
}
