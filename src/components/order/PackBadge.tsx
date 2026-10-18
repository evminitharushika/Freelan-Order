import type { PackType } from '../../lib/types';
import { cn } from '../../lib/format';

const STYLES: Record<PackType, string> = {
  'Printed Pouch': 'bg-chilli/10 text-chilli-700 ring-chilli/25',
  'Unprinted Pouch': 'bg-white text-ink/70 ring-ink/20 border-dashed',
  'Standup Pouch': 'bg-turmeric/25 text-maroon ring-turmeric-600/40',
  'Bottle/Canister': 'bg-maroon/10 text-maroon ring-maroon/25',
  Box: 'bg-leaf/10 text-leaf ring-leaf/30',
  Cup: 'bg-saffron/15 text-[#a35400] ring-saffron/40',
};

export function PackBadge({ type, className }: { type: PackType | null; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold whitespace-nowrap ring-1 ring-inset',
        type ? STYLES[type] : 'bg-ink/5 text-ink/50 ring-ink/15',
        className,
      )}
    >
      {type ?? 'Pack TBC'}
    </span>
  );
}
