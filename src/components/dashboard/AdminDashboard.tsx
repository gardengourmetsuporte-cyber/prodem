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
import { ProductionProgressWidget } from './ProductionProgressWidget';
import { AlertsSummaryWidget } from './AlertsSummaryWidget';
import { FinanceChartWidget } from './FinanceChartWidget';
import { QuoteRequestsWidget } from './QuoteRequestsWidget';
import { AppIcon } from '@/components/ui/app-icon';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LazyLeaderboard = lazy(() => import('./LazyLeaderboardWidget'));
const LazyAgenda = lazy(() => import('./AgendaDashboardWidget').then(m => ({ default: m.AgendaDashboardWidget })));

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

      {/* 🏭 PRODUÇÃO — always first */}
      {hasAccess('checklists') && isVisible('checklist') && (
        <DashboardSection title="Produção hoje" icon="Factory" iconColor="text-amber-400" onNavigate={() => navigate('/checklists')}>
          <ProductionProgressWidget variant="compact" />
        </DashboardSection>
      )}

      {/* 💰 FINANCEIRO */}
      {hasAccess('finance') && isVisible('finance') && (
        <div className="animate-spring-in">
          <DashboardHeroFinance
            balance={stats.monthBalance}
            pendingExpenses={stats.pendingExpenses}
            isLoading={statsLoading}
          />
        </div>
      )}

      {/* ⚠️ ALERTAS */}
      <DashboardSection title="Alertas" icon="AlertTriangle" iconColor="text-red-400">
        <AlertsSummaryWidget />
      </DashboardSection>

      {/* Orçamentos Recebidos */}
      {isVisible('quote-requests') && (
        <DashboardSection title="Orçamentos recebidos" icon="FileText" iconColor="text-orange-400" onNavigate={() => navigate('/orders')}>
          <QuoteRequestsWidget />
        </DashboardSection>
      )}

      {/* Finance Chart */}
      {hasAccess('finance') && isVisible('finance-chart') && (
        <DashboardSection title="Gráfico financeiro" icon="BarChart3" iconColor="text-blue-400" onNavigate={() => navigate('/finance')}>
          <FinanceChartWidget />
        </DashboardSection>
      )}

      {/* Agenda */}
      {hasAccess('agenda') && isVisible('agenda') && (
        <DashboardSection title="Agenda" icon="CalendarDays" iconColor="text-indigo-400" onNavigate={() => navigate('/agenda')}>
          <LazyWidget><LazyAgenda /></LazyWidget>
        </DashboardSection>
      )}

      {/* Leaderboard */}
      {hasAccess('ranking') && isVisible('leaderboard') && (
        <DashboardSection title="Ranking" icon="Trophy" iconColor="text-yellow-400" onNavigate={() => navigate('/ranking')}>
          <LazyWidget><LazyLeaderboard currentUserId={user?.id} /></LazyWidget>
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
