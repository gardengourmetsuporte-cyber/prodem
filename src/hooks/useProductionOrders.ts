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
  notes: string | null;
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
  status: 'complete' | 'partial' | 'not_started';
  duration_ms: number | null;
}

export function useProductionOrders(unitId: string | null, date: Date) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dateStr = format(date, 'yyyy-MM-dd');

  const orderKey = ['production-order', unitId, dateStr];
  const itemsKey = ['production-order-items', unitId, dateStr];

  // Fetch current day's order
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: orderKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_orders')
        .select('*')
        .eq('unit_id', unitId!)
        .eq('date', dateStr)
        .maybeSingle();
      if (error) throw error;
      return data as ProductionOrder | null;
    },
    enabled: !!user && !!unitId,
  });

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

  // Fetch completions for report
  const { data: completions = [] } = useQuery({
    queryKey: ['production-completions', unitId, dateStr],
    queryFn: async () => {
      const itemIds = orderItems.map(i => i.checklist_item_id);
      if (itemIds.length === 0 || !unitId) return [];
      const { data, error } = await supabase
        .from('checklist_completions')
        .select('item_id, quantity_done, is_skipped, started_at, finished_at')
        .eq('date', dateStr)
        .eq('unit_id', unitId)
        .in('status', ['completed', 'done'])
        .in('item_id', itemIds);
      if (error) throw error;
      return data || [];
    },
    enabled: orderItems.length > 0 && !!unitId,
  });

  // Build report
  const report = useMemo((): ProductionReportItem[] => {
    if (orderItems.length === 0) return [];

    // Sum quantity_done per item + track duration
    const doneMap = new Map<string, number>();
    const durationMap = new Map<string, number | null>();
    completions.forEach(c => {
      if (!c.is_skipped) {
        doneMap.set(c.item_id, (doneMap.get(c.item_id) || 0) + (c.quantity_done ?? 0));
        // Calculate duration from started_at/finished_at
        const startedAt = (c as any).started_at;
        const finishedAt = (c as any).finished_at;
        if (startedAt && finishedAt) {
          const dur = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
          const existing = durationMap.get(c.item_id);
          // Sum durations across shifts
          durationMap.set(c.item_id, (existing || 0) + dur);
        }
      }
    });

    return orderItems.map(oi => {
      const done = doneMap.get(oi.checklist_item_id) || 0;
      const pending = Math.max(0, oi.quantity_ordered - done);
      const percent = oi.quantity_ordered > 0 ? Math.round((done / oi.quantity_ordered) * 100) : 0;
      return {
        checklist_item_id: oi.checklist_item_id,
        item_name: oi.checklist_item?.name || 'Item',
        piece_dimensions: oi.checklist_item?.piece_dimensions || null,
        quantity_ordered: oi.quantity_ordered,
        quantity_done: done,
        quantity_pending: pending,
        percent: Math.min(percent, 100),
        status: percent >= 100 ? 'complete' : done > 0 ? 'partial' : 'not_started',
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
    queryClient.invalidateQueries({ queryKey: orderKey });
    queryClient.invalidateQueries({ queryKey: itemsKey });
    queryClient.invalidateQueries({ queryKey: ['production-completions', unitId, dateStr] });
  }, [queryClient, unitId, dateStr]);

  // Create or update order with items
  const saveOrder = useCallback(async (
    items: { checklist_item_id: string; quantity_ordered: number }[],
    notes?: string
  ) => {
    if (!user || !unitId) throw new Error('Not authenticated');

    let orderId = order?.id;

    if (!orderId) {
      // Create new order
      const { data, error } = await supabase
        .from('production_orders')
        .insert({ unit_id: unitId, created_by: user.id, date: dateStr, status: 'active', notes })
        .select('id')
        .single();
      if (error) throw error;
      orderId = data.id;
    } else {
      // Update existing
      await supabase
        .from('production_orders')
        .update({ notes, status: 'active', updated_at: new Date().toISOString() })
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
  }, [user, unitId, dateStr, order?.id, invalidate]);

  // Close order
  const closeOrder = useCallback(async () => {
    if (!order?.id) return;
    await supabase.from('production_orders').update({ status: 'closed' }).eq('id', order.id);
    invalidate();
  }, [order?.id, invalidate]);

  // Copy from another date
  const copyFromDate = useCallback(async (sourceDate: string) => {
    if (!unitId) return null;
    const { data: sourceOrder } = await supabase
      .from('production_orders')
      .select('id')
      .eq('unit_id', unitId)
      .eq('date', sourceDate)
      .maybeSingle();
    if (!sourceOrder) return null;

    const { data: sourceItems } = await supabase
      .from('production_order_items')
      .select('checklist_item_id, quantity_ordered')
      .eq('order_id', sourceOrder.id);
    if (!sourceItems || sourceItems.length === 0) return null;

    return sourceItems as { checklist_item_id: string; quantity_ordered: number }[];
  }, [unitId]);

  return {
    order,
    orderItems,
    report,
    totals,
    isLoading: orderLoading || itemsLoading,
    hasOrder: !!order,
    saveOrder,
    closeOrder,
    copyFromDate,
    invalidate,
  };
}
