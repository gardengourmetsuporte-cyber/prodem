import { useState, useEffect, useCallback } from 'react';
import { useScrollToTopOnChange } from '@/components/ScrollToTop';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { MyRankCard } from '@/components/ranking/MyRankCard';
import { EloList } from '@/components/profile/EloList';
import { MedalList } from '@/components/profile/MedalList';
import { MedalWinners } from '@/components/profile/MedalWinners';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { usePoints } from '@/hooks/usePoints';
import { useLeaderboard, LeaderboardScope } from '@/hooks/useLeaderboard';
import { calculateMedals } from '@/lib/medals';
import { cn } from '@/lib/utils';

type TabKey = 'ranking' | 'elos' | 'medalhas';

/** Fetch global medal unlock status for the entire unit */
function useGlobalMedals(unitId: string | null) {
  return useQuery({
    queryKey: ['global-medals', unitId],
    queryFn: async () => {
      const [{ data: empOfMonth }, { data: inventors }, { data: employees }] = await Promise.all([
        supabase.from('bonus_points').select('id').eq('badge_id', 'employee_of_month').eq('unit_id', unitId!).limit(1),
        supabase.from('bonus_points').select('id').eq('badge_id', 'inventor').eq('unit_id', unitId!).limit(1),
        supabase.from('employees').select('admission_date').eq('unit_id', unitId!).not('admission_date', 'is', null).limit(1000),
      ]);

      const admissionDates = (employees || []).map(e => e.admission_date).filter(Boolean) as string[];
      const earliest = admissionDates.length > 0 ? admissionDates.sort()[0] : null;

      return calculateMedals({
        hasEmployeeOfMonth: (empOfMonth || []).length > 0,
        admissionDate: earliest,
        hasInventedRecipe: (inventors || []).length > 0,
      });
    },
    enabled: !!unitId,
  });
}

export default function Ranking() {
  const { user, profile } = useAuth();
  const { activeUnitId, activeUnit } = useUnit();
  const { earned, balance, monthlyScore, refetch: refetchPoints } = usePoints();
  const [rankingScope, setRankingScope] = useState<LeaderboardScope>('unit');
  const { leaderboard, isLoading, selectedMonth, setSelectedMonth, refetch: refetchLeaderboard } = useLeaderboard(rankingScope);
  const { data: globalMedals } = useGlobalMedals(activeUnitId);
  const [activeTab, setActiveTab] = useState<TabKey>('ranking');
  useScrollToTopOnChange(activeTab);
  const [mountRefreshed, setMountRefreshed] = useState(false);

  useEffect(() => {
    const forceRefresh = async () => {
      await Promise.all([refetchPoints(), refetchLeaderboard()]);
      setMountRefreshed(true);
    };
    forceRefresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const myPosition = leaderboard.find(e => e.user_id === user?.id)?.rank;

  const [syncing, setSyncing] = useState(false);
  const handleSync = useCallback(async () => {
    setSyncing(true);
    await refetchLeaderboard();
    await refetchPoints();
    setSyncing(false);
    toast.success('Ranking atualizado!');
  }, [refetchPoints, refetchLeaderboard]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-4">
          <MyRankCard
            fullName={profile?.full_name || 'Usuário'}
            avatarUrl={profile?.avatar_url}
            earnedPoints={earned}
            monthlyScore={monthlyScore}
            accumulatedBalance={balance}
            leaderboardPosition={myPosition}
          />

          <AnimatedTabs
            tabs={[
              { key: 'ranking', label: 'Ranking', icon: <AppIcon name="Trophy" size={14} /> },
              { key: 'elos', label: 'Patentes', icon: <AppIcon name="Shield" size={14} /> },
              { key: 'medalhas', label: 'Medalhas', icon: <AppIcon name="Medal" size={14} /> },
            ]}
            activeTab={activeTab}
            onTabChange={(key) => setActiveTab(key as TabKey)}
          />

          <div className="animate-fade-in" key={activeTab}>
            {activeTab === 'ranking' && (
              <div className="space-y-3">
                {/* Sub-tabs: Minha Casa / Global */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setRankingScope('unit')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                      rankingScope === 'unit'
                        ? "text-white shadow-sm"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                    style={rankingScope === 'unit' ? { background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.15))' } : undefined}
                  >
                    <AppIcon name="Home" size={12} />
                    {activeUnit?.name || 'Minha Unidade'}
                  </button>
                  <button
                    onClick={() => setRankingScope('global')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                      rankingScope === 'global'
                        ? "text-white shadow-sm"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                    style={rankingScope === 'global' ? { background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.15))' } : undefined}
                  >
                    <AppIcon name="Globe" size={12} />
                    Global
                  </button>
                </div>

                <Leaderboard
                  entries={leaderboard}
                  currentUserId={user?.id}
                  isLoading={isLoading}
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  onRefresh={handleSync}
                  isSyncing={syncing}
                  showUnitBadge={rankingScope === 'global'}
                />
              </div>
            )}
            {activeTab === 'elos' && <EloList earnedPoints={earned} />}
            {activeTab === 'medalhas' && globalMedals && (
              <>
                <MedalList medals={globalMedals} />
                <MedalWinners />
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
