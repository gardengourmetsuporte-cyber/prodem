import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { useLazyVisible } from '@/hooks/useLazyVisible';
import { DashboardWidgetManager } from './DashboardWidgetManager';
import { DashboardHeroFinance } from './DashboardHeroFinance';
import { DashboardKPIGrid } from './DashboardKPIGrid';
import { DashboardSection } from './DashboardSection';
import { FinanceChartWidget } from './FinanceChartWidget';
import { BillsDueWidget } from './BillsDueWidget';
import { AIInsightsWidget } from './AIInsightsWidget';
import { PendingOrdersWidget } from './PendingOrdersWidget';
import { QuoteRequestsWidget } from './QuoteRequestsWidget';
import { AppIcon } from '@/components/ui/app-icon';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LazyLeaderboard = lazy(() => import('./LazyLeaderboardWidget'));
const LazyCalendar = lazy(() => import('./UnifiedCalendarWidget').then(m => ({ default: m.UnifiedCalendarWidget })));
const LazyChecklist = lazy(() => import('./ChecklistDashboardWidget').then(m => ({ default: m.ChecklistDashboardWidget })));
const LazyAgenda = lazy(() => import('./AgendaDashboardWidget').then(m => ({ default: m.AgendaDashboardWidget })));
const LazyWeeklySummary = lazy(() => import('./LazyWeeklySummaryWidget'));
const LazyAutoOrder = lazy(() => import('./AutoOrderWidget').then(m => ({ default: m.AutoOrderWidget })));
const LazyCashFlow = lazy(() => import('../finance/CashFlowProjection').then(m => ({ default: m.CashFlowProjection })));

function LazyWidget({ children }: { children: React.ReactNode }) {
  const { ref, visible } = useLazyVisible('300px');
  return (
    <div ref={ref}>
      {visible ? (
        <Suspense fallback={<Skeleton className="h-32 w-full rounded-2xl" />}>{children}</Suspense>
      ) : (
        <Skeleton className="h-32 w-full rounded-2xl" />
      )}
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { hasAccess, isLoading: modulesLoading } = useUserModules();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { widgets, setWidgets, resetDefaults, isVisible } = useDashboardWidgets();
  const [managerOpen, setManagerOpen] = useState(false);

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

  return (
    <div className="space-y-4 px-4 py-3 lg:px-6">
      {/* Welcome */}
      <div className="animate-spring-in spring-stagger-1">
        <h2 className="text-xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>
          {greeting}, {firstName} 👋
        </h2>
        <p className="text-muted-foreground text-xs capitalize mt-0.5">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Hero Finance */}
      {hasAccess('finance') && isVisible('finance') && (
        <DashboardHeroFinance
          balance={stats.monthBalance}
          pendingExpenses={stats.pendingExpenses}
          isLoading={statsLoading}
        />
      )}

      {/* KPI Grid */}
      <DashboardKPIGrid
        stats={stats}
        isLoading={statsLoading}
        hasAccess={hasAccess}
        isVisible={isVisible}
      />

      {/* Checklists / Produção */}
      {hasAccess('checklists') && isVisible('checklist') && (
        <DashboardSection title="Produção" icon="Factory" iconColor="text-amber-400" onNavigate={() => navigate('/checklists')}>
          <LazyWidget><LazyChecklist /></LazyWidget>
        </DashboardSection>
      )}

      {/* Orçamentos Recebidos */}
      {isVisible('quote-requests') && (
        <DashboardSection title="Orçamentos recebidos" icon="FileText" iconColor="text-orange-400">
          <QuoteRequestsWidget />
        </DashboardSection>
      )}

      {/* Finance Chart */}
      {hasAccess('finance') && isVisible('finance-chart') && (
        <DashboardSection title="Despesas do mês" icon="BarChart3" iconColor="text-emerald-400" onNavigate={() => navigate('/finance')}>
          <FinanceChartWidget />
        </DashboardSection>
      )}

      {/* Bills Due */}
      {hasAccess('finance') && isVisible('bills-due') && (stats.billsDueSoon?.length ?? 0) > 0 && (
        <DashboardSection title="Contas a vencer" icon="AlertTriangle" iconColor="text-amber-400" onNavigate={() => navigate('/finance')}>
          <BillsDueWidget bills={stats.billsDueSoon || []} />
        </DashboardSection>
      )}

      {/* Weekly Summary */}
      {hasAccess('cash-closing') && isVisible('weekly-summary') && (
        <DashboardSection title="Resumo semanal" icon="Calendar" iconColor="text-blue-400" onNavigate={() => navigate('/cash-closing')}>
          <LazyWidget><LazyWeeklySummary /></LazyWidget>
        </DashboardSection>
      )}

      {/* AI Insights */}
      {isVisible('ai-insights') && (
        <DashboardSection title="Insights da IA" icon="Sparkles" iconColor="text-purple-400">
          <AIInsightsWidget />
        </DashboardSection>
      )}

      {/* Calendar */}
      {hasAccess('agenda') && isVisible('calendar') && (
        <DashboardSection title="Calendário" icon="CalendarDays" iconColor="text-indigo-400" onNavigate={() => navigate('/calendar')}>
          <LazyWidget><LazyCalendar /></LazyWidget>
        </DashboardSection>
      )}

      {/* Agenda */}
      {hasAccess('agenda') && isVisible('agenda') && (
        <DashboardSection title="Agenda" icon="ListTodo" iconColor="text-violet-400" onNavigate={() => navigate('/agenda')}>
          <LazyWidget><LazyAgenda /></LazyWidget>
        </DashboardSection>
      )}

      {/* Pending Orders */}
      {hasAccess('orders') && isVisible('pending-orders') && (
        <DashboardSection title="Pedidos pendentes" icon="ShoppingCart" iconColor="text-orange-400" onNavigate={() => navigate('/orders')}>
          <PendingOrdersWidget />
        </DashboardSection>
      )}

      {/* Auto Order */}
      {hasAccess('inventory') && isVisible('auto-order') && (
        <DashboardSection title="Sugestão de compras" icon="TrendingUp" iconColor="text-cyan-400" onNavigate={() => navigate('/inventory')}>
          <LazyWidget><LazyAutoOrder /></LazyWidget>
        </DashboardSection>
      )}

      {/* Leaderboard */}
      {hasAccess('ranking') && isVisible('leaderboard') && (
        <DashboardSection title="Ranking" icon="Trophy" iconColor="text-yellow-400" onNavigate={() => navigate('/ranking')}>
          <LazyWidget><LazyLeaderboard currentUserId={user?.id} /></LazyWidget>
        </DashboardSection>
      )}

      {/* Cash Flow */}
      {hasAccess('finance') && isVisible('cash-flow') && (
        <DashboardSection title="Fluxo de caixa projetado" icon="TrendingUp" iconColor="text-teal-400" onNavigate={() => navigate('/finance')}>
          <LazyWidget><LazyCashFlow totalBalance={stats.monthBalance ?? 0} /></LazyWidget>
        </DashboardSection>
      )}

      {/* Manage button */}
      <button
        onClick={() => setManagerOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <AppIcon name="Settings" size={16} />
        Gerenciar tela inicial
      </button>

      <DashboardWidgetManager
        open={managerOpen}
        onOpenChange={setManagerOpen}
        widgets={widgets}
        onSave={setWidgets}
        onReset={resetDefaults}
      />
    </div>
  );
}
