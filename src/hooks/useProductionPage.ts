import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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

  // Query which project IDs have ANY production orders (to distinguish "new" projects)
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

  // Query pending status for projects that have orders but NOT on the selected date
  // This checks if a project's total production is complete (no pending items across ALL dates)
  const projectsToCheck = useMemo(() => {
    return allActiveProjects
      .filter(p => projectsWithOrders.includes(p.id) && !dateProjectIds.includes(p.id))
      .map(p => p.id);
  }, [allActiveProjects, projectsWithOrders, dateProjectIds]);

  const { data: completedProjectIds = [] } = useQuery({
    queryKey: ['production-completed-projects', activeUnitId, projectsToCheck],
    queryFn: async () => {
      if (projectsToCheck.length === 0) return [];

      // Get all orders for candidate projects
      const { data: projectOrders, error: poErr } = await supabase
        .from('production_orders')
        .select('id, project_id, date')
        .eq('unit_id', activeUnitId!)
        .in('project_id', projectsToCheck);
      if (poErr) throw poErr;
      if (!projectOrders || projectOrders.length === 0) return [];

      // Latest production date per project
      const latestDateByProject = new Map<string, string>();
      projectOrders.forEach(o => {
        if (!o.project_id) return;
        const prev = latestDateByProject.get(o.project_id);
        if (!prev || o.date > prev) latestDateByProject.set(o.project_id, o.date);
      });

      // Keep only orders from each project's latest date
      const latestOrderIds: string[] = [];
      const orderIdToProject = new Map<string, string>();
      projectOrders.forEach(o => {
        if (!o.project_id) return;
        const latestDate = latestDateByProject.get(o.project_id);
        if (latestDate && o.date === latestDate) {
          latestOrderIds.push(o.id);
          orderIdToProject.set(o.id, o.project_id);
        }
      });

      if (latestOrderIds.length === 0) return [];

      const { data: latestItems, error: liErr } = await supabase
        .from('production_order_items')
        .select('order_id, checklist_item_id, quantity_ordered')
        .in('order_id', latestOrderIds);
      if (liErr) throw liErr;
      if (!latestItems || latestItems.length === 0) return [];

      // Aggregate ordered qty for latest day per project
      const orderedByProjectItem = new Map<string, Map<string, number>>();
      const allItemIds = new Set<string>();
      latestItems.forEach(item => {
        const pid = orderIdToProject.get(item.order_id);
        if (!pid) return;

        if (!orderedByProjectItem.has(pid)) orderedByProjectItem.set(pid, new Map());
        const itemMap = orderedByProjectItem.get(pid)!;
        itemMap.set(item.checklist_item_id, (itemMap.get(item.checklist_item_id) || 0) + item.quantity_ordered);
        allItemIds.add(item.checklist_item_id);
      });

      if (allItemIds.size === 0) return [];

      const latestDates = [...new Set([...latestDateByProject.values()])];
      const { data: completionsData, error: cErr } = await supabase
        .from('checklist_completions')
        .select('item_id, quantity_done, is_skipped, status, date')
        .eq('unit_id', activeUnitId!)
        .in('status', ['completed', 'done'])
        .in('date', latestDates)
        .in('item_id', [...allItemIds]);
      if (cErr) throw cErr;

      // Sum done by (date + item)
      const doneByDateItem = new Map<string, number>();
      (completionsData || []).forEach(c => {
        if (!c.is_skipped && c.quantity_done > 0) {
          const key = `${c.date}::${c.item_id}`;
          doneByDateItem.set(key, (doneByDateItem.get(key) || 0) + c.quantity_done);
        }
      });

      // Completed project = latest production date has no pending items
      const completed: string[] = [];
      orderedByProjectItem.forEach((itemMap, pid) => {
        const latestDate = latestDateByProject.get(pid);
        if (!latestDate) return;

        let allDone = true;
        itemMap.forEach((ordered, itemId) => {
          const done = doneByDateItem.get(`${latestDate}::${itemId}`) || 0;
          if (done < ordered) allDone = false;
        });

        if (allDone) completed.push(pid);
      });

      return completed;
    },
    enabled: !!activeUnitId && projectsToCheck.length > 0,
  });

  const activeProjects = useMemo(() => {
    return allActiveProjects.filter(p => {
      // Already has order on selected date → always show
      if (dateProjectIds.includes(p.id)) return true;
      // Never had any order yet → hide from timeline selector (appears only when scheduled)
      if (!projectsWithOrders.includes(p.id)) return false;
      // Had orders before but fully completed on latest date → hide
      if (completedProjectIds.includes(p.id)) return false;
      // Has pending from latest production date → show
      return true;
    });
  }, [allActiveProjects, dateProjectIds, projectsWithOrders, completedProjectIds]);

  // Auto-sync selectedProjectId when activeProjects changes
  useEffect(() => {
    if (activeProjects.length === 0) return;
    if (selectedProjectId && activeProjects.some(p => p.id === selectedProjectId)) return;
    // Selected project is no longer in the list — fallback to first
    setSelectedProjectId(activeProjects[0]?.id || null);
  }, [activeProjects, selectedProjectId]);

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
    // Use the larger ordered value — shift 2 may carry over remaining from shift 1
    const totalOrdered = Math.max(shift1.totals.ordered, shift2.totals.ordered);
    // Avoid double-counting: total done is capped at ordered
    const totalDone = Math.min(shift1.totals.done + shift2.totals.done, totalOrdered);
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
