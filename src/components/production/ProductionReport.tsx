import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { ProductionReportItem } from '@/hooks/useProductionOrders';

interface ProductionReportProps {
  report: ProductionReportItem[];
  totals: { ordered: number; done: number; pending: number; percent: number };
}

const statusConfig = {
  complete: { bg: 'bg-success/10', text: 'text-success', icon: 'check_circle', label: 'Concluído' },
  partial: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: 'pending', label: 'Parcial' },
  not_started: { bg: 'bg-destructive/10', text: 'text-destructive', icon: 'cancel', label: 'Pendente' },
} as const;

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
  if (minutes > 0) return `${minutes}min`;
  return `${totalSeconds}s`;
}

export function ProductionReport({ report, totals }: ProductionReportProps) {
  if (report.length === 0) return null;

  // Calculate average production time for items that have duration
  const itemsWithDuration = report.filter(r => r.duration_ms && r.duration_ms > 0);
  const avgDuration = itemsWithDuration.length > 0
    ? itemsWithDuration.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / itemsWithDuration.length
    : null;

  return (
    <div className="space-y-4">
      {/* Summary hero card */}
      <div className="finance-hero-card checklist-gradient-slow rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <AppIcon name="BarChart3" size={20} className="text-white/80" />
          <h3 className="text-base font-bold text-white">Relatório de Produção</h3>
        </div>
        <div className={cn("grid gap-3", avgDuration ? "grid-cols-4" : "grid-cols-3")}>
          <div className="text-center">
            <p className="text-2xl font-black text-white">{totals.ordered}</p>
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Pedido</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">{totals.done}</p>
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Produzido</p>
          </div>
          <div className="text-center">
            <p className={cn("text-2xl font-black", totals.pending === 0 ? "text-success" : "text-amber-400")}>
              {totals.pending}
            </p>
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Pendente</p>
          </div>
          {avgDuration && (
            <div className="text-center">
              <p className="text-2xl font-black text-white">⏱</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">
                {formatDuration(avgDuration)} avg
              </p>
            </div>
          )}
        </div>
        <div className="mt-4 w-full h-2 rounded-full bg-white/15 overflow-hidden">
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
        <p className="text-center mt-2 text-sm font-bold text-white">{totals.percent}% concluído</p>
      </div>

      {/* Item detail list */}
      <div className="space-y-2">
        {report.map(item => {
          const cfg = statusConfig[item.status];
          return (
            <div key={item.checklist_item_id} className="card-command p-3 flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                <AppIcon name={cfg.icon} size={18} fill={1} className={cfg.text} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.item_name}</p>
                {item.piece_dimensions && (
                  <p className="text-[10px] text-muted-foreground">{item.piece_dimensions}</p>
                )}
                {item.duration_ms && item.duration_ms > 0 && (
                  <p className="text-[10px] text-muted-foreground font-mono">
                    ⏱ {formatDuration(item.duration_ms)}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">
                  <span className={cn(
                    item.status === 'complete' ? 'text-success' : item.status === 'partial' ? 'text-amber-500' : 'text-muted-foreground'
                  )}>
                    {item.quantity_done}
                  </span>
                  <span className="text-muted-foreground">/{item.quantity_ordered}</span>
                </p>
                <p className={cn("text-[10px] font-medium", cfg.text)}>{item.percent}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
