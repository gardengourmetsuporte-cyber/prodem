import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { usePoints } from '@/hooks/usePoints';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useCountUp } from '@/hooks/useCountUp';
import { ProductionProgressWidget } from './ProductionProgressWidget';
import { DashboardSection } from './DashboardSection';
import { EmployeeCheckInCard } from '@/components/employees/TimeTracking';
import { AppIcon } from '@/components/ui/app-icon';
import { formatPoints } from '@/lib/points';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { activeUnit } = useUnit();
  const { monthlyScore, balance } = usePoints();
  const { todayRecord, checkIn, checkOut } = useTimeTracking();
  const { leaderboard } = useLeaderboard('unit');

  const animatedMonthly = useCountUp(monthlyScore);
  const animatedBalance = useCountUp(balance);

  const myPosition = leaderboard.find(e => e.user_id === user?.id)?.rank;
  const firstName = profile?.full_name?.split(' ')[0] || 'Colaborador';

  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-4 px-4 py-3 lg:px-6">
      {/* Welcome */}
      <div className="animate-spring-in spring-stagger-1">
        <h2 className="text-xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>
          {getGreeting()}, {firstName}!
        </h2>
        <p className="text-muted-foreground text-xs capitalize mt-0.5">{formattedDate}</p>
      </div>

      {/* Ponto Eletrônico */}
      <div className="animate-spring-in spring-stagger-2">
        <EmployeeCheckInCard todayRecord={todayRecord} onCheckIn={checkIn} onCheckOut={checkOut} />
      </div>

      {/* 🏭 Minha Produção Hoje */}
      <DashboardSection title="Minha produção hoje" icon="Factory" iconColor="text-amber-400" onNavigate={() => navigate('/checklists')}>
        <ProductionProgressWidget variant="detailed" userId={user?.id} />
      </DashboardSection>

      {/* 🏆 Score compacto */}
      <div className="animate-spring-in card-surface p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <AppIcon name="Trophy" size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Meu Score</p>
            <p className="text-[11px] text-muted-foreground">
              {myPosition ? `#${myPosition} no ranking` : 'Ranking disponível'}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-lg font-extrabold tabular-nums text-foreground leading-none">{animatedMonthly}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">pts/mês</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-extrabold tabular-nums text-foreground leading-none">{animatedBalance}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">saldo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
