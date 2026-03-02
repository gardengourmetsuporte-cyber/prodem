import { useNavigate } from 'react-router-dom';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

export function ChecklistDashboardWidget() {
  const navigate = useNavigate();
  const { activeUnitId } = useUnit();
  const { totals, report, isLoading, hasOrder } = useProductionOrders(activeUnitId, new Date());

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl p-4 bg-card animate-pulse h-24" />
    );
  }

  if (!hasOrder) {
    return (
      <button
        onClick={() => navigate('/checklists')}
        className="w-full text-left rounded-2xl p-4 bg-card transition-all duration-200 active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted">
            <AppIcon name="ClipboardCheck" size={20} className="text-muted-foreground" />
          </div>
          <div className="flex-1">
            <span className="text-base font-bold block font-display text-foreground">Produção do Dia</span>
            <span className="text-[11px] font-medium text-muted-foreground">Nenhum plano hoje</span>
          </div>
        </div>
      </button>
    );
  }

  const isComplete = totals.percent >= 100;
  const hasInProgress = report.some(r => r.status === 'in_progress');
  const statusLabel = isComplete ? "✓ Concluído" : hasInProgress ? "⚙ Em Produção" : totals.percent > 0 ? "Em andamento" : "Não iniciado";

  return (
    <button
      onClick={() => navigate('/checklists')}
      className="w-full text-left rounded-2xl p-4 bg-card transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          isComplete ? "bg-success/20" : hasInProgress ? "bg-blue-500/20" : "bg-warning/20"
        )}>
          <AppIcon name="ClipboardCheck" size={20} className={cn(isComplete ? "text-success" : hasInProgress ? "text-blue-500" : "text-warning")} />
        </div>
        <div className="flex-1">
          <span className={cn(
            "text-base font-bold block font-display",
            isComplete ? "text-success" : "text-foreground"
          )}>
            Produção do Dia
          </span>
          <span className={cn(
            "text-[11px] font-medium",
            isComplete ? "text-success" : hasInProgress ? "text-blue-500" : totals.percent > 0 ? "text-warning" : "text-muted-foreground"
          )}>
            {statusLabel}
          </span>
        </div>
        <span className={cn(
          "text-2xl font-black",
          isComplete ? "text-success" : hasInProgress ? "text-blue-500" : "text-warning"
        )}>
          {totals.percent}%
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden mb-2">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            isComplete ? "bg-success" : hasInProgress ? "bg-blue-500 animate-pulse" : "bg-warning"
          )}
          style={{ width: `${Math.max(totals.percent, hasInProgress ? 3 : 0)}%` }}
        />
      </div>

      <span className="text-xs text-muted-foreground">
        {totals.done} de {totals.ordered} peças concluídas
      </span>
    </button>
  );
}
