import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { ProductionOrder } from '@/hooks/useProductionOrders';

interface ShiftData {
  order: ProductionOrder | null;
  totals: { ordered: number; done: number; pending: number; percent: number };
}

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
  /** Optional: pass shift1 + shift2 data for compact multi-shift view */
  shift1?: ShiftData;
  shift2?: ShiftData;
}

export function ProductionDayCard({
  order, totals, isAdmin, currentShift, isShift1Closed,
  onCreatePlan, onViewReport, onEditPlan, onReopenShift,
  shift1, shift2,
}: ProductionDayCardProps) {
  if (!order) {
    if (!isAdmin) return null;
    return (
      <button
        onClick={onCreatePlan}
        className="w-full rounded-2xl p-4 text-left transition-all bg-card ring-1 ring-border/40 hover:ring-primary/30 hover:shadow-lg group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <AppIcon name="ClipboardList" size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">Plano de Produção</h3>
            <p className="text-[11px] text-muted-foreground">Toque para criar</p>
          </div>
          <AppIcon name="Plus" size={18} className="text-primary" />
        </div>
      </button>
    );
  }

  const hasMultiShift = shift1?.order && shift2?.order;

  return (
    <div className="space-y-2">
      {/* Main active shift card */}
      <div className="flex gap-2">
        <button
          onClick={onViewReport}
          className={cn(
            "flex-1 rounded-2xl p-4 text-left transition-all ring-1 hover:shadow-lg",
            totals.percent >= 100
              ? "bg-success/5 ring-success/20"
              : "bg-card ring-border/40 hover:ring-primary/30"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              totals.percent >= 100 ? "bg-success/15" : "bg-primary/10"
            )}>
              <AppIcon
                name={totals.percent >= 100 ? "check_circle" : "Factory"}
                size={20}
                fill={totals.percent >= 100 ? 1 : 0}
                className={totals.percent >= 100 ? "text-success" : "text-primary"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Turno {currentShift}</span>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  order.status === 'closed'
                    ? "bg-muted text-muted-foreground"
                    : totals.percent >= 100
                      ? "bg-success/15 text-success"
                      : "bg-warning/15 text-warning"
                )}>
                  {order.status === 'closed' ? 'Fechado' : `${totals.percent}%`}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {totals.done}/{totals.ordered} peças
              </p>
            </div>
            <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 w-full h-1.5 rounded-full bg-secondary/60 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${totals.percent}%`,
                background: totals.percent >= 100
                  ? 'hsl(var(--success))'
                  : 'linear-gradient(90deg, hsl(var(--warning)), hsl(var(--warning) / 0.7))',
              }}
            />
          </div>
        </button>

        {/* Edit plan — admin only */}
        {isAdmin && order.status !== 'closed' && (
          <button
            onClick={onEditPlan}
            className="w-11 rounded-2xl bg-card ring-1 ring-border/40 hover:ring-primary/30 flex items-center justify-center transition-all hover:shadow-lg shrink-0"
          >
            <AppIcon name="Pencil" size={16} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Multi-shift summary row */}
      {hasMultiShift && (
        <div className="grid grid-cols-2 gap-2">
          <ShiftMiniCard label="Turno 1" data={shift1!} isClosed={shift1!.order?.status === 'closed'} />
          <ShiftMiniCard label="Turno 2" data={shift2!} isClosed={shift2!.order?.status === 'closed'} />
        </div>
      )}

      {/* Reopen shift — admin only */}
      {isAdmin && order.status === 'closed' && onReopenShift && (
        <button
          onClick={onReopenShift}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-card border border-warning/30 hover:bg-warning/5 transition-colors text-xs font-semibold text-warning"
        >
          <AppIcon name="RotateCcw" size={14} />
          Reabrir Turno {currentShift}
        </button>
      )}
    </div>
  );
}

function ShiftMiniCard({ label, data, isClosed }: { label: string; data: ShiftData; isClosed?: boolean }) {
  const { totals } = data;
  const isComplete = totals.percent >= 100;

  return (
    <div className={cn(
      "rounded-xl p-3 ring-1",
      isClosed ? "bg-muted/30 ring-border/30" : isComplete ? "bg-success/5 ring-success/20" : "bg-card ring-border/40"
    )}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {isClosed && <AppIcon name="Lock" size={12} className="text-muted-foreground" />}
        <span className={cn("text-xs font-bold", isClosed ? "text-muted-foreground" : "text-foreground")}>{label}</span>
        {isClosed && <span className="text-[10px] text-muted-foreground">· Fechado</span>}
      </div>
      <div className="w-full h-1 rounded-full bg-secondary/50 overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${totals.percent}%`,
            background: isComplete
              ? 'hsl(var(--success))'
              : 'linear-gradient(90deg, hsl(var(--warning)), hsl(var(--warning) / 0.7))',
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{totals.done}/{totals.ordered}</span>
        <span className={cn(
          "text-xs font-bold",
          isComplete ? "text-success" : isClosed ? "text-muted-foreground" : "text-warning"
        )}>
          {totals.percent}%
        </span>
      </div>
    </div>
  );
}
