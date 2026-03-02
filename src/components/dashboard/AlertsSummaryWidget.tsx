import { useDashboardStats, BillDueSoon } from '@/hooks/useDashboardStats';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';

interface AlertItem {
  icon: string;
  label: string;
  count: number;
  color: string;
  route: string;
}

export function AlertsSummaryWidget() {
  const navigate = useNavigate();
  const { stats, isLoading } = useDashboardStats();

  if (isLoading) return <Skeleton className="h-20 w-full rounded-2xl" />;

  const alerts: AlertItem[] = [];

  if (stats.criticalItems > 0) {
    alerts.push({
      icon: 'Package',
      label: `${stats.criticalItems} ite${stats.criticalItems > 1 ? 'ns' : 'm'} estoque crítico`,
      count: stats.criticalItems,
      color: 'text-red-400',
      route: '/inventory',
    });
  }

  if (stats.billsDueSoon.length > 0) {
    alerts.push({
      icon: 'Receipt',
      label: `${stats.billsDueSoon.length} conta${stats.billsDueSoon.length > 1 ? 's' : ''} a vencer`,
      count: stats.billsDueSoon.length,
      color: 'text-amber-400',
      route: '/finance',
    });
  }

  if (stats.pendingOrders > 0) {
    alerts.push({
      icon: 'FileText',
      label: `${stats.pendingOrders} orçamento${stats.pendingOrders > 1 ? 's' : ''} pendente${stats.pendingOrders > 1 ? 's' : ''}`,
      count: stats.pendingOrders,
      color: 'text-orange-400',
      route: '/orders',
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="card-surface p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <AppIcon name="CheckCircle2" size={16} className="text-emerald-500" />
        </div>
        <p className="text-sm text-muted-foreground">Tudo em dia — nenhum alerta</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {alerts.map((alert, i) => (
        <button
          key={i}
          onClick={() => navigate(alert.route)}
          className="card-surface px-3.5 py-3 flex items-center gap-3 w-full text-left hover:bg-muted/50 transition-colors"
        >
          <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0`}>
            <AppIcon name={alert.icon} size={16} className={alert.color} />
          </div>
          <p className="text-sm text-foreground flex-1">{alert.label}</p>
          <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/40" />
        </button>
      ))}
    </div>
  );
}
