import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { format } from 'date-fns';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TeamMemberActivity {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  totalDone: number;
  isActive: boolean; // has an in-progress item
}

export function TeamActivityWidget() {
  const { activeUnitId } = useUnit();
  const dateStr = format(new Date(), 'yyyy-MM-dd');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-activity', activeUnitId, dateStr],
    queryFn: async () => {
      if (!activeUnitId) return [];

      // Get all completions for today in this unit
      const { data: completions, error } = await supabase
        .from('checklist_completions')
        .select('completed_by, quantity_done, status, is_skipped')
        .eq('date', dateStr)
        .eq('unit_id', activeUnitId);

      if (error) throw error;
      if (!completions || completions.length === 0) return [];

      // Aggregate by user
      const userMap = new Map<string, { totalDone: number; isActive: boolean }>();
      completions.forEach(c => {
        if (c.is_skipped) return;
        const existing = userMap.get(c.completed_by) || { totalDone: 0, isActive: false };
        existing.totalDone += c.quantity_done ?? 0;
        if (c.status === 'in_progress') existing.isActive = true;
        userMap.set(c.completed_by, existing);
      });

      const userIds = [...userMap.keys()];
      if (userIds.length === 0) return [];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
      (profiles || []).forEach(p => profileMap.set(p.user_id, p));

      const result: TeamMemberActivity[] = [];
      userMap.forEach((data, userId) => {
        const profile = profileMap.get(userId);
        if (!profile) return;
        result.push({
          userId,
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          totalDone: data.totalDone,
          isActive: data.isActive,
        });
      });

      // Sort by totalDone descending
      result.sort((a, b) => b.totalDone - a.totalDone);
      return result;
    },
    enabled: !!activeUnitId,
    staleTime: 30_000,
  });

  if (isLoading) return <Skeleton className="h-24 w-full rounded-2xl" />;

  if (members.length === 0) {
    return (
      <div className="card-surface p-5 text-center">
        <AppIcon name="Users" size={24} className="mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma atividade registrada hoje</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {members.map(m => (
        <div key={m.userId} className="card-surface px-3.5 py-2.5 flex items-center gap-3">
          {/* Status dot */}
          <div className={cn(
            "w-2 h-2 rounded-full shrink-0",
            m.isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
          )} />

          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{m.fullName}</p>
            <p className="text-[10px] text-muted-foreground">
              {m.isActive ? 'Em produção' : 'Concluiu tarefas'}
            </p>
          </div>

          {/* Pieces done */}
          <div className="text-right shrink-0">
            <p className="text-sm font-bold tabular-nums text-foreground">{m.totalDone}</p>
            <p className="text-[10px] text-muted-foreground">peças</p>
          </div>
        </div>
      ))}
    </div>
  );
}
