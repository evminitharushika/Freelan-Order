import { Minus, Plus } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { cn } from '../../lib/format';

interface Props {
  value: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
  max?: number;
  size?: 'sm' | 'md';
}

/** −/+ stepper with a typed numeric input. Never goes below 0. */
export const QuantityStepper = memo(function QuantityStepper({ value, onChange, label, disabled, max = 9999, size = 'md' }: Props) {
  const [text, setText] = useState(String(value || ''));

  useEffect(() => {
    setText(value ? String(value) : '');
  }, [value]);

  const commit = (raw: string) => {
    const n = Math.min(max, Math.max(0, Math.floor(Number(raw.replace(/\D/g, '')) || 0)));
    onChange(n);
    setText(n ? String(n) : '');
  };

  const btn = cn(
    'grid shrink-0 place-items-center rounded-full transition focus-dark disabled:cursor-not-allowed disabled:opacity-30',
    size === 'sm' ? 'size-8' : 'size-9',
  );

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full p-1 ring-1 ring-inset transition focus-within:ring-2 focus-within:ring-chilli',
        value > 0 ? 'bg-turmeric/30 ring-turmeric-600/50' : 'bg-white ring-ink/15',
        disabled && 'opacity-50',
      )}
      role="group"
      aria-label={label}
    >
      <button type="button" className={cn(btn, 'text-ink/70 hover:bg-ink/10')} onClick={() => onChange(Math.max(0, value - 1))} disabled={disabled || value <= 0} aria-label={`Remove one box: ${label}`}>
        <Minus className="size-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={text}
        placeholder="0"
        disabled={disabled}
        aria-label={`Boxes: ${label}`}
        onChange={(e) => setText(e.target.value.replace(/\D/g, '').slice(0, 4))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit(e.currentTarget.value);
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(Math.min(max, value + 1));
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(Math.max(0, value - 1));
          }
        }}
        onFocus={(e) => e.currentTarget.select()}
        className={cn('tabular w-11 bg-transparent text-center font-bold text-ink outline-none placeholder:text-ink/30 focus-visible:outline-none', size === 'sm' ? 'text-sm' : 'text-base')}
      />
      <button type="button" className={cn(btn, 'bg-chilli text-cream hover:bg-chilli-600')} onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label={`Add one box: ${label}`}>
        <Plus className="size-4" />
      </button>
    </div>
  );
});
