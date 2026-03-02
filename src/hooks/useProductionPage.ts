import { useState, useMemo, useCallback, useEffect } from 'react';
import { subDays, isSameDay, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useProductionProjects } from '@/hooks/useProductionProjects';
import { useChecklists } from '@/hooks/useChecklists';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function useProductionPage() {
  const { isAdmin, user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentShift, setCurrentShift] = useState<1 | 2>(1);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const currentDate = format(selectedDate, 'yyyy-MM-dd');

  // Production orders for both shifts
  const shift1 = useProductionOrders(activeUnitId, selectedDate, 1);
  const shift2 = useProductionOrders(activeUnitId, selectedDate, 2);

  // Active shift data
  const activeShift = currentShift === 1 ? shift1 : shift2;

  // Projects
  const {
    projects, activeProjects, createProject, updateProject, deleteProject,
  } = useProductionProjects(activeUnitId);
  const activeProject = selectedProjectId
    ? activeProjects.find(p => p.id === selectedProjectId) || activeProjects[0] || null
    : activeProjects[0] || null;

  // Checklists (for sectors/items data and production actions)
  const {
    sectors, completions, completionsFetched,
    startProduction, finishProduction, updateProductionQuantity,
    fetchCompletions, isLoading: checklistsLoading,
  } = useChecklists();

  // Auto-switch to shift 2 when shift 1 is closed
  useEffect(() => {
    if (shift1.order?.status === 'closed' && currentShift === 1) {
      setCurrentShift(2);
    }
  }, [shift1.order?.status, currentShift]);

  // Fetch completions when date/shift changes
  const checklistType = currentShift === 1 ? 'abertura' as const : 'fechamento' as const;
  useEffect(() => {
    fetchCompletions(currentDate, checklistType);
  }, [currentDate, checklistType, fetchCompletions]);

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('production-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_completions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['production-completions', activeUnitId, currentDate, 1] });
        queryClient.invalidateQueries({ queryKey: ['production-completions', activeUnitId, currentDate, 2] });
        fetchCompletions(currentDate, checklistType);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['production-order', activeUnitId, currentDate] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeUnitId, currentDate, checklistType, queryClient, fetchCompletions]);

  // Date strip days
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => subDays(today, 20 - i));
  }, []);

  // Overall project progress (sum across all dates for this project)
  const projectProgress = useMemo(() => {
    // For now compute from today only — can be extended
    const t1 = shift1.totals;
    const t2 = shift2.totals;
    return {
      ordered: t1.ordered + t2.ordered,
      done: t1.done + t2.done,
      pending: t1.pending + t2.pending,
      percent: (t1.ordered + t2.ordered) > 0
        ? Math.round(((t1.done + t2.done) / (t1.ordered + t2.ordered)) * 100)
        : 0,
    };
  }, [shift1.totals, shift2.totals]);

  return {
    // Auth/unit
    isAdmin,
    user,
    activeUnitId,
    // Date
    selectedDate,
    setSelectedDate,
    currentDate,
    days,
    // Shifts
    currentShift,
    setCurrentShift,
    shift1,
    shift2,
    activeShift,
    checklistType,
    // Project
    projects,
    activeProjects,
    activeProject,
    selectedProjectId,
    setSelectedProjectId,
    createProject,
    updateProject,
    deleteProject,
    projectProgress,
    // Checklists data
    sectors,
    completions,
    completionsFetched,
    checklistsLoading,
    // Production actions
    startProduction,
    finishProduction,
    updateProductionQuantity,
    fetchCompletions,
  };
}
