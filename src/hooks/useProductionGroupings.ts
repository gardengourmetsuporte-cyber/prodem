import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

export interface ProductionGrouping {
  id: string;
  project_id: string;
  grouping_number: number;
  material: string | null;
  plate_size: string | null;
  thickness: string | null;
  total_cut_length: string | null;
  processing_time: string | null;
  cut_time: string | null;
  movement_time: string | null;
  perforation_time: string | null;
  total_pieces: number;
  unique_pieces: number;
  notes: string | null;
  image_url: string | null;
  unit_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductionGroupingItem {
  id: string;
  grouping_id: string;
  checklist_item_id: string;
  quantity: number;
  sort_order: number;
}

export interface GroupingWithItems extends ProductionGrouping {
  items: ProductionGroupingItem[];
}

export function useProductionGroupings(projectId: string | null, unitId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: groupings = [], isLoading } = useQuery({
    queryKey: ['production-groupings', projectId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('production_groupings')
        .select('*')
        .eq('project_id', projectId!)
        .order('grouping_number', { ascending: true });
      if (error) throw error;
      return data as ProductionGrouping[];
    },
    enabled: !!user && !!projectId,
  });

  const { data: groupingItems = [] } = useQuery({
    queryKey: ['production-grouping-items', projectId],
    queryFn: async () => {
      if (!groupings.length) return [];
      const ids = groupings.map(g => g.id);
      const { data, error } = await (supabase as any)
        .from('production_grouping_items')
        .select('*')
        .in('grouping_id', ids)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as ProductionGroupingItem[];
    },
    enabled: !!user && groupings.length > 0,
  });

  // Merge groupings with their items
  const groupingsWithItems: GroupingWithItems[] = groupings.map(g => ({
    ...g,
    items: groupingItems.filter(i => i.grouping_id === g.id),
  }));

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['production-groupings', projectId] });
    queryClient.invalidateQueries({ queryKey: ['production-grouping-items', projectId] });
  }, [projectId, queryClient]);

  const createGrouping = useCallback(async (data: {
    grouping_number: number;
    material?: string;
    plate_size?: string;
    thickness?: string;
    total_cut_length?: string;
    processing_time?: string;
    cut_time?: string;
    movement_time?: string;
    perforation_time?: string;
    total_pieces?: number;
    unique_pieces?: number;
    notes?: string;
    image_url?: string;
  }) => {
    if (!projectId || !unitId) throw new Error('Missing project/unit');
    const { data: created, error } = await (supabase as any)
      .from('production_groupings')
      .insert({ project_id: projectId, unit_id: unitId, ...data })
      .select()
      .single();
    if (error) throw error;
    invalidate();
    return created as ProductionGrouping;
  }, [projectId, unitId, invalidate]);

  const updateGrouping = useCallback(async (id: string, data: Partial<ProductionGrouping>) => {
    const { error } = await (supabase as any)
      .from('production_groupings')
      .update(data)
      .eq('id', id);
    if (error) throw error;
    invalidate();
  }, [invalidate]);

  const deleteGrouping = useCallback(async (id: string) => {
    const { error } = await (supabase as any)
      .from('production_groupings')
      .delete()
      .eq('id', id);
    if (error) throw error;
    invalidate();
  }, [invalidate]);

  const addGroupingItem = useCallback(async (groupingId: string, checklistItemId: string, quantity: number) => {
    const { error } = await (supabase as any)
      .from('production_grouping_items')
      .insert({ grouping_id: groupingId, checklist_item_id: checklistItemId, quantity });
    if (error) throw error;
    invalidate();
  }, [invalidate]);

  const updateGroupingItem = useCallback(async (id: string, data: { quantity?: number; sort_order?: number }) => {
    const { error } = await (supabase as any)
      .from('production_grouping_items')
      .update(data)
      .eq('id', id);
    if (error) throw error;
    invalidate();
  }, [invalidate]);

  const removeGroupingItem = useCallback(async (id: string) => {
    const { error } = await (supabase as any)
      .from('production_grouping_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
    invalidate();
  }, [invalidate]);

  // Build a map: checklist_item_id → grouping info for quick lookup in CutTable
  const itemGroupingMap = new Map<string, { groupingNumber: number; quantity: number; material?: string; thickness?: string }>();
  groupingsWithItems.forEach(g => {
    g.items.forEach(item => {
      itemGroupingMap.set(item.checklist_item_id, {
        groupingNumber: g.grouping_number,
        quantity: item.quantity,
        material: g.material || undefined,
        thickness: g.thickness || undefined,
      });
    });
  });

  return {
    groupings,
    groupingsWithItems,
    groupingItems,
    itemGroupingMap,
    isLoading,
    createGrouping,
    updateGrouping,
    deleteGrouping,
    addGroupingItem,
    updateGroupingItem,
    removeGroupingItem,
  };
}
