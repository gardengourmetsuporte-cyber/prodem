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

export function useProductionOrders(unitId: string | null, date: Date, shift: number = 1) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dateStr = format(date, 'yyyy-MM-dd');

  const orderKey = ['production-order', unitId, dateStr, shift];
  const itemsKey = ['production-order-items', unitId, dateStr, shift];

  // Fetch current day's order for this shift
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: orderKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_orders')
        .select('*')
        .eq('unit_id', unitId!)
        .eq('date', dateStr)
        .eq('shift', shift)
        .maybeSingle();
      if (error) throw error;
      return data as ProductionOrder | null;
    },
    enabled: !!user && !!unitId,
  });

  // Also fetch the other shift's order (to know if shift 1 is closed)
  const otherShift = shift === 1 ? 2 : 1;
  const { data: otherShiftOrder } = useQuery({
    queryKey: ['production-order', unitId, dateStr, otherShift],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_orders')
        .select('*')
        .eq('unit_id', unitId!)
        .eq('date', dateStr)
        .eq('shift', otherShift)
        .maybeSingle();
      if (error) throw error;
      return data as ProductionOrder | null;
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
      const { data, error } = await supabase
        .from('production_order_items')
        .select('*, checklist_item:checklist_items(id, name, target_quantity, subcategory_id, piece_dimensions)')
        .eq('order_id', order.id);
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
      
      // Fetch item IDs directly from DB to avoid stale orderItems dependency
      const { data: freshItems, error: itemsErr } = await supabase
        .from('production_order_items')
        .select('checklist_item_id')
        .eq('order_id', order.id);
      if (itemsErr) throw itemsErr;
      
      const itemIds = (freshItems || []).map(i => i.checklist_item_id);
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
    staleTime: 5_000,
    refetchOnWindowFocus: true,
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
            // Legacy/quick completion without quantity should count as fully completed for pending calc
            completedWithoutQtySet.add(c.item_id);
          }
        }

        // Track items that are currently in_progress (started but not finished)
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

    return orderItems.map(oi => {
      const rawDone = doneMap.get(oi.checklist_item_id) || 0;
      const done = completedWithoutQtySet.has(oi.checklist_item_id)
        ? Math.max(rawDone, oi.quantity_ordered)
        : rawDone;
      const pending = Math.max(0, oi.quantity_ordered - done);
      const percent = oi.quantity_ordered > 0 ? Math.round((done / oi.quantity_ordered) * 100) : 0;
      const isInProgress = inProgressSet.has(oi.checklist_item_id);
      return {
        checklist_item_id: oi.checklist_item_id,
        item_name: oi.checklist_item?.name || 'Item',
        piece_dimensions: oi.checklist_item?.piece_dimensions || null,
        quantity_ordered: oi.quantity_ordered,
        quantity_done: done,
        quantity_pending: pending,
        percent: Math.min(percent, 100),
        status: percent >= 100 ? 'complete' : done > 0 ? 'partial' : isInProgress ? 'in_progress' : 'not_started',
        duration_ms: durationMap.get(oi.checklist_item_id) ?? null,
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
    projectId?: string
  ) => {
    if (!user || !unitId) throw new Error('Not authenticated');

    let orderId = order?.id;

    if (!orderId) {
      const insertData: any = { unit_id: unitId, created_by: user.id, date: dateStr, status: 'active', notes, shift };
      if (projectId) insertData.project_id = projectId;
      const { data, error } = await supabase
        .from('production_orders')
        .insert(insertData)
        .select('id')
        .single();
      if (error) throw error;
      orderId = data.id;
    } else {
      const updateData: any = { notes, status: 'active', updated_at: new Date().toISOString() };
      if (projectId !== undefined) updateData.project_id = projectId || null;
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
    if (!order?.id) return;
    await supabase.from('production_orders').update({ status: 'closed' }).eq('id', order.id);
    invalidate();
  }, [order?.id, invalidate]);

  // Delete order and all its items + completions
  const deleteOrder = useCallback(async () => {
    if (!order?.id) return;
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
    if (!order?.id) return;
    await supabase.from('production_orders').update({ status: 'active' }).eq('id', order.id);
    invalidate();
  }, [order?.id, invalidate]);

  // Reset all production data for the selected day (both shifts) — useful for test reruns
  const resetDayOrders = useCallback(async () => {
    if (!unitId) return;

    const { data: dayOrders, error: dayOrdersError } = await supabase
      .from('production_orders')
      .select('id')
      .eq('unit_id', unitId)
      .eq('date', dateStr);

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
  }, [unitId, dateStr, invalidate, queryClient]);

  // Close shift 1 and auto-create/update shift 2 with remaining items
  const closeShiftAndCreateNext = useCallback(async () => {
    if (!order?.id || !user || !unitId) return;
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

    // Check if shift 2 already exists for this day
    const { data: existingShift2, error: existingShift2Error } = await supabase
      .from('production_orders')
      .select('id')
      .eq('unit_id', unitId)
      .eq('date', dateStr)
      .eq('shift', 2)
      .maybeSingle();

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
      const { data: newOrder, error: orderError } = await supabase
        .from('production_orders')
        .insert({
          unit_id: unitId,
          created_by: user.id,
          date: dateStr,
          status: 'active',
          shift: 2,
          notes: 'Continuação do Turno 1',
        })
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
  }, [order?.id, user, unitId, shift, dateStr, report, invalidate]);

  // Copy from another date
  const copyFromDate = useCallback(async (sourceDate: string) => {
    if (!unitId) return null;
    const { data: sourceOrder } = await supabase
      .from('production_orders')
      .select('id')
      .eq('unit_id', unitId)
      .eq('date', sourceDate)
      .eq('shift', 1)
      .maybeSingle();
    if (!sourceOrder) return null;

    const { data: sourceItems } = await supabase
      .from('production_order_items')
      .select('checklist_item_id, quantity_ordered')
      .eq('order_id', sourceOrder.id);
    if (!sourceItems || sourceItems.length === 0) return null;

    return sourceItems as { checklist_item_id: string; quantity_ordered: number }[];
  }, [unitId]);

  // Get pending (unfinished) items from a given date
  const getPendingFromDate = useCallback(async (sourceDate: string) => {
    if (!unitId) return null;

    // Get all orders for that date (both shifts)
    const { data: sourceOrders } = await supabase
      .from('production_orders')
      .select('id')
      .eq('unit_id', unitId)
      .eq('date', sourceDate);
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
  }, [unitId]);

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
