import { CircleCheck, CircleX, Clock } from 'lucide-react';
import type { OrderStatus } from '../../lib/types';
import { cn } from '../../lib/format';

const STYLE: Record<OrderStatus, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', cls: 'bg-turmeric/25 text-[#7a5a00] ring-turmeric-600/40', icon: Clock },
  approved: { label: 'Approved', cls: 'bg-leaf/12 text-leaf ring-leaf/30', icon: CircleCheck },
  rejected: { label: 'Rejected', cls: 'bg-chilli/10 text-chilli-700 ring-chilli/30', icon: CircleX },
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const s = STYLE[status];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset', s.cls, className)}>
      <s.icon className="size-3.5" aria-hidden="true" />
      {s.label}
    </span>
  );
}
