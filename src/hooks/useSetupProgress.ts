import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export interface SetupStep {
  key: string;
  label: string;
  description: string;
  icon: string;
  route: string;
  completed: boolean;
}

export function useSetupProgress() {
  const { user } = useAuth();
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['setup-progress', unitId],
    queryFn: async (): Promise<{ steps: SetupStep[]; isNewUnit: boolean }> => {
      if (!unitId) return { steps: [], isNewUnit: false };

      // Check if unit was created recently (within 48h) — old units skip setup
      const unitCreatedAt = activeUnit?.created_at;
      if (unitCreatedAt) {
        const ageMs = Date.now() - new Date(unitCreatedAt).getTime();
        const hours48 = 48 * 60 * 60 * 1000;
        if (ageMs > hours48) {
          return { steps: [], isNewUnit: false };
        }
      }

      const [suppliers, items, checklists, users, closings] = await Promise.all([
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('inventory_items').select('id', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('checklist_items').select('id', { count: 'exact', head: true }).eq('unit_id', unitId).is('deleted_at', null),
        supabase.from('user_units').select('id', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('cash_closings').select('id', { count: 'exact', head: true }).eq('unit_id', unitId),
      ]);

      const steps: SetupStep[] = [
        { key: 'supplier', label: 'Cadastre um fornecedor', description: 'Adicione seu primeiro fornecedor para fazer pedidos', icon: 'Truck', route: '/settings', completed: (suppliers.count ?? 0) > 0 },
        { key: 'inventory', label: 'Adicione um item ao estoque', description: 'Registre seus produtos para controlar o estoque', icon: 'Package', route: '/inventory', completed: (items.count ?? 0) > 0 },
        { key: 'checklist', label: 'Configure um checklist', description: 'Crie tarefas para abertura e fechamento', icon: 'ClipboardCheck', route: '/checklists', completed: (checklists.count ?? 0) > 0 },
        { key: 'team', label: 'Convide um funcionário', description: 'Adicione membros da equipe', icon: 'Users', route: '/settings', completed: (users.count ?? 0) > 1 },
        { key: 'closing', label: 'Faça seu primeiro fechamento', description: 'Registre o caixa do dia', icon: 'Receipt', route: '/cash-closing', completed: (closings.count ?? 0) > 0 },
      ];

      return { steps, isNewUnit: true };
    },
    enabled: !!user && !!unitId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const steps = data?.steps ?? [];
  const completedCount = steps.filter(s => s.completed).length;
  const totalCount = steps.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return { steps, completedCount, totalCount, allCompleted, progress, isLoading };
}
