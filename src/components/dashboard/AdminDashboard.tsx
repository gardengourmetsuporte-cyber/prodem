import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { useLazyVisible } from '@/hooks/useLazyVisible';
import { DashboardWidgetManager } from './DashboardWidgetManager';
import { DashboardHeroFinance } from './DashboardHeroFinance';
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

      {/* Checklists / Produção */}
      {hasAccess('checklists') && isVisible('checklist') && (
        <div className="animate-spring-in">
          <LazyWidget><LazyChecklist /></LazyWidget>
        </div>
      )}

      {/* Orçamentos Recebidos */}
      {isVisible('quote-requests') && (
        <div className="animate-spring-in">
          <QuoteRequestsWidget />
        </div>
      )}

      {/* Finance Chart */}
      {hasAccess('finance') && isVisible('finance-chart') && (
        <div className="animate-spring-in">
          <FinanceChartWidget />
        </div>
      )}

      {/* Bills Due */}
      {hasAccess('finance') && isVisible('bills-due') && (stats.billsDueSoon?.length ?? 0) > 0 && (
        <div className="animate-spring-in">
          <BillsDueWidget bills={stats.billsDueSoon || []} />
        </div>
      )}

      {/* Weekly Summary */}
      {hasAccess('cash-closing') && isVisible('weekly-summary') && (
        <div className="animate-spring-in">
          <LazyWidget><LazyWeeklySummary /></LazyWidget>
        </div>
      )}

      {/* Agenda */}
      {hasAccess('agenda') && isVisible('agenda') && (
        <div className="animate-spring-in">
          <LazyWidget><LazyAgenda /></LazyWidget>
        </div>
      )}

      {/* Leaderboard */}
      {hasAccess('ranking') && isVisible('leaderboard') && (
        <div className="animate-spring-in">
          <LazyWidget><LazyLeaderboard currentUserId={user?.id} /></LazyWidget>
        </div>
      )}

      {/* Cash Flow */}
      {hasAccess('finance') && isVisible('cash-flow') && (
        <div className="animate-spring-in">
          <LazyWidget><LazyCashFlow totalBalance={stats.monthBalance ?? 0} /></LazyWidget>
        </div>
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
