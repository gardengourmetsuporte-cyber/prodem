import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

export interface ProductionPiece {
  id: string;
  project_id: string;
  unit_id: string;
  material_code: string | null;
  description: string;
  cut_length_mm: number | null;
  qty_per_rack: number;
  qty_total: number;
  process_type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useProductionPieces(projectId: string | null, unitId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: pieces = [], isLoading } = useQuery({
    queryKey: ['production-pieces', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_pieces')
        .select('*')
        .eq('project_id', projectId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as ProductionPiece[];
    },
    enabled: !!user && !!projectId,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['production-pieces', projectId] });
  }, [qc, projectId]);

  const addPiece = useCallback(async (piece: Omit<ProductionPiece, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('production_pieces').insert(piece as any);
    if (error) throw error;
    invalidate();
  }, [invalidate]);

  const updatePiece = useCallback(async (id: string, updates: Partial<ProductionPiece>) => {
    const { error } = await supabase.from('production_pieces').update(updates as any).eq('id', id);
    if (error) throw error;
    invalidate();
  }, [invalidate]);

  const deletePiece = useCallback(async (id: string) => {
    const { error } = await supabase.from('production_pieces').delete().eq('id', id);
    if (error) throw error;
    invalidate();
  }, [invalidate]);

  const bulkAddPieces = useCallback(async (items: Omit<ProductionPiece, 'id' | 'created_at' | 'updated_at'>[]) => {
    if (items.length === 0) return;
    const { error } = await supabase.from('production_pieces').insert(items as any);
    if (error) throw error;
    invalidate();
  }, [invalidate]);

  return { pieces, isLoading, addPiece, updatePiece, deletePiece, bulkAddPieces, invalidate };
}
