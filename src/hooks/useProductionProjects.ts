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
  material?: string;
  thickness?: string;
  plate_size?: string;
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

  const createProject = useCallback(async (
    data: { project_number: string; description: string; client?: string; material?: string; thickness?: string; plate_size?: string },
    items?: { checklist_item_id: string; quantity_ordered: number }[]
  ) => {
    if (!unitId) throw new Error('No unit');

    // 1. Create Project
    const { data: newProject, error } = await supabase
      .from('production_projects')
      .insert({ unit_id: unitId, ...data })
      .select('id')
      .single();

    if (error) throw error;

    // 2. Insert Items if any
    if (items && items.length > 0 && newProject?.id) {
      const rows = items.map(i => ({
        project_id: newProject.id,
        checklist_item_id: i.checklist_item_id,
        quantity_ordered: i.quantity_ordered,
        unit_id: unitId,
      }));
      const { error: itemsError } = await supabase.from('production_order_items').insert(rows);
      if (itemsError) throw itemsError;
    }

    queryClient.invalidateQueries({ queryKey: ['production-projects', unitId] });
    return newProject?.id;
  }, [unitId, queryClient]);

  const updateProject = useCallback(async (
    id: string,
    data: Partial<Pick<ProductionProject, 'project_number' | 'description' | 'client' | 'status' | 'material' | 'thickness' | 'plate_size'>>,
    items?: { checklist_item_id: string; quantity_ordered: number }[]
  ) => {
    // 1. Update Project
    const { error } = await supabase
      .from('production_projects')
      .update(data)
      .eq('id', id);
    if (error) throw error;

    // 2. Update Items if provided
    if (items) {
      // Clear existing for a clean sync
      await supabase.from('production_order_items').delete().eq('project_id', id);

      if (items.length > 0) {
        const rows = items.map(i => ({
          project_id: id,
          checklist_item_id: i.checklist_item_id,
          quantity_ordered: i.quantity_ordered,
          unit_id: unitId!,
        }));
        const { error: itemsError } = await supabase.from('production_order_items').insert(rows);
        if (itemsError) throw itemsError;
      }
      queryClient.invalidateQueries({ queryKey: ['production-project-items'] });
    }

    queryClient.invalidateQueries({ queryKey: ['production-projects', unitId] });
  }, [unitId, queryClient]);

  const deleteProject = useCallback(async (id: string) => {
    // Delete completions
    await supabase.from('checklist_completions').delete().eq('project_id', id);
    // Delete items
    await supabase.from('production_order_items').delete().eq('project_id', id);
    // Delete groupings
    await supabase.from('production_groupings').delete().eq('project_id', id);
    // Delete Project
    const { error } = await supabase
      .from('production_projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['production-projects', unitId] });
    queryClient.invalidateQueries({ queryKey: ['production-project-items'] });
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
