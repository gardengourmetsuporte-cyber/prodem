import { supabase } from '@/integrations/supabase/client';
import {
  ChecklistSector,
  ChecklistCompletion,
  ChecklistType,
} from '@/types/database';

export async function fetchSectorsData(unitId: string | null) {
  let query = supabase
    .from('checklist_sectors')
    .select(`
      *,
      subcategories:checklist_subcategories(
        *,
        items:checklist_items(*)
      )
    `)
    .order('sort_order')
    .order('sort_order', { referencedTable: 'subcategories' })
    .order('sort_order', { referencedTable: 'subcategories.items' });

  if (unitId) query = query.or(`unit_id.eq.${unitId},unit_id.is.null`);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(sector => ({
    ...sector,
    subcategories: (sector.subcategories || []).map((sub: any) => ({
      ...sub,
      items: (sub.items || []).filter((item: any) => item.deleted_at === null)
    }))
  })) as ChecklistSector[];
}

export async function fetchCompletionsData(date: string, type: ChecklistType, unitId: string | null) {
  let query = supabase
    .from('checklist_completions')
    .select('*')
    .eq('date', date)
    .eq('checklist_type', type);
  if (unitId) query = query.or(`unit_id.eq.${unitId},unit_id.is.null`);
  const { data: completionsData, error } = await query;

  if (error) throw error;

  // Batch profile fetch
  const userIds = [...new Set((completionsData || []).map(c => c.completed_by))];
  const profileMap = new Map<string, { full_name: string }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);
    (profiles || []).forEach(p => profileMap.set(p.user_id, { full_name: p.full_name }));
  }

  const sorted = (completionsData || [])
    .map(c => ({
      ...c,
      awarded_points: c.awarded_points ?? true,
      profile: profileMap.get(c.completed_by),
    }))
    .sort((a, b) => {
      if (a.is_skipped && !b.is_skipped) return 1;
      if (!a.is_skipped && b.is_skipped) return -1;
      return 0;
    });

  return sorted as unknown as ChecklistCompletion[];
}

/** Fetch completions for ALL shifts on a given date (cross-shift accumulation) */
export async function fetchAllShiftCompletionsData(date: string, unitId: string | null) {
  let query = supabase
    .from('checklist_completions')
    .select('item_id, checklist_type, quantity_done, points_awarded, is_skipped, status')
    .eq('date', date);
  if (unitId) query = query.or(`unit_id.eq.${unitId},unit_id.is.null`);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as { item_id: string; checklist_type: string; quantity_done: number; points_awarded: number; is_skipped: boolean; status: string }[];
}
