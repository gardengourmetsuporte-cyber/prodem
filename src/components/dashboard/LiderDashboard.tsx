import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useLazyVisible } from '@/hooks/useLazyVisible';
import { DashboardSection } from './DashboardSection';
import { ProductionProgressWidget } from './ProductionProgressWidget';
import { TeamActivityWidget } from './TeamActivityWidget';
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

export function LiderDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { hasAccess, isLoading: modulesLoading } = useUserModules();

  const isReady = !modulesLoading && !!profile;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const firstName = profile?.full_name?.split(' ')[0] || 'Líder';

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
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>
            {greeting}, {firstName} 👋
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
            Líder
          </span>
        </div>
        <p className="text-muted-foreground text-xs capitalize mt-0.5">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* 🏭 PRODUÇÃO DO DIA — detailed */}
      {hasAccess('checklists') && (
        <DashboardSection title="Produção do dia" icon="Factory" iconColor="text-amber-400" onNavigate={() => navigate('/checklists')}>
          <ProductionProgressWidget variant="detailed" />
        </DashboardSection>
      )}

      {/* 👥 EQUIPE ATIVA */}
      <DashboardSection title="Equipe ativa" icon="Users" iconColor="text-blue-400">
        <TeamActivityWidget />
      </DashboardSection>

      {/* Agenda */}
      {hasAccess('agenda') && (
        <DashboardSection title="Agenda do setor" icon="CalendarDays" iconColor="text-indigo-400" onNavigate={() => navigate('/agenda')}>
          <LazyWidget><LazyAgenda /></LazyWidget>
        </DashboardSection>
      )}

      {/* Leaderboard */}
      {hasAccess('ranking') && (
        <DashboardSection title="Ranking da equipe" icon="Trophy" iconColor="text-yellow-400" onNavigate={() => navigate('/ranking')}>
          <LazyWidget><LazyLeaderboard currentUserId={user?.id} /></LazyWidget>
        </DashboardSection>
      )}
    </div>
  );
}
