import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { AppIcon } from '@/components/ui/app-icon';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/* ─── lazy widgets ─── */
const LazyFinanceChart = lazy(() => import('./FinanceChartWidget').then(m => ({ default: m.FinanceChartWidget })));

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { activeUnitId } = useUnit();
  const { hasAccess, isLoading: modulesLoading } = useUserModules();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { report, totals, isLoading: prodLoading, hasOrder } = useProductionOrders(activeUnitId, new Date());

  const isReady = !statsLoading && !modulesLoading && !!profile;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();
  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';

  if (!isReady) {
    return (
      <div className="px-4 py-3 lg:px-6">
        <PageSkeleton variant="dashboard" />
      </div>
    );
  }

  /* alert items */
  const alerts: { icon: string; label: string; color: string; route: string }[] = [];
  if (stats.criticalItems > 0) alerts.push({ icon: 'Package', label: `${stats.criticalItems} ite${stats.criticalItems > 1 ? 'ns' : 'm'} estoque crítico`, color: 'text-destructive', route: '/inventory' });
  if (stats.billsDueSoon.length > 0) alerts.push({ icon: 'Receipt', label: `${stats.billsDueSoon.length} conta${stats.billsDueSoon.length > 1 ? 's' : ''} a vencer`, color: 'text-warning', route: '/finance' });
  if (stats.pendingOrders > 0) alerts.push({ icon: 'FileText', label: `${stats.pendingOrders} orçamento${stats.pendingOrders > 1 ? 's' : ''} pendente${stats.pendingOrders > 1 ? 's' : ''}`, color: 'text-primary', route: '/orders' });
  if (stats.pendingRedemptions > 0) alerts.push({ icon: 'Gift', label: `${stats.pendingRedemptions} resgate${stats.pendingRedemptions > 1 ? 's' : ''} pendente${stats.pendingRedemptions > 1 ? 's' : ''}`, color: 'text-purple-400', route: '/rewards' });
  if (stats.pendingClosings > 0) alerts.push({ icon: 'Calculator', label: `${stats.pendingClosings} fechamento${stats.pendingClosings > 1 ? 's' : ''} pendente${stats.pendingClosings > 1 ? 's' : ''}`, color: 'text-warning', route: '/cash-closing' });

  const prodPercent = totals.percent;
  const prodDone = totals.done;
  const prodOrdered = totals.ordered;

  return (
    <div className="space-y-4 px-4 py-3 lg:px-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>
            {greeting}, {firstName} 👋
          </h2>
          <p className="text-muted-foreground text-xs capitalize mt-0.5">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <AppIcon name="Bell" size={18} className="text-muted-foreground" />
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
              <span className="text-[9px] font-bold text-destructive-foreground">{alerts.length}</span>
            </span>
          )}
        </button>
      </div>

      {/* ═══ ALERTS RIBBON ═══ */}
      {alerts.length > 0 && (
        <div className="space-y-1.5 animate-spring-in spring-stagger-1">
          {alerts.map((a, i) => (
            <button
              key={i}
              onClick={() => navigate(a.route)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-card border border-border/50 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <AppIcon name={a.icon} size={16} className={a.color} />
              </div>
              <p className="text-sm text-foreground flex-1">{a.label}</p>
              <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/40" />
            </button>
          ))}
        </div>
      )}
      {alerts.length === 0 && (
        <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-success/5 border border-success/10 animate-spring-in spring-stagger-1">
          <AppIcon name="CheckCircle2" size={16} className="text-success" />
          <p className="text-sm text-muted-foreground">Tudo em dia — nenhum alerta</p>
        </div>
      )}

      {/* ═══ PRODUCTION MONITOR — HERO CARD ═══ */}
      {hasAccess('checklists') && (
        <button
          onClick={() => navigate('/checklists')}
          className="w-full text-left animate-spring-in spring-stagger-2"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-4">
            {/* Subtle glow accent */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: prodPercent >= 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))' }} />

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AppIcon name="Factory" size={16} className="text-primary" />
                </div>
                <div>
                  <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">
                    Produção hoje
                  </span>
                </div>
              </div>
              <AppIcon name="ChevronRight" size={16} className="text-muted-foreground/40" />
            </div>

            {!hasOrder || report.length === 0 ? (
              <div className="text-center py-4">
                <AppIcon name="Factory" size={28} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum plano de produção hoje</p>
              </div>
            ) : (
              <>
                {/* KPIs row */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <ProdKpi label="Feitas" value={prodDone} accent={prodDone > 0 ? 'success' : undefined} />
                  <ProdKpi label="Planejadas" value={prodOrdered} />
                  <ProdKpi label="Progresso" value={`${prodPercent}%`} accent={prodPercent >= 100 ? 'success' : prodPercent > 0 ? 'warning' : undefined} />
                </div>

                {/* Progress bar */}
                <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      prodPercent >= 100 ? 'bg-success' : prodPercent > 0 ? 'bg-primary' : 'bg-muted-foreground/20'
                    )}
                    style={{ width: `${Math.min(prodPercent, 100)}%` }}
                  />
                </div>

                {/* Item list — compact */}
                <div className="mt-3 space-y-1">
                  {report.slice(0, 5).map(item => (
                    <div key={item.checklist_item_id} className="flex items-center gap-2 py-1">
                      <span className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        item.status === 'complete' ? 'bg-success' : item.status === 'partial' || item.status === 'in_progress' ? 'bg-warning' : 'bg-muted-foreground/30'
                      )} />
                      <span className={cn(
                        "text-xs truncate flex-1",
                        item.status === 'complete' ? 'text-success' : item.status === 'partial' || item.status === 'in_progress' ? 'text-warning' : 'text-foreground'
                      )}>{item.item_name}</span>
                      <span className={cn(
                        "text-xs font-bold tabular-nums shrink-0",
                        item.status === 'complete' ? 'text-success' : item.status === 'partial' || item.status === 'in_progress' ? 'text-warning' : 'text-muted-foreground'
                      )}>
                        {item.quantity_done}/{item.quantity_ordered}
                      </span>
                    </div>
                  ))}
                  {report.length > 5 && (
                    <p className="text-[10px] text-muted-foreground text-center pt-1">
                      +{report.length - 5} itens
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </button>
      )}

      {/* ═══ FINANCE SNAPSHOT ═══ */}
      {hasAccess('finance') && (
        <div className="grid grid-cols-2 gap-3 animate-spring-in spring-stagger-3">
          <button
            onClick={() => navigate('/finance')}
            className="dash-hero text-left relative overflow-hidden"
          >
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/60">Saldo</span>
            <p className={cn(
              "text-2xl font-extrabold tracking-tight leading-tight mt-1",
              stats.monthBalance >= 0 ? 'text-white' : 'text-red-300'
            )}>
              {formatCurrency(stats.monthBalance)}
            </p>
          </button>
          <button
            onClick={() => navigate('/finance')}
            className="card-surface p-4 text-left"
          >
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground">Pendências</span>
            <p className={cn(
              "text-2xl font-extrabold tracking-tight leading-tight mt-1",
              stats.pendingExpenses > 0 ? 'text-warning' : 'text-foreground'
            )}>
              {formatCurrency(stats.pendingExpenses)}
            </p>
          </button>
        </div>
      )}

      {/* ═══ BILLS DUE SOON ═══ */}
      {stats.billsDueSoon.length > 0 && hasAccess('finance') && (
        <div className="animate-spring-in spring-stagger-4">
          <SectionLabel label="Contas a vencer" icon="AlertTriangle" iconColor="text-warning" onNavigate={() => navigate('/finance')} />
          <div className="card-surface overflow-hidden divide-y divide-border/50">
            {stats.billsDueSoon.slice(0, 4).map(bill => (
              <div key={bill.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{bill.description}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {bill.daysUntilDue === 0 ? 'Vence hoje' : bill.daysUntilDue === 1 ? 'Amanhã' : `${bill.daysUntilDue} dias`}
                  </p>
                </div>
                <span className={cn("text-xs font-bold tabular-nums shrink-0", bill.daysUntilDue <= 1 ? 'text-destructive' : 'text-warning')}>
                  {formatCurrency(bill.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ QUOTE REQUESTS ═══ */}
      <QuoteRequestsInline />

      {/* ═══ FINANCE CHART ═══ */}
      {hasAccess('finance') && (
        <div className="animate-spring-in">
          <SectionLabel label="Despesas por categoria" icon="PieChart" iconColor="text-destructive" onNavigate={() => navigate('/finance')} />
          <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
            <LazyFinanceChart />
          </Suspense>
        </div>
      )}

      {/* bottom spacer */}
      <div className="h-4" />
    </div>
  );
}

/* ─── Small sub-components ─── */

function ProdKpi({ label, value, accent }: { label: string; value: number | string; accent?: 'success' | 'warning' }) {
  const color = accent === 'success' ? 'text-success' : accent === 'warning' ? 'text-warning' : 'text-foreground';
  return (
    <div className="text-center">
      <p className={cn("text-xl font-extrabold tabular-nums leading-none", color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function SectionLabel({ label, icon, iconColor, onNavigate }: { label: string; icon: string; iconColor: string; onNavigate?: () => void }) {
  return (
    <button
      onClick={onNavigate}
      className="dash-section-header"
      disabled={!onNavigate}
      type="button"
    >
      <span className={iconColor}><AppIcon name={icon} size={14} /></span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {onNavigate && <AppIcon name="ChevronRight" size={12} className="ml-auto text-muted-foreground/40" />}
    </button>
  );
}

function QuoteRequestsInline() {
  const navigate = useNavigate();
  const { data: requests, isLoading } = useQuery({
    queryKey: ['quote-requests-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_requests' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3) as any;
      if (error) throw error;
      return data as Array<{ id: string; name: string; company: string | null; description: string; status: string; created_at: string }>;
    },
    staleTime: 30_000,
  });

  if (isLoading) return <Skeleton className="h-20 w-full rounded-2xl" />;
  if (!requests || requests.length === 0) return null;

  const newCount = requests.filter(r => r.status === 'novo').length;

  return (
    <div className="animate-spring-in">
      <SectionLabel label="Orçamentos recebidos" icon="FileText" iconColor="text-primary" onNavigate={() => navigate('/orders')} />
      <div className="card-surface overflow-hidden divide-y divide-border/50">
        {requests.map(req => (
          <button key={req.id} onClick={() => navigate('/orders')} className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-muted/30 transition-colors">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", req.status === 'novo' ? 'bg-primary/10' : 'bg-muted')}>
              <AppIcon name="FileText" size={14} className={req.status === 'novo' ? 'text-primary' : 'text-muted-foreground'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground truncate">{req.name}</span>
                {req.status === 'novo' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/15 text-primary shrink-0">NOVO</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{req.description}</p>
            </div>
            <span className="text-[10px] text-muted-foreground/50 shrink-0">
              {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
