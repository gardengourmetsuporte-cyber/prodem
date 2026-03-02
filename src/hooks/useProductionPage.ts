import { useState, useMemo, useCallback, useEffect } from 'react';
import { subDays, isSameDay, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useProductionProjects } from '@/hooks/useProductionProjects';
import { useChecklists } from '@/hooks/useChecklists';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';

export function useProductionPage() {
  const { isAdmin, user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentShift, setCurrentShift] = useState<1 | 2>(1);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const currentDate = format(selectedDate, 'yyyy-MM-dd');

  // Projects (must come before orders so we can filter by project)
  const {
    projects, activeProjects: allActiveProjects, createProject, updateProject, deleteProject,
  } = useProductionProjects(activeUnitId);

  // Query which project IDs have production orders on the selected date
  const { data: dateProjectIds = [] } = useQuery({
    queryKey: ['production-date-project-ids', activeUnitId, currentDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_orders')
        .select('project_id')
        .eq('unit_id', activeUnitId!)
        .eq('date', currentDate)
        .not('project_id', 'is', null);
      if (error) throw error;
      return [...new Set((data || []).map(d => d.project_id).filter(Boolean))] as string[];
    },
    enabled: !!activeUnitId,
  });

  // Filter: show projects that have orders on this date, plus active projects without ANY orders yet (new projects)
  const { data: projectsWithOrders = [] } = useQuery({
    queryKey: ['production-projects-with-orders', activeUnitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_orders')
        .select('project_id')
        .eq('unit_id', activeUnitId!)
        .not('project_id', 'is', null);
      if (error) throw error;
      return [...new Set((data || []).map(d => d.project_id).filter(Boolean))] as string[];
    },
    enabled: !!activeUnitId,
  });

  const activeProjects = useMemo(() => {
    return allActiveProjects.filter(p =>
      dateProjectIds.includes(p.id) || !projectsWithOrders.includes(p.id)
    );
  }, [allActiveProjects, dateProjectIds, projectsWithOrders]);

  const activeProject = selectedProjectId
    ? activeProjects.find(p => p.id === selectedProjectId) || activeProjects[0] || null
    : activeProjects[0] || null;

  // Production orders for both shifts — filtered by active project
  const currentProjectId = activeProject?.id || null;
  const shift1 = useProductionOrders(activeUnitId, selectedDate, 1, currentProjectId);
  const shift2 = useProductionOrders(activeUnitId, selectedDate, 2, currentProjectId);

  // Active shift data
  const activeShift = currentShift === 1 ? shift1 : shift2;

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
        queryClient.invalidateQueries({ queryKey: ['production-completions'] });
        fetchCompletions(currentDate, checklistType);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['production-order'] });
        queryClient.invalidateQueries({ queryKey: ['production-date-project-ids'] });
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
    const totalOrdered = shift1.totals.ordered || shift2.totals.ordered;
    const totalDone = shift1.totals.done + shift2.totals.done;
    const totalPending = Math.max(0, totalOrdered - totalDone);
    return {
      ordered: totalOrdered,
      done: totalDone,
      pending: totalPending,
      percent: totalOrdered > 0 ? Math.round((totalDone / totalOrdered) * 100) : 0,
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
    allActiveProjects,
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
