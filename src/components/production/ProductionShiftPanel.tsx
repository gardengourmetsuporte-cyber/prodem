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
  // Shift 2 is locked only when shift 1 has an active (non-closed) order
  const isShift2Locked = shift1.hasOrder && !isShift1Closed;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <AppIcon name="Clock" size={12} className="text-muted-foreground/50" />
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Turnos</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ShiftCard
          label="TURNO 1"
          shift={1}
          data={shift1}
          isActive={currentShift === 1 && !isShift1Closed}
          isClosed={isShift1Closed}
          isAdmin={isAdmin}
          onSelect={() => {
            if (isShift1Closed) onViewReport(1);
            else if (currentShift === 1) onViewReport(1);
            else onSelectShift(1);
          }}
          onReopen={isShift1Closed && isAdmin ? () => onReopenShift?.(1) : undefined}
          onCreatePlan={!shift1.hasOrder && isAdmin ? onCreatePlan : undefined}
        />
        <ShiftCard
          label="TURNO 2"
          shift={2}
          data={shift2}
          isActive={currentShift === 2 && !isShift2Locked}
          isClosed={shift2.order?.status === 'closed'}
          isLocked={isShift2Locked}
          isAdmin={isAdmin}
          onSelect={() => {
            if (isShift2Locked) return;
            if (shift2.order?.status === 'closed') onViewReport(2);
            else if (currentShift === 2) onViewReport(2);
            else onSelectShift(2);
          }}
          onReopen={shift2.order?.status === 'closed' && isAdmin ? () => onReopenShift?.(2) : undefined}
        />
      </div>
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
      <div className="industrial-card rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 opacity-40 min-h-[110px]">
        <AppIcon name="Lock" size={18} className="text-muted-foreground" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-[8px] text-muted-foreground/60">Feche o T1 primeiro</span>
      </div>
    );
  }

  if (!hasOrder && onCreatePlan) {
    return (
      <button
        onClick={onCreatePlan}
        className="industrial-card rounded-xl p-4 hover:ring-warning/40 transition-all min-h-[110px] flex flex-col items-center justify-center gap-2 group"
      >
        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors ring-1 ring-warning/30">
          <AppIcon name="Plus" size={20} className="text-warning" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{label}</span>
        <span className="text-[9px] text-muted-foreground">Criar plano</span>
      </button>
    );
  }

  return (
    <div className={cn(
      "industrial-card rounded-xl p-4 transition-all relative min-h-[110px]",
      isActive && "ring-warning/50 shadow-lg shadow-warning/5",
      isClosed && "opacity-70",
    )}>
      {/* Active indicator bar */}
      {isActive && <div className="absolute top-0 left-0 right-0 h-0.5 bg-warning rounded-t-xl" />}
      
      <button onClick={onSelect} className="w-full text-left">
        <div className="flex items-center gap-2 mb-3">
          {isClosed ? (
            <AppIcon name="Lock" size={13} className="text-muted-foreground" />
          ) : isComplete ? (
            <AppIcon name="CheckCircle" size={14} className="text-success" />
          ) : isActive ? (
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          ) : (
            <AppIcon name="Factory" size={13} className="text-muted-foreground" />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{label}</span>
          {isClosed && <span className="text-[8px] text-muted-foreground/60 ml-auto uppercase tracking-wider">Fechado</span>}
        </div>

        {/* Progress */}
        <div className="w-full h-1.5 rounded-sm bg-background/50 overflow-hidden mb-2 ring-1 ring-border/10">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${totals.percent}%`,
              background: isComplete
                ? 'hsl(var(--success))'
                : 'linear-gradient(90deg, hsl(var(--warning)), hsl(var(--warning) / 0.5))',
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-mono">{totals.done}/{totals.ordered} pç</span>
          <span className={cn(
            "text-lg font-black font-display",
            isComplete ? "text-success" : isClosed ? "text-muted-foreground" : "text-warning"
          )}>
            {totals.percent}%
          </span>
        </div>
      </button>

      {onReopen && isClosed && (
        <button
          onClick={onReopen}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-warning/10 hover:bg-warning/15 transition-colors"
        >
          <AppIcon name="RotateCcw" size={12} className="text-warning" />
          <span className="text-[9px] font-bold text-warning uppercase tracking-wider">Reabrir</span>
        </button>
      )}
    </div>
  );
}
