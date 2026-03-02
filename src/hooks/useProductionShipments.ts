import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useMemo } from 'react';

export interface ProductionShipment {
  id: string;
  piece_id: string;
  project_id: string;
  unit_id: string;
  quantity: number;
  shipped_at: string;
  operator_id: string | null;
  destination: string | null;
  requester: string | null;
  created_at: string;
}

export function useProductionShipments(projectId: string | null, unitId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['production-shipments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_shipments')
        .select('*')
        .eq('project_id', projectId!)
        .order('shipped_at', { ascending: false });
      if (error) throw error;
      return data as ProductionShipment[];
    },
    enabled: !!user && !!projectId,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['production-shipments', projectId] });
  }, [qc, projectId]);

  const shippedByPiece = useMemo(() => {
    const map = new Map<string, number>();
    shipments.forEach(s => {
      map.set(s.piece_id, (map.get(s.piece_id) || 0) + s.quantity);
    });
    return map;
  }, [shipments]);

  const addShipment = useCallback(async (s: Omit<ProductionShipment, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('production_shipments').insert(s as any);
    if (error) throw error;
    invalidate();
  }, [invalidate]);

  return { shipments, isLoading, shippedByPiece, addShipment, invalidate };
}
