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
        className="w-full rounded-2xl p-4 text-left transition-all bg-card ring-1 ring-border/40 hover:ring-primary/30 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <AppIcon name="Factory" size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-foreground">Plano de Produção</span>
            <p className="text-[11px] text-muted-foreground">Toque para criar</p>
          </div>
          <AppIcon name="Plus" size={18} className="text-primary" />
        </div>
      </button>
    );
  }

  const hasShift2 = !!shift2?.order;

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Turno 1 */}
      <ShiftCard
        label="Turno 1"
        data={shift1 || { order, totals }}
        isActive={currentShift === 1 && order.status !== 'closed'}
        isClosed={shift1?.order?.status === 'closed' || (currentShift !== 1 && isShift1Closed)}
        isAdmin={isAdmin}
        onTap={onViewReport}
        onEdit={currentShift === 1 ? onEditPlan : undefined}
        onReopen={currentShift === 1 && order.status === 'closed' ? onReopenShift : undefined}
      />

      {/* Turno 2 */}
      {hasShift2 ? (
        <ShiftCard
          label="Turno 2"
          data={shift2!}
          isActive={currentShift === 2 && order.status !== 'closed'}
          isClosed={shift2!.order?.status === 'closed'}
          isAdmin={isAdmin}
          onTap={onViewReport}
          onEdit={currentShift === 2 ? onEditPlan : undefined}
          onReopen={currentShift === 2 && order.status === 'closed' ? onReopenShift : undefined}
        />
      ) : (
        <div className="rounded-2xl p-4 ring-1 ring-border/20 bg-card/30 flex flex-col items-center justify-center gap-1 opacity-40">
          <AppIcon name="Lock" size={16} className="text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">Turno 2</span>
        </div>
      )}
    </div>
  );
}

function ShiftCard({
  label, data, isActive, isClosed, isAdmin, onTap, onEdit, onReopen,
}: {
  label: string;
  data: ShiftData;
  isActive: boolean;
  isClosed?: boolean;
  isAdmin: boolean;
  onTap: () => void;
  onEdit?: () => void;
  onReopen?: () => void;
}) {
  const { totals } = data;
  const isComplete = totals.percent >= 100;

  return (
    <div className={cn(
      "rounded-2xl p-4 ring-1 transition-all relative",
      isActive
        ? "bg-card ring-primary/30"
        : isClosed
          ? "bg-muted/20 ring-border/30"
          : "bg-card ring-border/40"
    )}>
      {/* Tap area for report */}
      <button onClick={onTap} className="w-full text-left">
        <div className="flex items-center gap-2 mb-2">
          {isClosed ? (
            <AppIcon name="Lock" size={14} className="text-muted-foreground" />
          ) : (
            <AppIcon name="Factory" size={14} className={isComplete ? "text-success" : "text-primary"} />
          )}
          <span className={cn("text-xs font-bold", isClosed ? "text-muted-foreground" : "text-foreground")}>
            {label}
          </span>
          {isClosed && <span className="text-[9px] text-muted-foreground">Fechado</span>}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-secondary/50 overflow-hidden mb-2">
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
          <span className="text-[11px] text-muted-foreground">{totals.done}/{totals.ordered}</span>
          <span className={cn(
            "text-sm font-black",
            isComplete ? "text-success" : isClosed ? "text-muted-foreground" : "text-warning"
          )}>
            {totals.percent}%
          </span>
        </div>
      </button>

      {/* Action buttons row */}
      {isAdmin && (onEdit || onReopen) && (
        <div className="flex gap-1.5 mt-2 pt-2 border-t border-border/30">
          {onEdit && !isClosed && (
            <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <AppIcon name="Pencil" size={12} className="text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Editar</span>
            </button>
          )}
          {onReopen && isClosed && (
            <button onClick={onReopen} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-warning/10 hover:bg-warning/15 transition-colors">
              <AppIcon name="RotateCcw" size={12} className="text-warning" />
              <span className="text-[10px] font-medium text-warning">Reabrir</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
