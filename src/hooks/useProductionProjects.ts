import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

export interface ProductionProject {
  id: string;
  unit_id: string;
  project_number: string;
  description: string;
  client: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useProductionProjects(unitId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['production-projects', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_projects')
        .select('*')
        .eq('unit_id', unitId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProductionProject[];
    },
    enabled: !!user && !!unitId,
  });

  const activeProjects = projects.filter(p => p.status === 'active');

  const createProject = useCallback(async (data: { project_number: string; description: string; client?: string }) => {
    if (!unitId) throw new Error('No unit');
    const { error } = await supabase
      .from('production_projects')
      .insert({ unit_id: unitId, ...data });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['production-projects', unitId] });
  }, [unitId, queryClient]);

  const updateProject = useCallback(async (id: string, data: Partial<Pick<ProductionProject, 'project_number' | 'description' | 'client' | 'status'>>) => {
    const { error } = await supabase
      .from('production_projects')
      .update(data)
      .eq('id', id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['production-projects', unitId] });
  }, [unitId, queryClient]);

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('production_projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['production-projects', unitId] });
  }, [unitId, queryClient]);

  return {
    projects,
    activeProjects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
  };
}
