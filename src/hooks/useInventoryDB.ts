import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InventoryItem, StockMovement, MovementType } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

async function fetchItemsData(unitId: string): Promise<InventoryItem[]> {
  let query = supabase
    .from('inventory_items')
    .select('*, category:categories(*), supplier:suppliers(*)')
    .is('deleted_at' as any, null)
    .order('name');

  if (unitId) {
    query = query.eq('unit_id', unitId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as InventoryItem[]) || [];
}

async function fetchMovementsData(unitId: string): Promise<StockMovement[]> {
  let query = supabase
    .from('stock_movements')
    .select('*, item:inventory_items(*)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (unitId) {
    query = query.eq('unit_id', unitId);
  }

  const { data: movementsData, error } = await query;
  if (error) throw error;

  const userIds = [...new Set((movementsData || []).map(m => m.user_id).filter(Boolean))];

  let profilesMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    profilesMap = (profilesData || []).reduce((acc, p) => {
      acc[p.user_id] = p.full_name;
      return acc;
    }, {} as Record<string, string>);
  }

  return (movementsData || []).map(m => ({
    ...m,
    user_name: m.user_id ? profilesMap[m.user_id] || null : null,
  })) as StockMovement[];
}

export function useInventoryDB() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const itemsKey = ['inventory-items', activeUnitId];
  const movementsKey = ['inventory-movements', activeUnitId];

  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: itemsKey,
    queryFn: () => fetchItemsData(activeUnitId!),
    enabled: !!user && !!activeUnitId,
  });

  const { data: movements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: movementsKey,
    queryFn: () => fetchMovementsData(activeUnitId!),
    enabled: !!user && !!activeUnitId,
  });

  const isLoading = isLoadingItems || isLoadingMovements;

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: itemsKey });
    queryClient.invalidateQueries({ queryKey: movementsKey });
  }, [queryClient, activeUnitId]);

  const addItemMut = useMutation({
    mutationFn: async (item: {
      name: string;
      category_id: string | null;
      supplier_id?: string | null;
      unit_type: 'unidade' | 'kg' | 'litro' | 'metro' | 'metro_quadrado';
      current_stock: number;
      min_stock: number;
      unit_price?: number | null;
      recipe_unit_type?: string | null;
      recipe_unit_price?: number | null;
      material_type?: string | null;
      dimensions?: string | null;
      thickness?: string | null;
      technical_spec?: string | null;
      internal_code?: string | null;
      location?: string | null;
      weight_per_unit?: number | null;
    }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({ ...item, unit_id: activeUnitId })
        .select('*, category:categories(*), supplier:suppliers(*)')
        .single();
      if (error) throw error;
      return data as InventoryItem;
    },
    onSuccess: () => invalidateAll(),
  });

  const updateItemMut = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryItem> }) => {
      const { category, supplier, ...updateData } = updates;
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', id)
        .select('*, category:categories(*), supplier:suppliers(*)')
        .single();
      if (error) throw error;
      return data as InventoryItem;
    },
    onSuccess: () => invalidateAll(),
  });

  const deleteItemMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_items').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
  });

  const registerMovementMut = useMutation({
    mutationFn: async ({ itemId, type, quantity, notes, location }: {
      itemId: string; type: MovementType | 'transferencia'; quantity: number; notes?: string; location?: string;
    }) => {
      const { error } = await supabase.from('stock_movements').insert({
        item_id: itemId,
        type,
        quantity,
        notes,
        user_id: user?.id,
        unit_id: activeUnitId,
        location: location || 'almoxarifado',
      } as any);
      if (error) throw error;

      return {
        id: 'pending',
        item_id: itemId,
        type,
        quantity,
        notes: notes ?? null,
        user_id: user?.id ?? null,
        created_at: new Date().toISOString(),
      } as unknown as StockMovement;
    },
    onSuccess: () => invalidateAll(),
  });

  const deleteMovementMut = useMutation({
    mutationFn: async (movementId: string) => {
      const { error } = await supabase.from('stock_movements').delete().eq('id', movementId);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
  });

  const getItemMovements = useCallback((itemId: string) => {
    return movements.filter(m => m.item_id === itemId);
  }, [movements]);

  const getItem = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  const getLowStockItems = useMemo(() => {
    return () => items.filter(item => item.current_stock <= item.min_stock && item.current_stock > 0);
  }, [items]);

  const getOutOfStockItems = useMemo(() => {
    return () => items.filter(item => item.current_stock === 0);
  }, [items]);

  const getRecentMovements = useCallback((days: number = 7) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return movements.filter(m => new Date(m.created_at) >= cutoff);
  }, [movements]);

  const getItemsByCategory = useMemo(() => {
    return () => {
      const grouped: Record<string, InventoryItem[]> = {};
      items.forEach(item => {
        const categoryName = item.category?.name || 'Sem Categoria';
        if (!grouped[categoryName]) grouped[categoryName] = [];
        grouped[categoryName].push(item);
      });
      return grouped;
    };
  }, [items]);

  return {
    items,
    movements,
    isLoading,
    addItem: (item: Parameters<typeof addItemMut.mutateAsync>[0]) => addItemMut.mutateAsync(item),
    updateItem: (id: string, updates: Partial<InventoryItem>) => updateItemMut.mutateAsync({ id, updates }),
    deleteItem: (id: string) => deleteItemMut.mutateAsync(id),
    registerMovement: (itemId: string, type: MovementType | 'transferencia', quantity: number, notes?: string, location?: string) =>
      registerMovementMut.mutateAsync({ itemId, type, quantity, notes, location }),
    deleteMovement: (movementId: string) => deleteMovementMut.mutateAsync(movementId),
    getItemMovements,
    getItem,
    getLowStockItems,
    getOutOfStockItems,
    getRecentMovements,
    getItemsByCategory,
    refetch: invalidateAll,
  };
}
