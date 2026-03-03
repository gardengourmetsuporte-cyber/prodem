import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getUnitTheme, applyUnitTheme } from '@/lib/unitThemes';
import { toast } from 'sonner';

export interface Unit {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface UnitContextType {
  units: Unit[];
  activeUnit: Unit | null;
  activeUnitId: string | null;
  setActiveUnitId: (id: string) => void;
  isLoading: boolean;
  isTransitioning: boolean;
  refetchUnits: () => Promise<void>;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

const ACTIVE_UNIT_KEY = 'prodem_active_unit_id';

export function UnitProvider({ children }: { children: ReactNode }) {
  const { user, isSuperAdmin, isLoading: authLoading, setEffectivePlan } = useAuth();
  const queryClient = useQueryClient();
  const [units, setUnits] = useState<Unit[]>([]);
  const [activeUnitId, setActiveUnitIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hasInitialized = useRef(false);
  // Read isSuperAdmin via ref so fetchUnits doesn't re-create when role loads
  const isSuperAdminRef = useRef(isSuperAdmin);
  isSuperAdminRef.current = isSuperAdmin;
  // Fetch sequence counter for deduplication
  const fetchIdRef = useRef(0);

  const fetchUnits = useCallback(async () => {
    if (!user) {
      setUnits([]);
      setIsLoading(false);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setIsLoading(true);

    try {
      const { data: userUnitsData } = await supabase
        .from('user_units')
        .select('unit_id, is_default')
        .eq('user_id', user.id);

      // Stale check: if a newer fetch started, abandon this one
      if (fetchId !== fetchIdRef.current) return;

      if (!userUnitsData || userUnitsData.length === 0) {
        if (isSuperAdminRef.current) {
          const { data: allUnits } = await supabase
            .from('units')
            .select('*')
            .eq('is_active', true)
            .order('name');

          if (fetchId !== fetchIdRef.current) return;

          setUnits((allUnits as Unit[]) || []);

          const stored = localStorage.getItem(ACTIVE_UNIT_KEY);
          const validUnit = (allUnits || []).find(u => u.id === stored);
          if (validUnit) {
            setActiveUnitIdState(validUnit.id);
          } else if (allUnits && allUnits.length > 0) {
            setActiveUnitIdState(allUnits[0].id);
          }
        } else {
          // Check profile status — if pending, don't auto-provision
          const { data: profileData } = await supabase
            .from('profiles')
            .select('status')
            .eq('user_id', user.id)
            .maybeSingle();

          if (fetchId !== fetchIdRef.current) return;

          if (profileData?.status === 'pending') {
            console.log('[UnitContext] Profile pending approval, skipping auto-provision');
            setUnits([]);
          } else {
            // Check for pending invites
            const { data: pendingInvites } = await supabase
              .from('invites')
              .select('id')
              .eq('email', user.email!)
              .is('accepted_at', null)
              .limit(1);

            if (fetchId !== fetchIdRef.current) return;

            if (pendingInvites && pendingInvites.length > 0) {
              console.log('[UnitContext] Pending invite found, skipping auto-provision');
              setUnits([]);
            } else {
              // Auto-provision
              try {
                const { data: newUnitId, error: provisionError } = await supabase
                  .rpc('auto_provision_unit', { p_user_id: user.id });
                if (provisionError) throw provisionError;

              if (fetchId !== fetchIdRef.current) return;

              if (newUnitId) {
                const { data: newUnits } = await supabase
                  .from('units')
                  .select('*')
                  .eq('id', newUnitId);

                if (fetchId !== fetchIdRef.current) return;

                setUnits((newUnits as Unit[]) || []);
                if (newUnits && newUnits.length > 0) {
                  setActiveUnitIdState(newUnits[0].id);
                  localStorage.setItem(ACTIVE_UNIT_KEY, newUnits[0].id);
                }
              }
            } catch (err) {
              console.error('Auto-provision failed:', err);
              if (fetchId !== fetchIdRef.current) return;

              try {
                const { data: ownedUnits } = await supabase
                  .from('units')
                  .select('*')
                  .eq('created_by', user.id)
                  .eq('is_active', true)
                  .order('name')
                  .limit(5);

                if (fetchId !== fetchIdRef.current) return;

                if (ownedUnits && ownedUnits.length > 0) {
                  await supabase.from('user_units').upsert({
                    user_id: user.id,
                    unit_id: ownedUnits[0].id,
                    is_default: true,
                  }, { onConflict: 'user_id,unit_id' });
                  setUnits(ownedUnits as Unit[]);
                  setActiveUnitIdState(ownedUnits[0].id);
                  localStorage.setItem(ACTIVE_UNIT_KEY, ownedUnits[0].id);
                } else {
                  setUnits([]);
                }
              } catch {
                setUnits([]);
              }
            }
            }
          }
        }
      } else {
        const unitIds = userUnitsData.map(u => u.unit_id);
        const { data: unitsData } = await supabase
          .from('units')
          .select('*')
          .in('id', unitIds)
          .eq('is_active', true)
          .order('name');

        if (fetchId !== fetchIdRef.current) return;

        setUnits((unitsData as Unit[]) || []);

        const stored = localStorage.getItem(ACTIVE_UNIT_KEY);
        const validUnit = (unitsData || []).find(u => u.id === stored);
        if (validUnit) {
          setActiveUnitIdState(validUnit.id);
        } else {
          const defaultAssign = userUnitsData.find(u => u.is_default);
          const defaultUnit = defaultAssign
            ? (unitsData || []).find(u => u.id === defaultAssign.unit_id)
            : (unitsData || [])[0];
          if (defaultUnit) {
            setActiveUnitIdState(defaultUnit.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch units:', err);
      if (fetchId !== fetchIdRef.current) return;
      toast.error('Erro ao carregar lojas. Tente recarregar a página.');
    } finally {
      // Only the latest fetch sets loading to false
      if (fetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]); // Only depends on user, not isSuperAdmin

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Simplified loading: just combine auth + unit loading
  const effectiveLoading = isLoading || authLoading;

  const activeUnit = units.find(u => u.id === activeUnitId) || null;

  // Resolve effective plan from unit owner whenever activeUnitId changes
  useEffect(() => {
    if (!activeUnitId) return;
    let cancelled = false;
    supabase.rpc('get_unit_plan', { p_unit_id: activeUnitId }).then(({ data }) => {
      if (!cancelled && data) {
        setEffectivePlan(data as any);
      }
    });
    return () => { cancelled = true; };
  }, [activeUnitId, setEffectivePlan]);

  // Apply theme when activeUnit changes
  useEffect(() => {
    if (!activeUnit) return;
    const theme = getUnitTheme(activeUnit.slug);
    applyUnitTheme(theme);

    if (hasInitialized.current) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 200);
      return () => clearTimeout(timer);
    }
    hasInitialized.current = true;
  }, [activeUnit?.id, activeUnit?.slug]);

  const setActiveUnitId = useCallback((id: string) => {
    if (id === activeUnitId) return;
    // Cancel in-flight queries from old unit and clear stale data
    queryClient.cancelQueries();
    queryClient.removeQueries({ predicate: (q) => q.queryKey.includes(activeUnitId) });
    setActiveUnitIdState(id);
    localStorage.setItem(ACTIVE_UNIT_KEY, id);
  }, [activeUnitId, queryClient]);

  return (
    <UnitContext.Provider
      value={{
        units,
        activeUnit,
        activeUnitId,
        setActiveUnitId,
        isLoading: effectiveLoading,
        isTransitioning,
        refetchUnits: fetchUnits,
      }}
    >
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  const context = useContext(UnitContext);
  if (context === undefined) {
    throw new Error('useUnit must be used within a UnitProvider');
  }
  return context;
}
