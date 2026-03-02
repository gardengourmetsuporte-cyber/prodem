import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ChecklistSector,
  ChecklistCompletion,
  ChecklistType,
} from '@/types/database';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateGamificationCaches } from '@/lib/queryKeys';

interface AllShiftCompletion {
  item_id: string;
  checklist_type: string;
  quantity_done: number;
  points_awarded: number;
  is_skipped: boolean;
  status: string;
}

interface UseChecklistCompletionsOptions {
  completions: ChecklistCompletion[];
  sectors: ChecklistSector[];
  userId: string | undefined;
  activeUnitId: string | null;
  allShiftCompletions: AllShiftCompletion[];
}

export function useChecklistCompletions({
  completions, sectors, userId, activeUnitId, allShiftCompletions,
}: UseChecklistCompletionsOptions) {
  const queryClient = useQueryClient();

  // Helper to also invalidate production report caches
  const invalidateProductionCaches = useCallback((date: string) => {
    queryClient.invalidateQueries({ queryKey: ['production-completions', activeUnitId, date, 1] });
    queryClient.invalidateQueries({ queryKey: ['production-completions', activeUnitId, date, 2] });
  }, [queryClient, activeUnitId]);

  const toggleCompletion = useCallback(async (
    itemId: string, checklistType: ChecklistType, date: string,
    isAdmin?: boolean, points: number = 1, completedByUserId?: string,
    isSkipped?: boolean, photoUrl?: string
  ) => {
    const existing = completions.find(
      c => c.item_id === itemId && c.checklist_type === checklistType && c.date === date
    );

    if (existing) {
      const completedAt = new Date(existing.completed_at);
      const minutesSinceCompletion = (Date.now() - completedAt.getTime()) / 60_000;
      const isOwnCompletion = existing.completed_by === userId;
      const isWithinGracePeriod = minutesSinceCompletion <= 5;

      if (!isAdmin && !isOwnCompletion) {
        throw new Error('Apenas o administrador pode desmarcar tarefas de outros usuários');
      }
      if (!isAdmin && !isWithinGracePeriod) {
        throw new Error('Não é possível desmarcar após 5 minutos. Solicite ao administrador.');
      }

      const { error } = await supabase.from('checklist_completions').delete().eq('id', existing.id);
      if (error) throw error;
    } else {
      const targetUserId = completedByUserId || userId;
      const { error } = await supabase
        .from('checklist_completions')
        .upsert({
          item_id: itemId, checklist_type: checklistType,
          completed_by: targetUserId, date,
          awarded_points: !isSkipped && points > 0,
          points_awarded: isSkipped ? 0 : points,
          is_skipped: isSkipped || false,
          unit_id: activeUnitId,
          status: isSkipped ? 'skipped' : 'completed',
          ...(photoUrl ? { photo_url: photoUrl } : {}),
        } as any, { onConflict: 'item_id,completed_by,date,checklist_type' });
      if (error) throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['checklist-completions', date, checklistType, activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['checklist-all-shift-completions', date, activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['card-completions', date, 'abertura', activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['card-completions', date, 'fechamento', activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-checklist-completions'] });
    invalidateGamificationCaches(queryClient);
    invalidateProductionCaches(date);
  }, [completions, userId, queryClient, activeUnitId, invalidateProductionCaches]);

  const splitCompletion = useCallback(async (
    itemId: string, date: string, checklistType: ChecklistType, userIds: string[]
  ) => {
    if (userIds.length < 2) throw new Error('Selecione ao menos 2 participantes');

    const originalCompletion = completions.find(
      c => c.item_id === itemId && c.checklist_type === checklistType && c.date === date && !c.is_skipped
    );
    if (!originalCompletion) throw new Error('Conclusão original não encontrada');

    const itemData = sectors.flatMap(s => s.subcategories?.flatMap(sub => sub.items || []) || []).find(i => i.id === itemId);
    const originalPoints = itemData?.points ?? originalCompletion.points_awarded ?? 1;
    const pointsPerPerson = Math.floor(originalPoints / userIds.length);
    const remainder = originalPoints - (pointsPerPerson * userIds.length);

    const originalGets = pointsPerPerson + remainder;
    const { error: updateError } = await supabase
      .from('checklist_completions')
      .update({ points_awarded: originalGets, awarded_points: originalGets > 0 })
      .eq('id', originalCompletion.id);
    if (updateError) throw updateError;

    const otherUserIds = userIds.filter(uid => uid !== originalCompletion.completed_by);
    if (otherUserIds.length > 0) {
      const rows = otherUserIds.map(uid => ({
        item_id: itemId,
        checklist_type: checklistType,
        completed_by: uid,
        date,
        awarded_points: pointsPerPerson > 0,
        points_awarded: pointsPerPerson,
        is_skipped: false,
        unit_id: activeUnitId,
      }));
      const { error: insertError } = await supabase
        .from('checklist_completions')
        .upsert(rows, { onConflict: 'item_id,completed_by,date,checklist_type' });
      if (insertError) throw insertError;
    }

    queryClient.invalidateQueries({ queryKey: ['checklist-completions', date, checklistType, activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['checklist-all-shift-completions', date, activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['card-completions', date, 'abertura', activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['card-completions', date, 'fechamento', activeUnitId] });
    invalidateGamificationCaches(queryClient);
    invalidateProductionCaches(date);
  }, [completions, sectors, queryClient, activeUnitId, invalidateProductionCaches]);

  const contestCompletion = useCallback(async (completionId: string, reason: string) => {
    if (!userId) throw new Error('Usuário não autenticado');
    if (!reason.trim()) throw new Error('Motivo é obrigatório');

    const completion = completions.find(c => c.id === completionId);
    if (!completion) throw new Error('Conclusão não encontrada');

    const { error } = await supabase
      .from('checklist_completions')
      .update({
        is_contested: true,
        contested_by: userId,
        contested_reason: reason.trim(),
        contested_at: new Date().toISOString(),
        awarded_points: false,
        points_awarded: 0,
      } as any)
      .eq('id', completionId);
    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ['checklist-completions'] });
    invalidateGamificationCaches(queryClient);
    invalidateProductionCaches(new Date().toISOString().slice(0, 10));

    // Notify (fire-and-forget)
    supabase.from('notifications').insert({
      user_id: completion.completed_by,
      title: 'Item contestado',
      description: `Seu item foi contestado: "${reason.trim()}"`,
      type: 'alert',
      origin: 'checklist',
      unit_id: activeUnitId,
    } as any).then(({ error: notifErr }) => {
      if (notifErr) console.warn('Failed to send contest notification:', notifErr);
    });

    toast.success('Item contestado com sucesso');
  }, [completions, userId, queryClient, activeUnitId]);

  const isItemCompleted = useCallback((itemId: string) => {
    // Production items: completed once ANY shift has status='completed' (even if qty < target)
    const hasCompletedCompletion = allShiftCompletions.some(
      c => c.item_id === itemId && !c.is_skipped && c.status === 'completed'
    );
    if (hasCompletedCompletion) return true;

    // Non-production item: completed if any non-in_progress completion exists
    const hasCompletion = allShiftCompletions.some(
      c => c.item_id === itemId && c.status !== 'in_progress'
    );
    return hasCompletion;
  }, [allShiftCompletions]);

  const getItemStatus = useCallback((itemId: string) => {
    const completion = completions.find(c => c.item_id === itemId);
    if (completion) return (completion as any).status || 'completed';

    // Check cross-shift
    const otherCompleted = allShiftCompletions.find(c => c.item_id === itemId && c.status === 'completed');
    if (otherCompleted) return 'completed';
    const otherSkipped = allShiftCompletions.find(c => c.item_id === itemId && c.status === 'skipped');
    if (otherSkipped) return 'completed';
    const inProgress = allShiftCompletions.find(c => c.item_id === itemId && c.status === 'in_progress');
    if (inProgress) return 'in_progress';
    return 'pending';
  }, [completions, allShiftCompletions]);

  /** Get cross-shift accumulated progress for an item (for production items with target_quantity) */
  const getCrossShiftItemProgress = useCallback((itemId: string) => {
    const itemData = sectors.flatMap(s => s.subcategories?.flatMap(sub => sub.items || []) || []).find(i => i.id === itemId);
    const targetQty = (itemData as any)?.target_quantity || 0;

    const allCompletions = allShiftCompletions.filter(c => c.item_id === itemId && !c.is_skipped);
    const totalDone = allCompletions
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + (c.quantity_done || 0), 0);
    const remaining = Math.max(0, targetQty - totalDone);
    const isFullyComplete = targetQty > 0 ? totalDone >= targetQty : allCompletions.some(c => c.status === 'completed');

    return { targetQty, totalDone, remaining, isFullyComplete };
  }, [sectors, allShiftCompletions]);

  const getCompletionProgress = useCallback((sectorId: string, filterType?: ChecklistType) => {
    const sector = sectors.find(s => s.id === sectorId);
    if (!sector) return { completed: 0, total: 0 };

    let total = 0;
    let completed = 0;
    sector.subcategories?.forEach(sub => {
      sub.items?.forEach(item => {
        // Show ALL standard items regardless of checklist_type (cross-shift)
        if (item.is_active && (!filterType || filterType !== 'bonus')) {
          // For standard items, include items of any checklist_type (abertura/fechamento)
          const itemType = (item as any).checklist_type;
          if (filterType && filterType !== 'bonus' && itemType !== 'abertura' && itemType !== 'fechamento') return;
          total++;
          if (isItemCompleted(item.id)) completed++;
        } else if (filterType === 'bonus') {
          const itemType = (item as any).checklist_type;
          if (itemType !== 'bonus') return;
          if (!item.is_active) return;
          total++;
          if (isItemCompleted(item.id)) completed++;
        }
      });
    });
    return { completed, total };
  }, [sectors, isItemCompleted]);

  const startProduction = useCallback(async (
    itemId: string, checklistType: ChecklistType, date: string,
    completedByUserId?: string
  ) => {
    const targetUserId = completedByUserId || userId;
    
    // Check if there's already an in_progress completion for this item
    const { data: existing } = await supabase
      .from('checklist_completions')
      .select('id, status, finished_at')
      .eq('item_id', itemId)
      .eq('completed_by', targetUserId)
      .eq('date', date)
      .eq('checklist_type', checklistType as any)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'in_progress') {
        // Already in progress, just invalidate caches to refresh UI
        invalidateProductionCaches(date);
        return;
      }
      // Item was previously completed — update to restart (keep old data, reset status)
      const { error } = await supabase
        .from('checklist_completions')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
          finished_at: null,
        } as any)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      // Create new completion
      const { error } = await supabase
        .from('checklist_completions')
        .insert({
          item_id: itemId,
          checklist_type: checklistType,
          completed_by: targetUserId,
          date,
          awarded_points: false,
          points_awarded: 0,
          is_skipped: false,
          unit_id: activeUnitId,
          status: 'in_progress',
          quantity_done: 0,
          started_at: new Date().toISOString(),
        } as any);
      if (error) throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['checklist-completions', date, checklistType, activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['checklist-all-shift-completions', date, activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['card-completions', date, 'abertura', activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['card-completions', date, 'fechamento', activeUnitId] });
    invalidateProductionCaches(date);
  }, [userId, queryClient, activeUnitId, invalidateProductionCaches]);

  const finishProduction = useCallback(async (
    itemId: string, checklistType: ChecklistType, date: string,
    quantityDone: number, points: number = 1, completedByUserId?: string, machineRef?: string
  ) => {
    const targetUserId = completedByUserId || userId;
    
    // Fetch from DB directly to avoid stale state
    const { data: existing, error: fetchErr } = await supabase
      .from('checklist_completions')
      .select('id')
      .eq('item_id', itemId)
      .eq('completed_by', targetUserId)
      .eq('date', date)
      .eq('checklist_type', checklistType as any)
      .eq('status', 'in_progress')
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) throw new Error('Inicie a produção antes de finalizar');

    const updateData: any = {
      status: 'completed',
      quantity_done: quantityDone,
      awarded_points: points > 0,
      points_awarded: points,
      finished_at: new Date().toISOString(),
    };
    if (machineRef) updateData.machine_ref = machineRef;

    const { error } = await supabase
      .from('checklist_completions')
      .update(updateData)
      .eq('id', existing.id);
    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ['checklist-completions', date, checklistType, activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['checklist-all-shift-completions', date, activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['card-completions', date, 'abertura', activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['card-completions', date, 'fechamento', activeUnitId] });
    invalidateGamificationCaches(queryClient);
    invalidateProductionCaches(date);
  }, [userId, queryClient, activeUnitId, invalidateProductionCaches]);

  const updateProductionQuantity = useCallback(async (
    completionId: string, date: string, checklistType: ChecklistType, newQuantity: number
  ) => {
    const { error } = await supabase
      .from('checklist_completions')
      .update({ quantity_done: newQuantity } as any)
      .eq('id', completionId);
    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ['checklist-completions', date, checklistType, activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['checklist-all-shift-completions', date, activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['card-completions', date, 'abertura', activeUnitId] });
    queryClient.invalidateQueries({ queryKey: ['card-completions', date, 'fechamento', activeUnitId] });
    invalidateProductionCaches(date);
  }, [queryClient, activeUnitId, invalidateProductionCaches]);

  return {
    toggleCompletion,
    splitCompletion,
    contestCompletion,
    isItemCompleted,
    getItemStatus,
    getCompletionProgress,
    getCrossShiftItemProgress,
    startProduction,
    finishProduction,
    updateProductionQuantity,
  };
}
