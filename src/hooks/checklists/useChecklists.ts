import { useCallback, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChecklistType } from '@/types/database';
import { fetchSectorsData, fetchCompletionsData, fetchAllShiftCompletionsData } from './useChecklistFetch';
import { useChecklistCRUD } from './useChecklistCRUD';
import { useChecklistCompletions } from './useChecklistCompletions';

export function useChecklists() {
  const { user } = useAuth();
  const { activeUnitId, isLoading: unitLoading } = useUnit();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentType, setCurrentType] = useState<ChecklistType>('abertura');

  const sectorsKey = useMemo(() => ['checklist-sectors', activeUnitId], [activeUnitId]);
  const completionsKey = useMemo(() => ['checklist-completions', currentDate, currentType, activeUnitId], [currentDate, currentType, activeUnitId]);
  const allShiftKey = useMemo(() => ['checklist-all-shift-completions', currentDate, activeUnitId], [currentDate, activeUnitId]);

  const { data: sectors = [], isLoading: sectorsLoading } = useQuery({
    queryKey: sectorsKey,
    queryFn: () => fetchSectorsData(activeUnitId),
    enabled: !!user && !!activeUnitId,
  });

  const { data: completions = [], isFetched: completionsFetched } = useQuery({
    queryKey: completionsKey,
    queryFn: () => fetchCompletionsData(currentDate, currentType, activeUnitId),
    enabled: !!user && !!currentDate && !!currentType && !!activeUnitId,
    staleTime: 30_000,
  });

  // Cross-shift: all completions for the day (both abertura + fechamento)
  const { data: allShiftCompletions = [] } = useQuery({
    queryKey: allShiftKey,
    queryFn: () => fetchAllShiftCompletionsData(currentDate, activeUnitId),
    enabled: !!user && !!currentDate && !!activeUnitId,
    staleTime: 30_000,
  });

  const isLoading = unitLoading || sectorsLoading || (!activeUnitId && !!user);

  const invalidateSectors = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: sectorsKey });
  }, [queryClient, sectorsKey]);

  const fetchCompletions = useCallback(async (date: string, type: ChecklistType) => {
    setCurrentDate(date);
    setCurrentType(type);
    await queryClient.invalidateQueries({ queryKey: ['checklist-completions', date, type, activeUnitId] });
    await queryClient.invalidateQueries({ queryKey: ['checklist-all-shift-completions', date, activeUnitId] });
  }, [queryClient, activeUnitId]);

  const crud = useChecklistCRUD({ sectors, sectorsKey, activeUnitId, invalidateSectors });
  const completionOps = useChecklistCompletions({
    completions, sectors, userId: user?.id, activeUnitId, allShiftCompletions,
  });

  return {
    sectors, completions, completionsFetched, isLoading, allShiftCompletions,
    ...crud,
    ...completionOps,
    fetchCompletions,
    refetch: invalidateSectors,
  };
}
