import { motion, type Variants } from 'framer-motion';
import { cn } from '../../lib/format';

interface Props {
  text: string;
  by?: 'word' | 'letter';
  className?: string;
  /** Applied to each word wrapper (e.g. to highlight a word). Receives the word and its index. */
  wordClassName?: (word: string, index: number) => string | undefined;
  delay?: number;
  stagger?: number;
  play?: boolean;
  as?: 'h1' | 'h2' | 'p' | 'span';
}

const child: Variants = {
  hidden: { y: '110%', rotate: 6, opacity: 0 },
  show: { y: '0%', rotate: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

/** Masked split-text reveal. The full string is exposed to assistive tech once via aria-label. */
export function SplitText({ text, by = 'word', className, wordClassName, delay = 0, stagger, play = true, as = 'span' }: Props) {
  const Tag = motion[as];
  const words = text.split(' ');
  const container: Variants = {
    hidden: {},
    show: { transition: { delayChildren: delay, staggerChildren: stagger ?? (by === 'letter' ? 0.045 : 0.08) } },
  };

  return (
    <Tag className={className} aria-label={text} initial="hidden" animate={play ? 'show' : 'hidden'} variants={container}>
      {words.map((word, wi) => (
        <span key={wi} aria-hidden="true" className={cn('inline-block whitespace-nowrap', wordClassName?.(word, wi))}>
          {by === 'letter' ? (
            word.split('').map((ch, ci) => (
              <span key={ci} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span className="inline-block will-change-transform" variants={child}>
                  {ch}
                </motion.span>
              </span>
            ))
          ) : (
            <span className="inline-block overflow-hidden pb-[0.1em] align-bottom">
              <motion.span className="inline-block will-change-transform" variants={child}>
                {word}
              </motion.span>
            </span>
          )}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </Tag>
  );
}
