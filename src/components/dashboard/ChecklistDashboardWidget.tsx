import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { getCurrentChecklistType, getDeadlineInfo, getTodayDateStr } from '@/lib/checklistTiming';
import { useChecklistDeadlines } from '@/hooks/useChecklistDeadlines';

type ChecklistType = 'abertura' | 'fechamento';

export function ChecklistDashboardWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const today = getTodayDateStr();
  const { settings: deadlineSettings } = useChecklistDeadlines();
  const activeType = getCurrentChecklistType(deadlineSettings);

  // Countdown labels, updated every 30s
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  useEffect(() => {
    const update = () => {
      const ab = getDeadlineInfo(today, 'abertura', deadlineSettings);
      const fe = getDeadlineInfo(today, 'fechamento', deadlineSettings);
      setCountdowns({
        abertura: ab?.label || '',
        fechamento: fe?.label || '',
      });
    };
    update();
    const iv = setInterval(update, 30_000);
    return () => clearInterval(iv);
  }, [today, deadlineSettings]);

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

  const { data: aberturaCompletions = [] } = useQuery({
    queryKey: ['dashboard-checklist-completions', today, 'abertura', activeUnitId],
    queryFn: async () => {
      let query = supabase.from('checklist_completions').select('item_id').eq('date', today).eq('checklist_type', 'abertura');
      if (activeUnitId) query = query.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data } = await query;
      return data || [];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 30 * 1000,
  });

  const { data: fechamentoCompletions = [] } = useQuery({
    queryKey: ['dashboard-checklist-completions', today, 'fechamento', activeUnitId],
    queryFn: async () => {
      let query = supabase.from('checklist_completions').select('item_id').eq('date', today).eq('checklist_type', 'fechamento');
      if (activeUnitId) query = query.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data } = await query;
      return data || [];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 30 * 1000,
  });

  const getProgress = useMemo(() => {
    return (type: ChecklistType, completions: any[]) => {
      // Cross-shift: merge all completions from both shifts
      const allCompletedIds = new Set([
        ...aberturaCompletions.map((c: any) => c.item_id),
        ...fechamentoCompletions.map((c: any) => c.item_id),
      ]);
      let total = 0;
      let completed = 0;
      sectors.forEach((s: any) => {
        s.subcategories?.forEach((sub: any) => {
          sub.items?.forEach((item: any) => {
            // Count all standard (non-bonus) items
            if (item.is_active && item.checklist_type !== 'bonus') {
              total++;
              if (allCompletedIds.has(item.id)) completed++;
            }
          });
        });
      });
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { completed, total, percent };
    };
  }, [sectors, aberturaCompletions, fechamentoCompletions]);

  const abertura = getProgress('abertura', aberturaCompletions);
  const fechamento = getProgress('fechamento', fechamentoCompletions);

  const cards: { type: ChecklistType; label: string; iconName: string; progress: typeof abertura; accentColor: string; accentBg: string; textColor: string }[] = [
    {
      type: 'abertura',
      label: 'Abertura',
      iconName: 'Sun',
      progress: abertura,
      accentColor: 'text-orange-400',
      accentBg: 'bg-orange-500/70',
      textColor: 'text-orange-400',
    },
    {
      type: 'fechamento',
      label: 'Fechamento',
      iconName: 'Moon',
      progress: fechamento,
      accentColor: 'text-primary',
      accentBg: 'bg-primary/40',
      textColor: 'text-primary',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 animate-slide-up stagger-3">
      {cards.map((card) => {
        const isActive = card.type === activeType;
        const isComplete = card.progress.percent === 100;
        const deadlineInfo = getDeadlineInfo(today, card.type, deadlineSettings);

        return (
          <button
            key={card.type}
            onClick={() => navigate('/checklists')}
            className={cn(
              "relative text-left rounded-2xl p-4 transition-all duration-200",
              "bg-card border-0"
            )}
          >
            {/* Active dot indicator */}
            {isActive && (
              <div className={cn("absolute top-3 right-3 w-2.5 h-2.5 rounded-full", card.accentBg, "animate-pulse")} />
            )}

            {/* Icon + Label */}
            <div className="flex items-center gap-2.5 mb-1">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isComplete ? "bg-success/20" : card.accentBg
              )}>
                <AppIcon name={card.iconName} size={20} className={cn(isComplete ? "text-success" : "text-white")} />
              </div>
              <div>
                <span className={cn(
                  "text-base font-bold block font-display",
                  isComplete ? "text-success" : "text-foreground"
                )} style={{ letterSpacing: '-0.02em' }}>
                  {card.label}
                </span>
                <span className={cn(
                  "text-[11px] font-medium",
                  isComplete
                    ? "text-success"
                    : card.progress.percent > 0
                      ? card.textColor
                      : "text-muted-foreground"
                )}>
                  {isComplete
                    ? "✓ Concluído"
                    : card.progress.percent > 0
                      ? "Em andamento"
                      : "Pendente"}
                </span>
              </div>
            </div>

            {/* Countdown chip */}
            {deadlineInfo && (
              <div className={cn(
                "mt-1.5 mb-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full inline-block",
                deadlineInfo.passed
                  ? "bg-destructive/15 text-destructive"
                  : "bg-muted text-muted-foreground"
              )}>
                {deadlineInfo.passed ? '⏰ Encerrado' : `⏳ ${countdowns[card.type] || deadlineInfo.label}`}
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-secondary/50 overflow-hidden mb-3 mt-2">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                    isComplete
                      ? "bg-success"
                      : card.type === 'abertura'
                        ? "bg-orange-500"
                        : "bg-primary"
                )}
                style={{ width: `${card.progress.percent}%` }}
              />
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {card.progress.completed}/{card.progress.total}
              </span>
              <span className={cn(
                "text-lg font-black",
                isComplete ? "text-success" : card.textColor
              )}>
                {card.progress.percent}%
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
