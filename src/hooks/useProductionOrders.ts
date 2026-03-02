import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface ProductionOrder {
  id: string;
  unit_id: string;
  created_by: string;
  date: string;
  status: 'draft' | 'active' | 'closed';
  shift: number;
  notes: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductionOrderItem {
  id: string;
  order_id: string;
  checklist_item_id: string;
  quantity_ordered: number;
  unit_id: string;
  created_at: string;
  checklist_item?: {
    id: string;
    name: string;
    target_quantity: number;
    subcategory_id: string;
    piece_dimensions: string | null;
  };
}

export interface ProductionReportItem {
  checklist_item_id: string;
  item_name: string;
  piece_dimensions: string | null;
  quantity_ordered: number;
  quantity_done: number;
  quantity_pending: number;
  percent: number;
  status: 'complete' | 'partial' | 'in_progress' | 'not_started';
  duration_ms: number | null;
}

// Special value '__all__' skips the filter entirely (used by dashboard to aggregate all projects)
function addProjectFilter(query: any, pid: string | null | undefined): any {
  if (pid === '__all__') return query;
  return pid ? query.eq('project_id', pid) : query.is('project_id', null);
}

// We no longer rely on daily Shift orders. We just fetch items/completions by Date & ProjectId.
export function useProductionOrders(unitId: string | null, date: Date, projectId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dateStr = format(date, 'yyyy-MM-dd');

  // Instead of an "order", we represent the state using the selected project
  const itemsKey = ['production-project-items', unitId, projectId ?? '__null__'];

  const isAllProjects = projectId === '__all__';

  // Fetch order items with checklist_item join DIRECTLY BY PROJECT ID
  const { data: orderItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: itemsKey,
    queryFn: async () => {
      if (!projectId || projectId === '__null__') return [];

      let query = supabase
        .from('production_order_items')
        .select('*, checklist_item:checklist_items(id, name, target_quantity, subcategory_id, piece_dimensions, sort_order)')
        .eq('unit_id', unitId!);

      query = addProjectFilter(query, projectId);

      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ProductionOrderItem[];
    },
    enabled: !!projectId && projectId !== '__null__' && !!unitId,
  });

  // Fetch completions for THIS project
  // We don't filter by `checklist_type` or shift anymore for the production list, we just want to know how many are done
  const { data: completions = [] } = useQuery({
    queryKey: ['production-completions-project', unitId, projectId],
    queryFn: async () => {
      if (!projectId || projectId === '__null__') return [];

      // Fetch item IDs that belong to this project
      const { data: freshItems, error: itemsErr } = await (supabase
        .from('production_order_items')
        .select('checklist_item_id')
        .eq('unit_id', unitId!) as any)
        .eq('project_id', projectId);
      if (itemsErr) throw itemsErr;

      const itemIds = [...new Set((freshItems || []).map((i: any) => i.checklist_item_id))] as string[];
      if (itemIds.length === 0) return [];

      const { data, error } = await (supabase
        .from('checklist_completions')
        .select('item_id, quantity_done, is_skipped, started_at, finished_at, status')
        .eq('unit_id', unitId!) as any)
        .eq('project_id', projectId)
        .in('status', ['completed', 'done', 'in_progress'])
        .in('item_id', itemIds);

      if (error) throw error;
      return data || [];
    },
    enabled: !!unitId && !!projectId && projectId !== '__null__',
    staleTime: 2_000,
    refetchOnWindowFocus: true,
    refetchInterval: 10_000,
  });

  // Build report for THIS shift's items
  const report = useMemo((): ProductionReportItem[] => {
    if (orderItems.length === 0) return [];

    const doneMap = new Map<string, number>();
    const completedWithoutQtySet = new Set<string>();
    const inProgressSet = new Set<string>();
    const durationMap = new Map<string, number | null>();

    completions.forEach(c => {
      if (!c.is_skipped) {
        const status = (c as any).status;
        const qtyDone = c.quantity_done ?? 0;

        if (status === 'completed' || status === 'done') {
          if (qtyDone > 0) {
            doneMap.set(c.item_id, (doneMap.get(c.item_id) || 0) + qtyDone);
          } else {
            completedWithoutQtySet.add(c.item_id);
          }
        }

        const startedAt = (c as any).started_at;
        const finishedAt = (c as any).finished_at;
        if (startedAt && !finishedAt) {
          inProgressSet.add(c.item_id);
        }
        if (startedAt && finishedAt) {
          const dur = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
          const existing = durationMap.get(c.item_id);
          durationMap.set(c.item_id, (existing || 0) + dur);
        }
      }
    });

    // Aggregate order items by checklist_item_id (needed for __all__ mode with same item across projects)
    // Preserve insertion order (first-seen) for consistent display
    const aggregated = new Map<string, { qty: number; name: string; dims: string | null; sortOrder: number; firstIndex: number }>();
    let idx = 0;
    orderItems.forEach(oi => {
      const existing = aggregated.get(oi.checklist_item_id);
      if (existing) {
        existing.qty += oi.quantity_ordered;
      } else {
        aggregated.set(oi.checklist_item_id, {
          qty: oi.quantity_ordered,
          name: oi.checklist_item?.name || 'Item',
          dims: oi.checklist_item?.piece_dimensions || null,
          sortOrder: (oi.checklist_item as any)?.sort_order ?? 999,
          firstIndex: idx,
        });
      }
      idx++;
    });

    return [...aggregated.entries()]
      .sort(([, a], [, b]) => a.firstIndex - b.firstIndex)
      .map(([itemId, agg]) => {
        const rawDone = doneMap.get(itemId) || 0;
        const done = completedWithoutQtySet.has(itemId)
          ? Math.max(rawDone, agg.qty)
          : rawDone;
        const pending = Math.max(0, agg.qty - done);
        const percent = agg.qty > 0 ? Math.round((done / agg.qty) * 100) : 0;
        const isInProgress = inProgressSet.has(itemId);
        return {
          checklist_item_id: itemId,
          item_name: agg.name,
          piece_dimensions: agg.dims,
          quantity_ordered: agg.qty,
          quantity_done: done,
          quantity_pending: pending,
          percent: Math.min(percent, 100),
          status: percent >= 100 ? 'complete' : done > 0 ? 'partial' : isInProgress ? 'in_progress' : 'not_started',
          duration_ms: durationMap.get(itemId) ?? null,
        };
      });
  }, [orderItems, completions]);

  // Totals
  const totals = useMemo(() => {
    const ordered = report.reduce((s, r) => s + r.quantity_ordered, 0);
    const done = report.reduce((s, r) => s + r.quantity_done, 0);
    const pending = report.reduce((s, r) => s + r.quantity_pending, 0);
    const percent = ordered > 0 ? Math.round((done / ordered) * 100) : 0;
    return { ordered, done, pending, percent };
  }, [report]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['production-project-items', unitId] });
    queryClient.invalidateQueries({ queryKey: ['production-completions-project', unitId] });
  }, [queryClient, unitId]);

  // Create or update items for a project
  const saveProjectItems = useCallback(async (
    items: { checklist_item_id: string; quantity_ordered: number }[],
    targetProjectId: string
  ) => {
    if (!user || !unitId || !targetProjectId) throw new Error('Not authenticated, or missing project');

    // Delete existing items for this project and re-insert
    await supabase.from('production_order_items').delete().eq('project_id', targetProjectId);

    if (items.length > 0) {
      const rows = items.map(i => ({
        project_id: targetProjectId,
        checklist_item_id: i.checklist_item_id,
        quantity_ordered: i.quantity_ordered,
        unit_id: unitId,
      }));
      const { error } = await supabase.from('production_order_items').insert(rows as any);
      if (error) throw error;
    }

    invalidate();
    return targetProjectId;
  }, [user, unitId, invalidate]);

  // Delete all items and completions for a project
  const deleteProjectItems = useCallback(async (targetProjectId: string) => {
    if (!targetProjectId) return;

    // Find all item instances
    const { data: projectItems } = await supabase
      .from('production_order_items')
      .select('checklist_item_id')
      .eq('project_id', targetProjectId);

    const itemIds = projectItems?.map(i => i.checklist_item_id) || [];

    if (itemIds.length > 0) {
      await supabase
        .from('checklist_completions')
        .delete()
        .in('item_id', itemIds)
        .eq('project_id', targetProjectId)
        .eq('unit_id', unitId!);
    }

    await supabase.from('production_order_items').delete().eq('project_id', targetProjectId);
    invalidate();
    queryClient.invalidateQueries({ queryKey: ['checklist-all-shift-completions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-checklist-completions'] });
  }, [unitId, invalidate, queryClient]);

  // Reset all production data for the selected day (used primarily for cleanup if things go wrong)
  const resetDayOrders = useCallback(async () => {
    if (!unitId || !projectId || projectId === '__null__') return;
    await deleteProjectItems(projectId);
  }, [unitId, projectId, deleteProjectItems]);

  // Copy from another date
  const copyFromDate = useCallback(async (sourceDate: string) => {
    if (!unitId) return null;
    let sourceQuery = supabase
      .from('production_orders')
      .select('id')
      .eq('unit_id', unitId)
      .eq('date', sourceDate); // Removed .eq('shift', 1);
    sourceQuery = addProjectFilter(sourceQuery, projectId);
    const { data: sourceOrder } = await sourceQuery.maybeSingle();
    if (!sourceOrder) return null;

    const { data: sourceItems } = await supabase
      .from('production_order_items')
      .select('checklist_item_id, quantity_ordered')
      .eq('order_id', sourceOrder.id);
    if (!sourceItems || sourceItems.length === 0) return null;

    return sourceItems as { checklist_item_id: string; quantity_ordered: number }[];
  }, [unitId, projectId]);

  // Get pending (unfinished) items from a given date
  const getPendingFromDate = useCallback(async (sourceDate: string) => {
    if (!unitId) return null;

    // Get all orders for that date (both shifts) — filtered by project
    let sourceQuery = supabase
      .from('production_orders')
      .select('id')
      .eq('unit_id', unitId)
      .eq('date', sourceDate);
    sourceQuery = addProjectFilter(sourceQuery, projectId);
    const { data: sourceOrders } = await sourceQuery;
    if (!sourceOrders || sourceOrders.length === 0) return null;

    const orderIds = sourceOrders.map(o => o.id);

    // Get all order items
    const { data: sourceItems } = await supabase
      .from('production_order_items')
      .select('checklist_item_id, quantity_ordered')
      .in('order_id', orderIds);
    if (!sourceItems || sourceItems.length === 0) return null;

    // Aggregate ordered quantities per item (across shifts)
    const orderedMap = new Map<string, number>();
    sourceItems.forEach(si => {
      orderedMap.set(si.checklist_item_id, (orderedMap.get(si.checklist_item_id) || 0) + si.quantity_ordered);
    });

    // Get completions for that date
    const itemIds = Array.from(orderedMap.keys());
    const { data: completionsData } = await supabase
      .from('checklist_completions')
      .select('item_id, quantity_done, is_skipped, status')
      .eq('date', sourceDate)
      .eq('unit_id', unitId)
      .in('status', ['completed', 'done'])
      .in('item_id', itemIds);

    const doneMap = new Map<string, number>();
    (completionsData || []).forEach(c => {
      if (!c.is_skipped && c.quantity_done > 0) {
        doneMap.set(c.item_id, (doneMap.get(c.item_id) || 0) + c.quantity_done);
      }
    });

    // Build pending items
    const pendingItems: { checklist_item_id: string; quantity_ordered: number }[] = [];
    orderedMap.forEach((ordered, itemId) => {
      const done = doneMap.get(itemId) || 0;
      const pending = ordered - done;
      if (pending > 0) {
        pendingItems.push({ checklist_item_id: itemId, quantity_ordered: pending });
      }
    });

    return pendingItems.length > 0 ? pendingItems : null;
  }, [unitId, projectId]);

  return {
    orderItems,
    report,
    totals,
    isLoading: itemsLoading,
    saveProjectItems,
    deleteProjectItems,
    resetDayOrders,
    copyFromDate,
    getPendingFromDate,
    invalidate,
  };
}
