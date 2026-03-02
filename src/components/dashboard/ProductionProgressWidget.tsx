import { useProductionOrders, ProductionReportItem } from '@/hooks/useProductionOrders';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ProductionProgressWidgetProps {
  variant: 'compact' | 'detailed';
  /** For employee: filter completions by this user */
  userId?: string;
}

function StatusIcon({ status }: { status: ProductionReportItem['status'] }) {
  if (status === 'complete') return <AppIcon name="CheckCircle2" size={14} className="text-emerald-500" />;
  if (status === 'partial') return <AppIcon name="Clock" size={14} className="text-amber-500" />;
  if (status === 'in_progress') return <AppIcon name="Play" size={14} className="text-blue-500" />;
  return <span className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 inline-block" />;
}

function statusColor(status: ProductionReportItem['status']) {
  if (status === 'complete') return 'bg-emerald-500';
  if (status === 'partial') return 'bg-amber-500';
  return 'bg-muted-foreground/20';
}

export function ProductionProgressWidget({ variant, userId }: ProductionProgressWidgetProps) {
  const { activeUnitId } = useUnit();
  const navigate = useNavigate();
  const { report, totals, isLoading, hasOrder } = useProductionOrders(activeUnitId, new Date());

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    );
  }

  if (!hasOrder || report.length === 0) {
    return (
      <button
        onClick={() => navigate('/checklists')}
        className="card-surface p-5 w-full text-center"
      >
        <AppIcon name="Factory" size={24} className="mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum plano de produção hoje</p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">Toque para criar</p>
      </button>
    );
  }

  const hasInProgress = report.some(r => r.status === 'in_progress');
  const progressColor = totals.percent >= 100
    ? 'bg-emerald-500'
    : hasInProgress
      ? 'bg-amber-500'
      : totals.percent > 0
        ? 'bg-amber-500'
        : 'bg-muted-foreground/30';

  return (
    <button
      onClick={() => navigate('/checklists')}
      className="w-full text-left space-y-3"
    >
      {/* Summary KPI Row */}
      <div className="card-surface p-4">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <KpiBlock label="Feitas" value={totals.done} accent="emerald" />
          <KpiBlock label="Planejadas" value={totals.ordered} />
          <KpiBlock label="Progresso" value={`${totals.percent}%`} accent={totals.percent >= 100 ? 'emerald' : totals.percent > 0 ? 'amber' : undefined} />
        </div>

        {/* Global progress bar */}
        <div className="relative h-2.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", progressColor)}
            style={{ width: `${Math.max(Math.min(totals.percent, 100), hasInProgress ? 3 : 0)}%` }}
          />
        </div>
      </div>

      {/* Item list — only in detailed variant */}
      {variant === 'detailed' && (
        <div className="space-y-1.5">
          {report.map(item => {
            const itemColor = item.status === 'complete' ? 'text-emerald-500'
              : item.status === 'in_progress' ? 'text-amber-500'
              : item.status === 'partial' ? 'text-amber-500'
              : 'text-muted-foreground';
            const dotColor = item.status === 'complete' ? 'bg-emerald-500'
              : item.status === 'in_progress' ? 'bg-amber-500'
              : item.status === 'partial' ? 'bg-amber-500'
              : 'bg-muted-foreground/30';
            return (
            <div key={item.checklist_item_id} className="flex items-center gap-2 px-1 py-1">
              <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />
              <p className={cn("text-sm flex-1 min-w-0 truncate", item.status === 'complete' || item.status === 'in_progress' || item.status === 'partial' ? 'text-foreground' : 'text-muted-foreground')}>
                {item.item_name}
              </p>
              <p className={cn("text-sm font-bold tabular-nums shrink-0", itemColor)}>
                {item.quantity_done}/{item.quantity_ordered}
              </p>
            </div>
            );
          })}
        </div>
      )}
    </button>
  );
}

function KpiBlock({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  const textColor = accent === 'emerald' ? 'text-emerald-500' : accent === 'amber' ? 'text-amber-500' : accent === 'blue' ? 'text-blue-500' : 'text-foreground';
  return (
    <div className="text-center">
      <p className={cn("text-xl font-extrabold tabular-nums leading-none", textColor)}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
