import { memo, useId } from 'react';
import type { PackType } from '../../lib/types';

export type PackShape = 'pouch' | 'standup' | 'bottle' | 'canister' | 'box' | 'cup';

export function shapeFor(packType: PackType | null, category?: string): PackShape {
  switch (packType) {
    case 'Standup Pouch':
      return 'standup';
    case 'Bottle/Canister':
      return category === 'Canisters' ? 'canister' : 'bottle';
    case 'Box':
      return 'box';
    case 'Cup':
      return 'cup';
    default:
      return 'pouch';
  }
}

export interface PackPalette {
  body: string;
  accent: string;
  ink: string;
}

export const PALETTES: PackPalette[] = [
  { body: '#D90429', accent: '#FFC300', ink: '#FFF8EC' },
  { body: '#FFC300', accent: '#D90429', ink: '#4A0410' },
  { body: '#FFF8EC', accent: '#D90429', ink: '#4A0410' },
  { body: '#4A0410', accent: '#FFC300', ink: '#FFF8EC' },
];

/** Picks a stable palette for a string so the same product always gets the same colours. */
export function paletteFor(seed: string): PackPalette {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTES[Math.abs(h) % PALETTES.length];
}

/** Word-wraps a name into at most `maxLines` lines of ~`width` characters for SVG text. */
function wrap(text: string, width: number, maxLines: number): string[] {
  const words = text.replace(/\s*-\s*/g, ' ').split(' ').filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width && line) {
      lines.push(line);
      line = w;
    } else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/.{0,2}$/, '…');
    return kept;
  }
  return lines;
}

interface Props {
  shape: PackShape;
  name: string;
  sublabel?: string;
  palette?: PackPalette;
  className?: string;
  /** Unprinted pouches render as a clear bag showing the spice inside. */
  unprinted?: boolean;
  title?: string;
}

/** Illustrated SVG pack placeholder. Pure SVG, so it scales and costs nothing to load. */
export const PackIllustration = memo(function PackIllustration({ shape, name, sublabel, palette, className, unprinted, title }: Props) {
  const uid = useId().replace(/:/g, '');
  const p = palette ?? paletteFor(name);
  const body = unprinted ? '#F3E7CF' : p.body;
  const lines = wrap(name, shape === 'cup' ? 10 : 12, shape === 'pouch' ? 2 : 3);
  const shine = `shine-${uid}`;
  const dust = `dust-${uid}`;

  const label = (cx: number, top: number, fill: string, size = 15) => (
    <g fontFamily="Fraunces, Georgia, serif" textAnchor="middle" fill={fill}>
      <text x={cx} y={top} fontSize="9" fontFamily="Manrope, sans-serif" fontWeight="800" letterSpacing="2.4" opacity="0.85">
        FREELAN
      </text>
      {lines.map((l, i) => (
        <text key={i} x={cx} y={top + 20 + i * (size + 2)} fontSize={size} fontWeight="800">
          {l}
        </text>
      ))}
      {sublabel && (
        <text x={cx} y={top + 26 + lines.length * (size + 2)} fontSize="10" fontFamily="Manrope, sans-serif" fontWeight="700" opacity="0.8">
          {sublabel}
        </text>
      )}
    </g>
  );

  return (
    <svg viewBox="0 0 200 260" className={className} role="img" aria-label={title ?? `${name} pack illustration`}>
      <defs>
        <linearGradient id={shine} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.22" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.85" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
        <radialGradient id={dust} cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor="#FFC300" />
          <stop offset="1" stopColor="#E07A00" />
        </radialGradient>
      </defs>

      {/* soft floor shadow */}
      <ellipse cx="100" cy="246" rx="66" ry="8" fill="#000" opacity="0.18" />

      {shape === 'pouch' && (
        <g>
          <path
            d="M38 22 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l4 -4 V232 l-4 4 l-6 -6 l-6 6 l-6 -6 l-6 6 l-6 -6 l-6 6 l-6 -6 l-6 6 l-6 -6 l-6 6 l-6 -6 l-6 6 l-6 -6 l-6 6 l-6 -6 l-6 6 l-6 -6 l-6 6 l-4 -4 Z"
            fill={body}
          />
          {unprinted ? (
            <>
              <rect x="50" y="134" width="100" height="90" rx="6" fill={`url(#${dust})`} opacity="0.9" />
              <rect x="54" y="48" width="92" height="76" rx="8" fill="#fff" opacity="0.92" />
              {label(100, 62, '#4A0410', 12)}
            </>
          ) : (
            <>
              <rect x="38" y="40" width="124" height="10" fill={p.accent} />
              <circle cx="100" cy="172" r="38" fill={p.accent} opacity="0.95" />
              <circle cx="100" cy="172" r="31" fill={`url(#${dust})`} />
              <rect x="38" y="216" width="124" height="8" fill={p.accent} />
              {label(100, 64, p.ink, 15)}
            </>
          )}
          <rect x="38" y="22" width="124" height="210" fill={`url(#${shine})`} />
        </g>
      )}

      {shape === 'standup' && (
        <g>
          <path d="M44 20 H156 Q160 20 160 24 V214 Q160 238 132 240 H68 Q40 238 40 214 V24 Q40 20 44 20 Z" fill={body} />
          <rect x="40" y="34" width="120" height="4" fill="#000" opacity="0.15" />
          <circle cx="52" cy="28" r="3" fill="#000" opacity="0.2" />
          <rect x="62" y="146" width="76" height="62" rx="31" fill={p.accent} />
          <rect x="69" y="153" width="62" height="48" rx="24" fill={`url(#${dust})`} />
          {label(100, 62, p.ink, 14)}
          <path d="M40 214 Q100 226 160 214" stroke="#000" strokeOpacity="0.15" fill="none" strokeWidth="2" />
          <rect x="40" y="20" width="120" height="220" fill={`url(#${shine})`} />
        </g>
      )}

      {shape === 'bottle' && (
        <g>
          <rect x="74" y="14" width="52" height="30" rx="6" fill={p.accent} />
          <rect x="74" y="34" width="52" height="4" fill="#000" opacity="0.15" />
          <path d="M80 44 H120 V58 Q152 66 152 96 V224 Q152 238 138 238 H62 Q48 238 48 224 V96 Q48 66 80 58 Z" fill={body} />
          <rect x="54" y="104" width="92" height="102" rx="10" fill={p.ink} opacity={p.ink === '#FFF8EC' ? 0.96 : 0.12} />
          {label(100, 124, p.ink === '#FFF8EC' ? '#4A0410' : p.ink, 13)}
          <path d="M80 44 H120 V58 Q152 66 152 96 V224 Q152 238 138 238 H62 Q48 238 48 224 V96 Q48 66 80 58 Z" fill={`url(#${shine})`} />
        </g>
      )}

      {shape === 'canister' && (
        <g>
          <rect x="44" y="40" width="112" height="196" rx="8" fill={body} />
          <ellipse cx="100" cy="236" rx="56" ry="8" fill={body} />
          <rect x="40" y="22" width="120" height="30" rx="8" fill={p.accent} />
          <ellipse cx="100" cy="22" rx="60" ry="9" fill={p.accent} />
          <ellipse cx="100" cy="22" rx="52" ry="6" fill="#000" opacity="0.12" />
          <rect x="44" y="190" width="112" height="14" fill={p.accent} />
          {label(100, 90, p.ink, 15)}
          <rect x="44" y="40" width="112" height="196" fill={`url(#${shine})`} />
        </g>
      )}

      {shape === 'box' && (
        <g>
          <path d="M40 60 L120 40 L164 56 L84 78 Z" fill={p.accent} />
          <path d="M84 78 L164 56 V214 L84 238 Z" fill={body} opacity="0.75" />
          <path d="M40 60 L84 78 V238 L40 218 Z" fill="#000" opacity="0.12" />
          <path d="M40 60 L84 78 V238 L40 218 Z" fill={body} opacity="0.9" />
          <g transform="matrix(1 -0.275 0 1 0 0)">
            <g transform="translate(-2 46)">{label(124, 104, p.ink, 12)}</g>
          </g>
          <path d="M84 78 L164 56 V214 L84 238 Z" fill={`url(#${shine})`} />
        </g>
      )}

      {shape === 'cup' && (
        <g>
          <ellipse cx="100" cy="46" rx="66" ry="12" fill={p.accent} />
          <path d="M34 50 H166 L150 230 Q100 246 50 230 Z" fill={body} />
          <ellipse cx="100" cy="50" rx="66" ry="10" fill="#000" opacity="0.12" />
          <path d="M45 172 H155 L152 204 H48 Z" fill={p.accent} />
          {label(100, 82, p.ink, 14)}
          <path d="M34 50 H166 L150 230 Q100 246 50 230 Z" fill={`url(#${shine})`} />
        </g>
      )}
    </svg>
  );
});
