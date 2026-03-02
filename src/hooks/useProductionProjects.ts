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

    // 2. Insert Items into production_pieces (new table)
    if (items && items.length > 0 && newProject?.id) {
      // Fetch checklist item details to populate production_pieces
      const itemIds = items.map(i => i.checklist_item_id);
      const { data: checklistItems } = await supabase
        .from('checklist_items')
        .select('id, name, material_code, cut_length_mm, qty_per_rack, process_type, piece_dimensions')
        .in('id', itemIds);

      const itemMap = new Map((checklistItems || []).map(ci => [ci.id, ci]));

      const pieceRows = items.map((i, idx) => {
        const ci = itemMap.get(i.checklist_item_id);
        return {
          project_id: newProject.id,
          unit_id: unitId,
          material_code: ci?.material_code || null,
          description: ci?.name || 'Peça',
          cut_length_mm: ci?.cut_length_mm || null,
          qty_per_rack: ci?.qty_per_rack || 1,
          qty_total: i.quantity_ordered,
          process_type: ci?.process_type || 'SERRA',
          sort_order: idx,
        };
      });

      const { error: piecesError } = await supabase.from('production_pieces').insert(pieceRows as any);
      if (piecesError) throw piecesError;

      // Also save to legacy table for backward compat
      const legacyRows = items.map(i => ({
        project_id: newProject.id,
        checklist_item_id: i.checklist_item_id,
        quantity_ordered: i.quantity_ordered,
        unit_id: unitId,
      }));
      try {
        await supabase.from('production_order_items').insert(legacyRows as any);
      } catch (_) { /* legacy table might not exist */ }
    }

    queryClient.invalidateQueries({ queryKey: ['production-projects', unitId] });
    queryClient.invalidateQueries({ queryKey: ['production-pieces', newProject?.id] });
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
      // Clear existing pieces
      await (supabase.from('production_pieces') as any).delete().eq('project_id', id);

      if (items.length > 0) {
        const itemIds = items.map(i => i.checklist_item_id);
        const { data: checklistItems } = await supabase
          .from('checklist_items')
          .select('id, name, material_code, cut_length_mm, qty_per_rack, process_type, piece_dimensions')
          .in('id', itemIds);
        const itemMap = new Map((checklistItems || []).map(ci => [ci.id, ci]));

        const pieceRows = items.map((i, idx) => {
          const ci = itemMap.get(i.checklist_item_id);
          return {
            project_id: id,
            unit_id: unitId!,
            material_code: ci?.material_code || null,
            description: ci?.name || 'Peça',
            cut_length_mm: ci?.cut_length_mm || null,
            qty_per_rack: ci?.qty_per_rack || 1,
            qty_total: i.quantity_ordered,
            process_type: ci?.process_type || 'SERRA',
            sort_order: idx,
          };
        });
        await supabase.from('production_pieces').insert(pieceRows as any);
      }

      // Legacy sync
      try {
        await (supabase.from('production_order_items') as any).delete().eq('project_id', id);
        if (items.length > 0) {
          const legacyRows = items.map(i => ({
            project_id: id,
            checklist_item_id: i.checklist_item_id,
            quantity_ordered: i.quantity_ordered,
            unit_id: unitId!,
          }));
          await supabase.from('production_order_items').insert(legacyRows as any);
        }
      } catch (_) {}
      queryClient.invalidateQueries({ queryKey: ['production-pieces'] });
      queryClient.invalidateQueries({ queryKey: ['production-project-items'] });
    }

    queryClient.invalidateQueries({ queryKey: ['production-projects', unitId] });
  }, [unitId, queryClient]);

  const deleteProject = useCallback(async (id: string) => {
    // Delete completions
    await (supabase.from('checklist_completions') as any).delete().eq('project_id', id);
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
