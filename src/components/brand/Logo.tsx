import { cn } from '../../lib/format';

interface Props {
  className?: string;
  /** Kept for API compatibility; the pennant is always filled red, as in the original logo. */
  tone?: 'light' | 'dark';
  /** Smaller lock-up for tight headers */
  compact?: boolean;
}

/**
 * Matara Freelan wordmark: yellow pennant outline, spaced "MATARA" over a bold yellow "FREELAN".
 * Redrawn as SVG from the brand logo so it stays crisp at any size.
 */
export function Logo({ className, compact }: Props) {
  return (
    <svg
      viewBox="0 0 200 72"
      role="img"
      aria-label="Matara Freelan"
      className={cn('block h-auto shrink-0', compact ? 'w-24' : 'w-36 sm:w-40', className)}
    >
      <path
        d="M3 3 H197 V50 L100 68 L3 50 Z"
        fill="#E2001A"
        stroke="#FFE500"
        strokeWidth="3"
        strokeLinejoin="miter"
      />
      <text
        x="100"
        y="23"
        textAnchor="middle"
        fontFamily="Manrope, ui-sans-serif, system-ui, sans-serif"
        fontWeight="800"
        fontSize="15"
        letterSpacing="12"
        fill="#1a0a0a"
      >
        {/* letter-spacing adds trailing space after the last letter; shift to stay optically centred */}
        <tspan dx="6">MATARA</tspan>
      </text>
      <text
        x="100"
        y="49"
        textAnchor="middle"
        fontFamily="Manrope, ui-sans-serif, system-ui, sans-serif"
        fontWeight="800"
        fontSize="29"
        letterSpacing="1.5"
        fill="#FFE500"
        transform="translate(100 49) scale(1 1.15) translate(-100 -49)"
      >
        FREELAN
      </text>
    </svg>
  );
}
