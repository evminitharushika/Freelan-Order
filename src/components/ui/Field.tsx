import type { LucideIcon } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { cn } from '../../lib/format';

interface Props {
  label: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  required?: boolean;
  /** Render prop receives the input id and aria-describedby value. */
  children: (id: string, describedBy: string | undefined) => ReactNode;
  trailing?: ReactNode;
  className?: string;
}

/** Label + input shell + error message, wired for screen readers. Style applies to the child input. */
export function Field({ label, error, hint, icon: Icon, required, children, trailing, className }: Props) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-semibold text-ink/85">
        <span>
          {label}
          {required && (
            <span aria-hidden="true" className="text-chilli">
              {' '}
              *
            </span>
          )}
        </span>
        {hint && <span className="text-xs font-medium text-ink/50">{hint}</span>}
      </label>
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border-2 bg-white px-3.5 transition focus-within:border-chilli focus-within:ring-4 focus-within:ring-chilli/10',
          error ? 'border-chilli/70' : 'border-ink/10',
          '[&_input]:focus-visible:outline-none [&_input]:h-12 [&_input]:w-full [&_input]:min-w-0 [&_input]:bg-transparent [&_input]:text-base [&_input]:outline-none [&_input]:placeholder:text-ink/35',
        )}
      >
        {Icon && <Icon className="size-4.5 shrink-0 text-ink/40" aria-hidden="true" />}
        {children(id, error ? msgId : undefined)}
        {trailing}
      </div>
      {error && (
        <p id={msgId} className="mt-1.5 text-sm font-medium text-chilli" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
