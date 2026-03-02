import { useState, lazy, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useProductionOrders, ProductionReportItem } from '@/hooks/useProductionOrders';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCashClosing } from '@/hooks/useCashClosing';
import { WeeklySummary } from '@/components/cashClosing/WeeklySummary';

const LazyFinanceChart = lazy(() => import('./FinanceChartWidget').then(m => ({ default: m.FinanceChartWidget })));

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { activeUnitId } = useUnit();
  const { hasAccess, isLoading: modulesLoading } = useUserModules();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { closings } = useCashClosing();
  const shift1 = useProductionOrders(activeUnitId, new Date(), 1, '__all__');
  const shift2 = useProductionOrders(activeUnitId, new Date(), 2, '__all__');
  const activeProd = (shift1.order?.status === 'closed' && shift2.hasOrder) ? shift2 : shift1;
  const { report, totals, isLoading: prodLoading, hasOrder } = activeProd;

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

  return (
    <div className="space-y-5 px-4 py-3 lg:px-6">
      {/* ═══ HEADER ═══ */}
      <div>
        <h2 className="text-xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>
          {greeting}, {firstName} 👋
        </h2>
        <p className="text-muted-foreground text-xs capitalize mt-0.5">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* ═══ 1. GLASS HERO — SALDO ═══ */}
      {hasAccess('finance') && (
        <button
          onClick={() => navigate('/finance')}
          className="w-full text-left animate-spring-in spring-stagger-1"
        >
          <div className="glass-hero-balance relative overflow-hidden rounded-2xl p-5">
            {/* Animated gradient orbs */}
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/20 blur-3xl animate-pulse pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
            
            {/* Top row */}
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <AppIcon name="Wallet" size={16} className="text-white/90" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">
                    Saldo da empresa
                  </span>
                </div>
              </div>
              <AppIcon name="ChevronRight" size={16} className="text-white/25" />
            </div>

            {/* Balance */}
            <div className="relative">
              <p className={cn(
                "text-[2.5rem] font-black tracking-tight leading-none font-display",
                stats.monthBalance >= 0 ? 'text-white' : 'text-red-300'
              )} style={{ letterSpacing: '-0.04em' }}>
                {formatCurrency(stats.monthBalance)}
              </p>
            </div>

            {/* Bottom chips */}
            <div className="relative flex items-center gap-2.5 mt-4">
              {stats.pendingExpenses > 0 && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
                  <AppIcon name="Clock" size={12} className="text-warning" />
                  <div>
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-white/40 block">Pendências</span>
                    <span className="text-sm font-bold text-warning">
                      {formatCurrency(stats.pendingExpenses)}
                    </span>
                  </div>
                </div>
              )}
              {alerts.length === 0 && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-success/[0.08] border border-success/[0.12] backdrop-blur-sm">
                  <AppIcon name="CheckCircle2" size={12} className="text-success" />
                  <span className="text-[10px] font-semibold text-success">Tudo em dia</span>
                </div>
              )}
            </div>
          </div>
        </button>
      )}

      {/* ═══ ALERTS RIBBON ═══ */}
      {alerts.length > 0 && (
        <div className="space-y-1.5 animate-spring-in spring-stagger-2">
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

      {/* ═══ 2. RESUMO DA SEMANA ═══ */}
      <div className="animate-spring-in spring-stagger-3">
        <WeeklySummary closings={closings} />
      </div>

      {/* ═══ 3. PRODUCTION FLIGHT BOARD ═══ */}
      {hasAccess('checklists') && (
        <div className="animate-spring-in spring-stagger-4">
          <ProductionFlightBoard
            report={report}
            totals={totals}
            hasOrder={hasOrder}
            isLoading={prodLoading}
            onNavigate={() => navigate('/production')}
          />
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

      <div className="h-4" />
    </div>
  );
}

/* ════════════════════════════════════════════
   PRODUCTION FLIGHT BOARD — Airport-style
   ════════════════════════════════════════════ */

function ProductionFlightBoard({
  report,
  totals,
  hasOrder,
  isLoading,
  onNavigate,
}: {
  report: ProductionReportItem[];
  totals: { done: number; ordered: number; percent: number };
  hasOrder: boolean;
  isLoading: boolean;
  onNavigate: () => void;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (isLoading) {
    return <Skeleton className="h-52 w-full rounded-2xl" />;
  }

  return (
    <button onClick={onNavigate} className="w-full text-left">
      <div className="flight-board relative overflow-hidden rounded-2xl border border-border/30">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
              Produção em Tempo Real
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground/60 tabular-nums">
              {format(now, 'HH:mm:ss')}
            </span>
            <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/30" />
          </div>
        </div>

        {!hasOrder || report.length === 0 ? (
          <div className="text-center py-8 px-4">
            <AppIcon name="Factory" size={32} className="text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum plano de produção hoje</p>
          </div>
        ) : (
          <>
            {/* KPI Strip */}
            <div className="grid grid-cols-3 gap-0 border-b border-white/[0.06]">
              <FlightKpi label="FEITAS" value={totals.done} accent={totals.done > 0 ? 'success' : undefined} />
              <FlightKpi label="PLANEJADAS" value={totals.ordered} border />
              <FlightKpi label="PROGRESSO" value={`${totals.percent}%`} accent={totals.percent >= 100 ? 'success' : totals.percent > 0 ? 'warning' : undefined} />
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_72px] gap-0 px-4 py-2 border-b border-white/[0.04] bg-white/[0.01]">
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-muted-foreground/50">PEÇA</span>
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-muted-foreground/50 text-center">QTD</span>
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-muted-foreground/50 text-right">STATUS</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/[0.04]">
              {report.map((item, idx) => (
                <FlightRow key={item.checklist_item_id} item={item} index={idx} />
              ))}
            </div>

            {/* Progress bar at bottom */}
            <div className="px-4 py-3 bg-white/[0.02] border-t border-white/[0.06]">
              <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    totals.percent >= 100 ? 'bg-success' : totals.percent > 0 ? 'bg-primary' : 'bg-muted-foreground/20'
                  )}
                  style={{ width: `${Math.min(totals.percent, 100)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </button>
  );
}

function FlightKpi({ label, value, accent, border }: { label: string; value: number | string; accent?: 'success' | 'warning'; border?: boolean }) {
  const color = accent === 'success' ? 'text-success' : accent === 'warning' ? 'text-warning' : 'text-foreground';
  return (
    <div className={cn(
      "text-center py-3 px-2",
      border && "border-x border-white/[0.06]"
    )}>
      <p className={cn("text-2xl font-black tabular-nums leading-none font-display", color)}>{value}</p>
      <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-muted-foreground/50 mt-1.5">{label}</p>
    </div>
  );
}

function FlightRow({ item, index }: { item: ProductionReportItem; index: number }) {
  const statusConfig = {
    complete: { label: 'CONCLUÍDO', bg: 'bg-success/15', text: 'text-success', dot: 'bg-success' },
    partial: { label: 'PARCIAL', bg: 'bg-warning/15', text: 'text-warning', dot: 'bg-warning' },
    in_progress: { label: 'PRODUZINDO', bg: 'bg-primary/15', text: 'text-primary', dot: 'bg-primary animate-pulse' },
    not_started: { label: 'AGUARDANDO', bg: 'bg-muted/50', text: 'text-muted-foreground', dot: 'bg-muted-foreground/40' },
  };

  const s = statusConfig[item.status];

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_80px_72px] gap-0 items-center px-4 py-2.5 transition-colors hover:bg-white/[0.02]",
        item.status === 'in_progress' && 'bg-primary/[0.03]'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Name */}
      <div className="min-w-0">
        <p className={cn(
          "text-sm font-semibold truncate",
          item.status === 'complete' ? 'text-success' : item.status === 'in_progress' || item.status === 'partial' ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {item.item_name}
        </p>
        {item.piece_dimensions && (
          <p className="text-[10px] text-muted-foreground/50 truncate">{item.piece_dimensions}</p>
        )}
      </div>

      {/* Quantity */}
      <div className="text-center">
        <span className={cn(
          "text-sm font-bold tabular-nums",
          item.status === 'complete' ? 'text-success' : item.status === 'in_progress' || item.status === 'partial' ? 'text-warning' : 'text-muted-foreground'
        )}>
          {item.quantity_done}<span className="text-muted-foreground/40">/{item.quantity_ordered}</span>
        </span>
      </div>

      {/* Status badge */}
      <div className="flex justify-end">
        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md", s.bg)}>
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
          <span className={cn("text-[8px] font-bold tracking-[0.08em] uppercase whitespace-nowrap", s.text)}>
            {s.label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Small sub-components ─── */

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
