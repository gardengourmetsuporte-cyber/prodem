import { forwardRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Customer } from '@/types/customer';
import { SEGMENT_CONFIG } from '@/types/customer';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
}

export const CustomerCard = forwardRef<HTMLDivElement, Props>(function CustomerCard({ customer, onEdit, onDelete }, ref) {
  const seg = SEGMENT_CONFIG[customer.segment] || SEGMENT_CONFIG.new;
  const daysSince = customer.last_purchase_at
    ? differenceInDays(new Date(), new Date(customer.last_purchase_at))
    : null;

  return (
    <div
      ref={ref}
      className="rounded-xl border border-border/30 bg-card/60 p-4 space-y-3 hover:border-primary/25 active:scale-[0.98] transition-all duration-200 cursor-pointer"
      onClick={onEdit}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm truncate text-foreground">{customer.name}</p>
            <span className={cn(
              'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap',
              seg.bg, seg.color
            )}>
              <span className="material-symbols-rounded" style={{ fontSize: 12 }}>{seg.icon}</span>
              {seg.label}
            </span>
          </div>
          {customer.phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <span className="material-symbols-rounded" style={{ fontSize: 13 }}>call</span>
              {customer.phone}
            </p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 -m-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span>
        </button>
      </div>

      {/* Score bar */}
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] text-muted-foreground font-medium w-10">Score</span>
        <Progress value={Math.min(customer.score, 100)} className="h-1.5 flex-1" />
        <span className="text-[11px] font-bold w-7 text-right tabular-nums">{customer.score}</span>
      </div>

      {/* Bottom stats */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        {customer.loyalty_points > 0 && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-rounded text-amber-500" style={{ fontSize: 13 }}>star</span>
            {customer.loyalty_points} pts
          </span>
        )}
        {(Number(customer.total_orders) || 0) > 0 && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-rounded" style={{ fontSize: 13 }}>receipt_long</span>
            {customer.total_orders} pedidos
          </span>
        )}
        {(Number(customer.total_spent) || 0) > 0 && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-rounded" style={{ fontSize: 13 }}>payments</span>
            R$ {Number(customer.total_spent).toFixed(0)}
          </span>
        )}
        {daysSince !== null && (
          <span className={cn('flex items-center gap-1', daysSince > 60 && 'text-destructive')}>
            <span className="material-symbols-rounded" style={{ fontSize: 13 }}>schedule</span>
            {daysSince === 0 ? 'Hoje' : `${daysSince}d atrás`}
          </span>
        )}
      </div>

      {/* Tags */}
      {customer.tags && customer.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {customer.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/20 text-primary/80">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
});
