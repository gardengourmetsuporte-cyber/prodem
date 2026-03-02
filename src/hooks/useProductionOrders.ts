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

// Helper: apply project filter consistently — eq when has value, is null when null/undefined
// Special value '__all__' skips the filter entirely (used by dashboard to aggregate all projects)
function addProjectFilter(query: any, pid: string | null | undefined): any {
  if (pid === '__all__') return query;
  return pid ? query.eq('project_id', pid) : query.is('project_id', null);
}

export function useProductionOrders(unitId: string | null, date: Date, shift: number = 1, projectId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dateStr = format(date, 'yyyy-MM-dd');

  const orderKey = ['production-order', unitId, dateStr, shift, projectId ?? '__null__'];
  const itemsKey = ['production-order-items', unitId, dateStr, shift, projectId ?? '__null__'];

  const isAllProjects = projectId === '__all__';

  // Fetch current day's order(s) for this shift
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: orderKey,
    queryFn: async () => {
      let query = supabase
        .from('production_orders')
        .select('*')
        .eq('unit_id', unitId!)
        .eq('date', dateStr)
        .eq('shift', shift);
      
      if (!isAllProjects) {
        query = addProjectFilter(query, projectId);
        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        return data as ProductionOrder | null;
      } else {
        // For '__all__' mode, return the first order as representative (for status checks)
        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) return null;
        // Create a synthetic order that represents all
        return { ...data[0], id: '__aggregate__', _allOrderIds: data.map((d: any) => d.id), _allStatuses: data.map((d: any) => d.status) } as any;
      }
    },
    enabled: !!user && !!unitId,
  });

  // Also fetch the other shift's order (to know if shift 1 is closed)
  const otherShift = shift === 1 ? 2 : 1;
  const { data: otherShiftOrder } = useQuery({
    queryKey: ['production-order', unitId, dateStr, otherShift, projectId ?? '__null__'],
    queryFn: async () => {
      let query = supabase
        .from('production_orders')
        .select('*')
        .eq('unit_id', unitId!)
        .eq('date', dateStr)
        .eq('shift', otherShift);
      
      if (!isAllProjects) {
        query = addProjectFilter(query, projectId);
        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        return data as ProductionOrder | null;
      } else {
        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) return null;
        return { ...data[0], id: '__aggregate__', _allOrderIds: data.map((d: any) => d.id), _allStatuses: data.map((d: any) => d.status) } as any;
      }
    },
    enabled: !!user && !!unitId,
  });

  // For shift 2: check if shift 1 is closed
  const shift1Order = shift === 1 ? order : otherShiftOrder;
  const shift2Order = shift === 2 ? order : otherShiftOrder;
  const isShift1Closed = shift1Order?.status === 'closed';

  // Fetch order items with checklist_item join
  const { data: orderItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: itemsKey,
    queryFn: async () => {
      if (!order?.id) return [];
      const orderIds = (order as any)._allOrderIds || [order.id];
      const { data, error } = await supabase
        .from('production_order_items')
        .select('*, checklist_item:checklist_items(id, name, target_quantity, subcategory_id, piece_dimensions)')
        .in('order_id', orderIds);
      if (error) throw error;
      return (data || []) as ProductionOrderItem[];
    },
    enabled: !!order?.id,
  });

  // Fetch completions for THIS shift only (shift-specific progress)
  // Uses order items from a sub-query to avoid stale dependency on orderItems state
  const shiftChecklistType = shift === 1 ? 'abertura' : 'fechamento';
  const { data: completions = [] } = useQuery({
    queryKey: ['production-completions', unitId, dateStr, shift],
    queryFn: async () => {
      if (!order?.id) return [];
      
      // Fetch item IDs from all relevant orders
      const orderIds = (order as any)._allOrderIds || [order.id];
      const { data: freshItems, error: itemsErr } = await supabase
        .from('production_order_items')
        .select('checklist_item_id')
        .in('order_id', orderIds);
      if (itemsErr) throw itemsErr;
      
      const itemIds = [...new Set((freshItems || []).map(i => i.checklist_item_id))];
      if (itemIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('checklist_completions')
        .select('item_id, quantity_done, is_skipped, started_at, finished_at, checklist_type, status')
        .eq('date', dateStr)
        .eq('unit_id', unitId!)
        .eq('checklist_type', shiftChecklistType)
        .in('status', ['completed', 'done', 'in_progress'])
        .in('item_id', itemIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!unitId && !!order?.id,
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
    const aggregated = new Map<string, { qty: number; name: string; dims: string | null }>();
    orderItems.forEach(oi => {
      const existing = aggregated.get(oi.checklist_item_id);
      if (existing) {
        existing.qty += oi.quantity_ordered;
      } else {
        aggregated.set(oi.checklist_item_id, {
          qty: oi.quantity_ordered,
          name: oi.checklist_item?.name || 'Item',
          dims: oi.checklist_item?.piece_dimensions || null,
        });
      }
    });

    return [...aggregated.entries()].map(([itemId, agg]) => {
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
    queryClient.invalidateQueries({ queryKey: ['production-order', unitId, dateStr] });
    queryClient.invalidateQueries({ queryKey: ['production-order-items', unitId, dateStr] });
    // Invalidate completions for both shifts
    queryClient.invalidateQueries({ queryKey: ['production-completions', unitId, dateStr, 1] });
    queryClient.invalidateQueries({ queryKey: ['production-completions', unitId, dateStr, 2] });
  }, [queryClient, unitId, dateStr]);

  // Create or update order with items
  const saveOrder = useCallback(async (
    items: { checklist_item_id: string; quantity_ordered: number }[],
    notes?: string,
    saveProjectId?: string
  ) => {
    if (!user || !unitId) throw new Error('Not authenticated');
    // Use saveProjectId if provided, otherwise fall back to hook-level projectId
    const effectiveProjectId = saveProjectId !== undefined ? saveProjectId : projectId;

    let orderId = (order?.id && order.id !== '__aggregate__') ? order.id : undefined;

    if (!orderId) {
      // Double-check: look for an existing order to avoid duplicate key errors
      let existingQuery = supabase
        .from('production_orders')
        .select('id')
        .eq('unit_id', unitId!)
        .eq('date', dateStr)
        .eq('shift', shift);
      existingQuery = addProjectFilter(existingQuery, effectiveProjectId || null);
      const { data: existing } = await existingQuery.maybeSingle();

      if (existing?.id) {
        // Order already exists — reuse it
        orderId = existing.id;
        const updateData: any = { notes, status: 'active', updated_at: new Date().toISOString() };
        if (effectiveProjectId !== undefined) updateData.project_id = effectiveProjectId || null;
        await supabase
          .from('production_orders')
          .update(updateData)
          .eq('id', orderId);
      } else {
        const insertData: any = { unit_id: unitId, created_by: user.id, date: dateStr, status: 'active', notes, shift };
        if (effectiveProjectId) insertData.project_id = effectiveProjectId;
        const { data, error } = await supabase
          .from('production_orders')
          .insert(insertData)
          .select('id')
          .single();
        if (error) throw error;
        orderId = data.id;
      }
    } else {
      const updateData: any = { notes, status: 'active', updated_at: new Date().toISOString() };
      if (effectiveProjectId !== undefined) updateData.project_id = effectiveProjectId || null;
      await supabase
        .from('production_orders')
        .update(updateData)
        .eq('id', orderId);
    }

    // Delete existing items and re-insert
    await supabase.from('production_order_items').delete().eq('order_id', orderId);

    if (items.length > 0) {
      const rows = items.map(i => ({
        order_id: orderId!,
        checklist_item_id: i.checklist_item_id,
        quantity_ordered: i.quantity_ordered,
        unit_id: unitId,
      }));
      const { error } = await supabase.from('production_order_items').insert(rows);
      if (error) throw error;
    }

    invalidate();
    return orderId;
  }, [user, unitId, dateStr, order?.id, shift, invalidate]);

  // Close this shift's order
  const closeOrder = useCallback(async () => {
    if (!order?.id || order.id === '__aggregate__') return;
    await supabase.from('production_orders').update({ status: 'closed' }).eq('id', order.id);
    invalidate();
  }, [order?.id, invalidate]);

  // Delete order and all its items + completions
  const deleteOrder = useCallback(async () => {
    if (!order?.id || order.id === '__aggregate__') return;
    // Delete completions for today's items
    const itemIds = orderItems.map(i => i.checklist_item_id);
    if (itemIds.length > 0) {
      await supabase
        .from('checklist_completions')
        .delete()
        .in('item_id', itemIds)
        .eq('date', dateStr)
        .eq('unit_id', unitId!);
    }
    // Delete order items then order
    await supabase.from('production_order_items').delete().eq('order_id', order.id);
    await supabase.from('production_orders').delete().eq('id', order.id);
    invalidate();
    // Also invalidate checklist caches
    queryClient.invalidateQueries({ queryKey: ['checklist-completions'] });
    queryClient.invalidateQueries({ queryKey: ['checklist-all-shift-completions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-checklist-completions'] });
  }, [order?.id, orderItems, dateStr, unitId, invalidate, queryClient]);

  // Reopen a closed shift
  const reopenOrder = useCallback(async () => {
    if (!order?.id || order.id === '__aggregate__') return;
    await supabase.from('production_orders').update({ status: 'active' }).eq('id', order.id);
    invalidate();
  }, [order?.id, invalidate]);

  // Reset all production data for the selected day (both shifts) — useful for test reruns
  const resetDayOrders = useCallback(async () => {
    if (!unitId) return;

    let dayQuery = supabase
      .from('production_orders')
      .select('id')
      .eq('unit_id', unitId)
      .eq('date', dateStr);
    
    dayQuery = addProjectFilter(dayQuery, projectId);
    
    const { data: dayOrders, error: dayOrdersError } = await dayQuery;

    if (dayOrdersError) throw dayOrdersError;
    if (!dayOrders || dayOrders.length === 0) return;

    const orderIds = dayOrders.map(o => o.id);

    const { data: dayItems, error: dayItemsError } = await supabase
      .from('production_order_items')
      .select('checklist_item_id')
      .in('order_id', orderIds);

    if (dayItemsError) throw dayItemsError;

    const itemIds = Array.from(new Set((dayItems || []).map(i => i.checklist_item_id)));

    const { error: deleteItemsError } = await supabase
      .from('production_order_items')
      .delete()
      .in('order_id', orderIds);

    if (deleteItemsError) throw deleteItemsError;

    const { error: deleteOrdersError } = await supabase
      .from('production_orders')
      .delete()
      .in('id', orderIds);

    if (deleteOrdersError) throw deleteOrdersError;

    if (itemIds.length > 0) {
      const { error: deleteCompletionsError } = await supabase
        .from('checklist_completions')
        .delete()
        .eq('date', dateStr)
        .eq('unit_id', unitId)
        .in('item_id', itemIds)
        .in('checklist_type', ['abertura', 'fechamento']);

      if (deleteCompletionsError) throw deleteCompletionsError;
    }

    invalidate();
    queryClient.invalidateQueries({ queryKey: ['checklist-completions'] });
    queryClient.invalidateQueries({ queryKey: ['checklist-all-shift-completions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-checklist-completions'] });
  }, [unitId, dateStr, invalidate, queryClient, projectId]);

  // Close shift 1 and auto-create/update shift 2 with remaining items
  const closeShiftAndCreateNext = useCallback(async () => {
    if (!order?.id || order.id === '__aggregate__' || !user || !unitId) return;
    if (shift !== 1) return; // Only shift 1 can trigger this

    const { error: closeError } = await supabase
      .from('production_orders')
      .update({ status: 'closed' })
      .eq('id', order.id);

    if (closeError) throw closeError;

    // Calculate remaining items
    const remaining = report
      .filter(r => r.quantity_pending > 0)
      .map(r => ({
        checklist_item_id: r.checklist_item_id,
        quantity_ordered: r.quantity_pending,
      }));

    // Check if shift 2 already exists for this day and project
    let shift2Query = supabase
      .from('production_orders')
      .select('id')
      .eq('unit_id', unitId)
      .eq('date', dateStr)
      .eq('shift', 2);
    
    shift2Query = addProjectFilter(shift2Query, projectId);
    
    const { data: existingShift2, error: existingShift2Error } = await shift2Query.maybeSingle();

    if (existingShift2Error) throw existingShift2Error;

    // If nothing is pending, remove stale shift 2 if it exists
    if (remaining.length === 0) {
      if (existingShift2?.id) {
        const { error: deleteShift2ItemsError } = await supabase
          .from('production_order_items')
          .delete()
          .eq('order_id', existingShift2.id);

        if (deleteShift2ItemsError) throw deleteShift2ItemsError;

        const { error: deleteShift2OrderError } = await supabase
          .from('production_orders')
          .delete()
          .eq('id', existingShift2.id);

        if (deleteShift2OrderError) throw deleteShift2OrderError;
      }

      invalidate();
      return;
    }

    let shift2OrderId = existingShift2?.id;

    if (!shift2OrderId) {
      // Create shift 2 order
      const insertData: any = {
          unit_id: unitId,
          created_by: user.id,
          date: dateStr,
          status: 'active',
          shift: 2,
          notes: 'Continuação do Turno 1',
        };
      if (projectId) insertData.project_id = projectId;
      const { data: newOrder, error: orderError } = await supabase
        .from('production_orders')
        .insert(insertData)
        .select('id')
        .single();

      if (orderError) throw orderError;
      shift2OrderId = newOrder.id;
    } else {
      // Reuse existing shift 2 and refresh its status/metadata
      const { error: updateShift2Error } = await supabase
        .from('production_orders')
        .update({ status: 'active', notes: 'Continuação do Turno 1', updated_at: new Date().toISOString() })
        .eq('id', shift2OrderId);

      if (updateShift2Error) throw updateShift2Error;
    }

    // Replace shift 2 items with fresh pending snapshot
    const { error: deleteOldShift2ItemsError } = await supabase
      .from('production_order_items')
      .delete()
      .eq('order_id', shift2OrderId);

    if (deleteOldShift2ItemsError) throw deleteOldShift2ItemsError;

    const rows = remaining.map(r => ({
      order_id: shift2OrderId,
      checklist_item_id: r.checklist_item_id,
      quantity_ordered: r.quantity_ordered,
      unit_id: unitId,
    }));

    const { error: insertShift2ItemsError } = await supabase
      .from('production_order_items')
      .insert(rows);

    if (insertShift2ItemsError) throw insertShift2ItemsError;

    invalidate();
  }, [order?.id, user, unitId, shift, dateStr, report, invalidate, projectId]);

  // Copy from another date
  const copyFromDate = useCallback(async (sourceDate: string) => {
    if (!unitId) return null;
    let sourceQuery = supabase
      .from('production_orders')
      .select('id')
      .eq('unit_id', unitId)
      .eq('date', sourceDate)
      .eq('shift', 1);
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
    order,
    orderItems,
    report,
    totals,
    isLoading: orderLoading || itemsLoading,
    hasOrder: !!order,
    isShift1Closed,
    shift1Order,
    shift2Order,
    saveOrder,
    closeOrder,
    deleteOrder,
    reopenOrder,
    closeShiftAndCreateNext,
    copyFromDate,
    getPendingFromDate,
    resetDayOrders,
    invalidate,
  };
}
