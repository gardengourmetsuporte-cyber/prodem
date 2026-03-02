import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { ProductionOrder } from '@/hooks/useProductionOrders';

interface ShiftData {
  order: ProductionOrder | null;
  totals: { ordered: number; done: number; pending: number; percent: number };
  hasOrder: boolean;
}

interface ProductionShiftPanelProps {
  shift1: ShiftData;
  shift2: ShiftData;
  currentShift: 1 | 2;
  onSelectShift: (shift: 1 | 2) => void;
  isAdmin: boolean;
  onCreatePlan: () => void;
  onViewReport: (shift: number) => void;
  onReopenShift?: (shift: number) => void;
}

export function ProductionShiftPanel({
  shift1, shift2, currentShift, onSelectShift,
  isAdmin, onCreatePlan, onViewReport, onReopenShift,
}: ProductionShiftPanelProps) {
  const isShift1Closed = shift1.order?.status === 'closed';
  const isShift2Locked = !isShift1Closed && shift1.hasOrder;

  return (
    <div className="grid grid-cols-2 gap-3">
      <ShiftCard
        label="Turno 1"
        shift={1}
        data={shift1}
        isActive={currentShift === 1 && !isShift1Closed}
        isClosed={isShift1Closed}
        isAdmin={isAdmin}
        onSelect={() => {
          if (isShift1Closed) {
            onViewReport(1);
          } else {
            onSelectShift(1);
          }
        }}
        onReopen={isShift1Closed && isAdmin ? () => onReopenShift?.(1) : undefined}
        onCreatePlan={!shift1.hasOrder && isAdmin ? onCreatePlan : undefined}
      />
      <ShiftCard
        label="Turno 2"
        shift={2}
        data={shift2}
        isActive={currentShift === 2 && !isShift2Locked}
        isClosed={shift2.order?.status === 'closed'}
        isLocked={isShift2Locked}
        isAdmin={isAdmin}
        onSelect={() => {
          if (isShift2Locked) return;
          if (shift2.order?.status === 'closed') {
            onViewReport(2);
          } else {
            onSelectShift(2);
          }
        }}
        onReopen={shift2.order?.status === 'closed' && isAdmin ? () => onReopenShift?.(2) : undefined}
      />
    </div>
  );
}

function ShiftCard({
  label, shift, data, isActive, isClosed, isLocked, isAdmin,
  onSelect, onReopen, onCreatePlan,
}: {
  label: string;
  shift: number;
  data: ShiftData;
  isActive: boolean;
  isClosed?: boolean;
  isLocked?: boolean;
  isAdmin: boolean;
  onSelect: () => void;
  onReopen?: () => void;
  onCreatePlan?: () => void;
}) {
  const { totals, hasOrder } = data;
  const isComplete = totals.percent >= 100;

  if (isLocked) {
    return (
      <div className="rounded-2xl p-4 ring-1 ring-border/20 bg-card/30 flex flex-col items-center justify-center gap-1.5 opacity-40 min-h-[120px]">
        <AppIcon name="Lock" size={18} className="text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
        <span className="text-[9px] text-muted-foreground">Feche o T1 primeiro</span>
      </div>
    );
  }

  if (!hasOrder && onCreatePlan) {
    return (
      <button
        onClick={onCreatePlan}
        className="rounded-2xl p-4 ring-1 ring-border/40 bg-card hover:ring-primary/30 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2 group"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <AppIcon name="Plus" size={20} className="text-primary" />
        </div>
        <span className="text-xs font-bold text-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground">Criar plano</span>
      </button>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl p-4 ring-1 transition-all relative min-h-[120px]",
      isActive
        ? "bg-card ring-primary/40 shadow-lg shadow-primary/5"
        : isClosed
          ? "bg-muted/20 ring-border/30"
          : "bg-card ring-border/40"
    )}>
      <button onClick={onSelect} className="w-full text-left">
        <div className="flex items-center gap-2 mb-3">
          {isClosed ? (
            <AppIcon name="Lock" size={14} className="text-muted-foreground" />
          ) : isComplete ? (
            <AppIcon name="check_circle" size={16} fill={1} className="text-success" />
          ) : (
            <AppIcon name="Factory" size={14} className="text-primary" />
          )}
          <span className={cn("text-xs font-bold", isClosed ? "text-muted-foreground" : "text-foreground")}>
            {label}
          </span>
          {isClosed && <span className="text-[9px] text-muted-foreground ml-auto">Fechado</span>}
          {isActive && !isClosed && (
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-auto" />
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${totals.percent}%`,
              background: isComplete
                ? 'hsl(var(--success))'
                : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))',
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{totals.done}/{totals.ordered} pç</span>
          <span className={cn(
            "text-base font-black",
            isComplete ? "text-success" : isClosed ? "text-muted-foreground" : "text-primary"
          )}>
            {totals.percent}%
          </span>
        </div>
      </button>

      {/* Reopen */}
      {onReopen && isClosed && (
        <button
          onClick={onReopen}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-warning/10 hover:bg-warning/15 transition-colors"
        >
          <AppIcon name="RotateCcw" size={12} className="text-warning" />
          <span className="text-[10px] font-medium text-warning">Reabrir</span>
        </button>
      )}
    </div>
  );
}
