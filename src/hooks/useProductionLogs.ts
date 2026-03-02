import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useEffect, useMemo } from 'react';

export interface ProductionLog {
  id: string;
  piece_id: string;
  project_id: string;
  unit_id: string;
  operation: string;
  started_at: string | null;
  finished_at: string | null;
  quantity_done: number;
  operator_id: string | null;
  machine_ref: string | null;
  date: string;
  created_at: string;
}

export interface PieceProgress {
  piece_id: string;
  total_done: number;
  in_progress: boolean;
  logs: ProductionLog[];
}

export function useProductionLogs(projectId: string | null, unitId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['production-logs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_logs')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ProductionLog[];
    },
    enabled: !!user && !!projectId,
    refetchInterval: 10_000,
  });

  // Realtime
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`prod-logs-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_logs', filter: `project_id=eq.${projectId}` }, () => {
        qc.invalidateQueries({ queryKey: ['production-logs', projectId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, qc]);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['production-logs', projectId] });
  }, [qc, projectId]);

  // Progress per piece
  const progressMap = useMemo(() => {
    const map = new Map<string, PieceProgress>();
    logs.forEach(log => {
      if (!map.has(log.piece_id)) {
        map.set(log.piece_id, { piece_id: log.piece_id, total_done: 0, in_progress: false, logs: [] });
      }
      const p = map.get(log.piece_id)!;
      p.logs.push(log);
      p.total_done += log.quantity_done;
      if (log.started_at && !log.finished_at) p.in_progress = true;
    });
    return map;
  }, [logs]);

  const addLog = useCallback(async (log: Omit<ProductionLog, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('production_logs').insert(log as any);
    if (error) throw error;
    invalidate();
  }, [invalidate]);

  const updateLog = useCallback(async (id: string, updates: Partial<ProductionLog>) => {
    const { error } = await supabase.from('production_logs').update(updates as any).eq('id', id);
    if (error) throw error;
    invalidate();
  }, [invalidate]);

  const deleteLog = useCallback(async (id: string) => {
    const { error } = await supabase.from('production_logs').delete().eq('id', id);
    if (error) throw error;
    invalidate();
  }, [invalidate]);

  return { logs, isLoading, progressMap, addLog, updateLog, deleteLog, invalidate };
}
