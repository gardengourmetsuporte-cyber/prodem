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

interface UseChecklistCompletionsOptions {
  completions: ChecklistCompletion[];
  sectors: ChecklistSector[];
  userId: string | undefined;
  activeUnitId: string | null;
}

export function useChecklistCompletions({
  completions, sectors, userId, activeUnitId,
}: UseChecklistCompletionsOptions) {
  const queryClient = useQueryClient();

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
          ...(photoUrl ? { photo_url: photoUrl } : {}),
        } as any, { onConflict: 'item_id,completed_by,date,checklist_type' });
      if (error) throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['checklist-completions', date, checklistType, activeUnitId] });
    invalidateGamificationCaches(queryClient);
  }, [completions, userId, queryClient, activeUnitId]);

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
    invalidateGamificationCaches(queryClient);
  }, [completions, sectors, queryClient, activeUnitId]);

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
    return completions.some(c => c.item_id === itemId && (c as any).status !== 'in_progress');
  }, [completions]);

  const getItemStatus = useCallback((itemId: string) => {
    const completion = completions.find(c => c.item_id === itemId);
    if (!completion) return 'pending';
    return (completion as any).status || 'completed';
  }, [completions]);

  const startProduction = useCallback(async (
    itemId: string, checklistType: ChecklistType, date: string,
    completedByUserId?: string
  ) => {
    const targetUserId = completedByUserId || userId;
    const { error } = await supabase
      .from('checklist_completions')
      .upsert({
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
      } as any, { onConflict: 'item_id,completed_by,date,checklist_type' });
    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ['checklist-completions', date, checklistType, activeUnitId] });
  }, [userId, queryClient, activeUnitId]);

  const finishProduction = useCallback(async (
    itemId: string, checklistType: ChecklistType, date: string,
    quantityDone: number, points: number = 1, completedByUserId?: string
  ) => {
    const targetUserId = completedByUserId || userId;
    const existing = completions.find(
      c => c.item_id === itemId && c.checklist_type === checklistType && c.date === date
    );
    if (!existing) throw new Error('Inicie a produção antes de finalizar');

    const { error } = await supabase
      .from('checklist_completions')
      .update({
        status: 'completed',
        quantity_done: quantityDone,
        awarded_points: points > 0,
        points_awarded: points,
      } as any)
      .eq('id', existing.id);
    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ['checklist-completions', date, checklistType, activeUnitId] });
    invalidateGamificationCaches(queryClient);
  }, [completions, userId, queryClient, activeUnitId]);

  const getCompletionProgress = useCallback((sectorId: string, filterType?: ChecklistType) => {
    const sector = sectors.find(s => s.id === sectorId);
    if (!sector) return { completed: 0, total: 0 };

    let total = 0;
    let completed = 0;
    sector.subcategories?.forEach(sub => {
      sub.items?.forEach(item => {
        const itemType = (item as any).checklist_type;
        if (item.is_active && (!filterType || itemType === filterType)) {
          total++;
          if (isItemCompleted(item.id)) completed++;
        }
      });
    });
    return { completed, total };
  }, [sectors, isItemCompleted]);

  return {
    toggleCompletion,
    splitCompletion,
    contestCompletion,
    isItemCompleted,
    getItemStatus,
    getCompletionProgress,
    startProduction,
    finishProduction,
  };
}
