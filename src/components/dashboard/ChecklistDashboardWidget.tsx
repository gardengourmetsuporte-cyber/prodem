import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { getTodayDateStr } from '@/lib/checklistTiming';

export function ChecklistDashboardWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const today = getTodayDateStr();

  const { data: sectors = [] } = useQuery({
    queryKey: ['dashboard-checklist-sectors', activeUnitId],
    queryFn: async () => {
      let query = supabase
        .from('checklist_sectors')
        .select(`*, subcategories:checklist_subcategories(*, items:checklist_items(*))`)
        .eq('scope', 'standard')
        .order('sort_order');
      if (activeUnitId) query = query.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data } = await query;
      return (data || []).map((s: any) => ({
        ...s,
        subcategories: (s.subcategories || []).map((sub: any) => ({
          ...sub,
          items: (sub.items || []).filter((i: any) => i.deleted_at === null),
        })),
      }));
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['dashboard-checklist-completions-all', today, activeUnitId],
    queryFn: async () => {
      let query = supabase.from('checklist_completions').select('item_id').eq('date', today);
      if (activeUnitId) query = query.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data } = await query;
      return data || [];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 30 * 1000,
  });

  const progress = useMemo(() => {
    const completedIds = new Set(completions.map((c: any) => c.item_id));
    let total = 0;
    let completed = 0;
    sectors.forEach((s: any) => {
      s.subcategories?.forEach((sub: any) => {
        sub.items?.forEach((item: any) => {
          if (item.is_active && item.checklist_type !== 'bonus') {
            total++;
            if (completedIds.has(item.id)) completed++;
          }
        });
      });
    });
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }, [sectors, completions]);

  const isComplete = progress.percent === 100;

  return (
    <button
      onClick={() => navigate('/checklists')}
      className="w-full text-left rounded-2xl p-4 bg-card transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          isComplete ? "bg-success/20" : "bg-warning/20"
        )}>
          <AppIcon name="ClipboardCheck" size={20} className={cn(isComplete ? "text-success" : "text-warning")} />
        </div>
        <div className="flex-1">
          <span className={cn(
            "text-base font-bold block font-display",
            isComplete ? "text-success" : "text-foreground"
          )}>
            Checklist do Dia
          </span>
          <span className={cn(
            "text-[11px] font-medium",
            isComplete ? "text-success" : progress.percent > 0 ? "text-warning" : "text-muted-foreground"
          )}>
            {isComplete ? "✓ Concluído" : progress.percent > 0 ? "Em andamento" : "Pendente"}
          </span>
        </div>
        <span className={cn(
          "text-2xl font-black",
          isComplete ? "text-success" : "text-warning"
        )}>
          {progress.percent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden mb-2">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            isComplete ? "bg-success" : "bg-warning"
          )}
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <span className="text-xs text-muted-foreground">
        {progress.completed} de {progress.total} itens concluídos
      </span>
    </button>
  );
}
