import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { ProductionOrder } from '@/hooks/useProductionOrders';

interface ProductionDayCardProps {
  order: ProductionOrder | null;
  totals: { ordered: number; done: number; pending: number; percent: number };
  isAdmin: boolean;
  currentShift: number;
  isShift1Closed: boolean;
  onCreatePlan: () => void;
  onViewReport: () => void;
  onEditPlan: () => void;
  onReopenShift?: () => void;
}

export function ProductionDayCard({
  order, totals, isAdmin, currentShift, isShift1Closed,
  onCreatePlan, onViewReport, onEditPlan, onReopenShift,
}: ProductionDayCardProps) {
  if (!order) {
    if (!isAdmin) return null;
    return (
      <button
        onClick={onCreatePlan}
        className="w-full rounded-2xl p-5 text-left transition-all bg-card ring-1 ring-border/40 hover:ring-primary/30 hover:shadow-lg group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <AppIcon name="ClipboardList" size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">Plano de Produção</h3>
            <p className="text-xs text-muted-foreground">Nenhum plano criado para hoje — toque para criar</p>
          </div>
          <AppIcon name="Plus" size={20} className="text-primary" />
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Main card — tap to see report */}
        <button
          onClick={onViewReport}
          className={cn(
            "flex-1 rounded-2xl p-5 text-left transition-all ring-1 hover:shadow-lg",
            totals.percent >= 100
              ? "bg-success/5 ring-success/20"
              : "bg-card ring-border/40 hover:ring-primary/30"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              totals.percent >= 100 ? "bg-success/15" : "bg-primary/10"
            )}>
              <AppIcon
                name={totals.percent >= 100 ? "check_circle" : "ClipboardList"}
                size={22}
                fill={totals.percent >= 100 ? 1 : 0}
                className={totals.percent >= 100 ? "text-success" : "text-primary"}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Turno {currentShift}
                </h3>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  order.status === 'closed'
                    ? "bg-muted text-muted-foreground"
                    : totals.percent >= 100
                      ? "bg-success/15 text-success"
                      : "bg-warning/15 text-warning"
                )}>
                  {order.status === 'closed' ? 'Fechado' : `${totals.percent}%`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {totals.done}/{totals.ordered} peças · {totals.pending} pendentes
              </p>
            </div>
            <AppIcon name="ChevronRight" size={18} className="text-muted-foreground" />
          </div>

          {/* Mini progress bar */}
          <div className="mt-3 w-full h-1.5 rounded-full bg-secondary/60 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${totals.percent}%`,
                background: totals.percent >= 100
                  ? 'hsl(var(--success))'
                  : 'linear-gradient(90deg, hsl(32 100% 50%), hsl(40 100% 55%))',
              }}
            />
          </div>
        </button>

        {/* Edit plan button — admin only */}
        {isAdmin && order.status !== 'closed' && (
          <button
            onClick={onEditPlan}
            className="w-12 rounded-2xl bg-card ring-1 ring-border/40 hover:ring-primary/30 flex items-center justify-center transition-all hover:shadow-lg shrink-0"
          >
            <AppIcon name="Pencil" size={18} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Reopen shift button — only for admin when shift is closed */}
      {isAdmin && order.status === 'closed' && onReopenShift && (
        <button
          onClick={onReopenShift}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-card border border-warning/30 hover:bg-warning/5 transition-colors text-sm font-semibold text-warning"
        >
          <AppIcon name="RotateCcw" size={16} />
          Reabrir Turno {currentShift}
        </button>
      )}
    </div>
  );
}
