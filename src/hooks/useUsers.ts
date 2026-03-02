import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole, UserStatus } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export interface UserWithRole extends Profile {
  role: AppRole;
  unitRole?: string; // role within the active unit (owner/admin/member)
  sectorName?: string;
  sectorModuleId?: string;
}

export function useUsers() {
  const { isAdmin } = useAuth();
  const { activeUnitId } = useUnit();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin && activeUnitId) {
      fetchUsers();
    } else if (isAdmin && !activeUnitId) {
      setIsLoading(false);
    }
  }, [isAdmin, activeUnitId]);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      // 1. Get user_ids belonging to the active unit
      const { data: unitMembers, error: unitError } = await supabase
        .from('user_units')
        .select('user_id, role, sector_module_id')
        .eq('unit_id', activeUnitId!);

      if (unitError) throw unitError;

      const memberUserIds = (unitMembers || []).map(m => m.user_id);

      // 2. Fetch profiles for unit members AND pending users (not yet in any unit)
      const [profilesResult, rolesResult, pendingResult, sectorsResult] = await Promise.all([
        memberUserIds.length > 0
          ? supabase.from('profiles').select('*').in('user_id', memberUserIds).order('full_name')
          : Promise.resolve({ data: [], error: null }),
        memberUserIds.length > 0
          ? supabase.from('user_roles').select('*').in('user_id', memberUserIds)
          : Promise.resolve({ data: [], error: null }),
        // Fetch ALL pending users (not yet assigned to any unit)
        supabase.from('profiles').select('*').eq('status', 'pending' as any).order('created_at', { ascending: false }),
        supabase.from('sector_modules').select('id, sector_name').eq('unit_id', activeUnitId!),
      ]);

      if (profilesResult.error) throw profilesResult.error;

      const sectorMap = new Map((sectorsResult.data || []).map(s => [s.id, s.sector_name]));

      // 3. Combine — pick highest role if duplicates exist
      const rolePriority: Record<string, number> = { super_admin: 4, admin: 3, lider: 2, funcionario: 1 };
      const usersWithRoles: UserWithRole[] = (profilesResult.data || []).map(profile => {
        const userRoles = (rolesResult.data as any[])?.filter(r => r.user_id === profile.user_id) || [];
        const bestRole = userRoles.sort((a: any, b: any) => (rolePriority[b.role] || 0) - (rolePriority[a.role] || 0))[0];
        const unitMember = unitMembers?.find(m => m.user_id === profile.user_id);
        return {
          ...profile,
          role: (bestRole?.role as AppRole) || 'funcionario',
          unitRole: unitMember?.role || 'member',
          sectorName: unitMember?.sector_module_id ? sectorMap.get(unitMember.sector_module_id) : undefined,
          sectorModuleId: unitMember?.sector_module_id || undefined,
        } as UserWithRole;
      });

      setUsers(usersWithRoles);

      // 4. Pending users (not in any unit yet)
      const pendingProfiles = (pendingResult.data || [])
        .filter(p => !memberUserIds.includes(p.user_id))
        .map(p => ({
          ...p,
          role: 'funcionario' as AppRole,
          unitRole: undefined,
        } as UserWithRole));
      setPendingUsers(pendingProfiles);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: AppRole) {
    try {
      // Delete ALL existing roles first to prevent duplicates
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert the single new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });
      if (error) throw error;

      await fetchUsers();
    } catch {
      throw new Error('Erro ao atualizar função do usuário');
    }
  }

  async function updateUserProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);
      if (error) throw error;
      await fetchUsers();
    } catch {
      throw new Error('Erro ao atualizar perfil');
    }
  }

  async function approveUser(userId: string, role: AppRole, sectorModuleId?: string) {
    try {
      const { error } = await supabase.rpc('approve_user' as any, {
        p_target_user_id: userId,
        p_role: role,
        p_unit_id: activeUnitId,
        p_sector_module_id: sectorModuleId || null,
      });
      if (error) throw error;
      await fetchUsers();
    } catch (err: any) {
      throw new Error(err?.message || 'Erro ao aprovar usuário');
    }
  }

  async function suspendUser(userId: string) {
    try {
      const { error } = await supabase.rpc('suspend_user' as any, {
        p_target_user_id: userId,
      });
      if (error) throw error;
      await fetchUsers();
    } catch (err: any) {
      throw new Error(err?.message || 'Erro ao suspender usuário');
    }
  }

  async function reactivateUser(userId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' as any, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (error) throw error;
      await fetchUsers();
    } catch {
      throw new Error('Erro ao reativar usuário');
    }
  }

  return {
    users,
    pendingUsers,
    isLoading,
    updateUserRole,
    updateUserProfile,
    approveUser,
    suspendUser,
    reactivateUser,
    refetch: fetchUsers,
  };
}
