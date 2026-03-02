import { useState, useCallback, useMemo } from 'react';
import { useUsers, UserWithRole } from '@/hooks/useUsers';
import { useAccessLevels, AccessLevel } from '@/hooks/useAccessLevels';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/database';
import { ALL_MODULES, getSubModuleKeys, isSubModuleKey, getParentModuleKey } from '@/lib/modules';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ListPicker } from '@/components/ui/list-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Module groups for access level editor ───
const moduleGroups = (() => {
  const groups: { label: string; modules: typeof ALL_MODULES }[] = [];
  const seen = new Set<string>();
  ALL_MODULES.forEach(m => {
    if (m.key === 'dashboard') return;
    if (!seen.has(m.group)) {
      seen.add(m.group);
      groups.push({
        label: m.group,
        modules: ALL_MODULES.filter(mod => mod.group === m.group && mod.key !== 'dashboard'),
      });
    }
  });
  return groups;
})();

const UNIT_ROLE_LABELS: Record<string, string> = {
  owner: 'Dono',
  admin: 'Gerente',
  member: 'Funcionário',
};

export function TeamHub() {
  const [activeTab, setActiveTab] = useState('members');

  return (
    <div className="space-y-4">
      <AnimatedTabs
        tabs={[
          { key: 'members', label: 'Membros' },
          { key: 'invites', label: 'Convites' },
          { key: 'levels', label: 'Níveis' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'members' && <MembersTab />}
      {activeTab === 'invites' && <InvitesTab />}
      {activeTab === 'levels' && <LevelsTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: MEMBROS
// ═══════════════════════════════════════════════════════════════
function MembersTab() {
  const { users, pendingUsers, isLoading, approveUser, suspendUser, refetch } = useUsers();
  const { accessLevels, assignToUser } = useAccessLevels();
  const { user } = useAuth();
  const { activeUnit, activeUnitId, units } = useUnit();
  const queryClient = useQueryClient();

  const [passwordDialogUser, setPasswordDialogUser] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);

  // Action menu
  const [actionUser, setActionUser] = useState<UserWithRole | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Confirm dialogs
  const [confirmRemove, setConfirmRemove] = useState<UserWithRole | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserWithRole | null>(null);
  const [transferUser, setTransferUser] = useState<UserWithRole | null>(null);
  const [targetUnitId, setTargetUnitId] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  // Access level picker
  const [pickerUserId, setPickerUserId] = useState<string | null>(null);

  // Fetch user assignments for current unit
  const { data: userAssignments = [] } = useQuery({
    queryKey: ['user-unit-assignments', activeUnitId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_units')
        .select('user_id, access_level_id, role')
        .eq('unit_id', activeUnitId!);
      return data || [];
    },
    enabled: !!activeUnitId,
    staleTime: 60 * 1000,
  });

  const getUserAccessLevel = (userId: string) =>
    userAssignments.find(a => a.user_id === userId)?.access_level_id || null;

  const getAccessLevelLabel = (userId: string) => {
    const levelId = getUserAccessLevel(userId);
    if (!levelId) return 'Acesso completo';
    return accessLevels.find(l => l.id === levelId)?.name || 'Acesso completo';
  };

  const handleAssignLevel = async (userId: string, levelId: string | null) => {
    try {
      await assignToUser({ userId, accessLevelId: levelId });
      queryClient.invalidateQueries({ queryKey: ['user-unit-assignments', activeUnitId] });
    } catch {
      toast.error('Erro ao atribuir nível');
    }
  };

  const handleApprovePending = async (pendingUser: UserWithRole) => {
    setApprovingUserId(pendingUser.user_id);
    try {
      await approveUser(pendingUser.user_id, 'funcionario');
      toast.success(`${pendingUser.full_name} aprovado com sucesso`);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao aprovar usuário');
    } finally {
      setApprovingUserId(null);
    }
  };

  const handleRejectPending = async (pendingUser: UserWithRole) => {
    setRejectingUserId(pendingUser.user_id);
    try {
      await suspendUser(pendingUser.user_id);
      toast.success(`${pendingUser.full_name} rejeitado`);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao rejeitar usuário');
    } finally {
      setRejectingUserId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordDialogUser || !newPassword) return;
    if (newPassword.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return; }
    setResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { target_user_id: passwordDialogUser.user_id, new_password: newPassword },
      });
      if (error) throw new Error(data?.error || 'Erro ao redefinir senha');
      if (data?.error) throw new Error(data.error);
      toast.success(`Senha de ${passwordDialogUser.full_name} alterada com sucesso`);
      setPasswordDialogUser(null); setNewPassword(''); setShowPassword(false);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao redefinir senha');
    } finally { setResettingPassword(false); }
  };

  const handleRemoveFromUnit = async () => {
    if (!confirmRemove || !activeUnitId) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'remove_from_unit', target_user_id: confirmRemove.user_id, unit_id: activeUnitId },
      });
      if (error || data?.error) throw new Error(data?.error || 'Erro');
      toast.success(`${confirmRemove.full_name} removido da unidade`);
      setConfirmRemove(null); refetch();
    } catch (err: any) { toast.error(err?.message || 'Erro ao remover usuário'); }
    finally { setProcessing(false); }
  };

  const handleTransfer = async () => {
    if (!transferUser || !activeUnitId || !targetUnitId) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'transfer_to_unit', target_user_id: transferUser.user_id, unit_id: activeUnitId, target_unit_id: targetUnitId },
      });
      if (error || data?.error) throw new Error(data?.error || 'Erro');
      const targetName = units.find(u => u.id === targetUnitId)?.name || 'outra unidade';
      toast.success(`${transferUser.full_name} transferido para ${targetName}`);
      setTransferUser(null); setTargetUnitId(''); refetch();
    } catch (err: any) { toast.error(err?.message || 'Erro ao transferir'); }
    finally { setProcessing(false); }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'delete_account', target_user_id: confirmDelete.user_id },
      });
      if (error || data?.error) throw new Error(data?.error || 'Erro');
      toast.success(`Conta de ${confirmDelete.full_name} excluída permanentemente`);
      setConfirmDelete(null); refetch();
    } catch (err: any) { toast.error(err?.message || 'Erro ao excluir conta'); }
    finally { setProcessing(false); }
  };

  const otherUnits = units.filter(u => u.id !== activeUnitId);

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><AppIcon name="progress_activity" size={24} className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-2">
      {pendingUsers.length > 0 && (
        <div className="space-y-2 pb-2">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <p className="text-xs font-semibold text-warning">Aguardando aprovação ({pendingUsers.length})</p>
          </div>

          {pendingUsers.map((pendingUser) => (
            <div key={`pending-${pendingUser.user_id}`} className="flex items-center gap-3 p-3 rounded-xl bg-warning/5 border border-warning/20">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                <AppIcon name="UserPlus" size={18} className="text-warning" />
              </div>

              <div className="flex-1 min-w-0">
                <span className="font-medium block truncate text-sm">{pendingUser.full_name}</span>
                <span className="text-[11px] text-muted-foreground">Cadastro aguardando aprovação</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  disabled={approvingUserId === pendingUser.user_id || rejectingUserId === pendingUser.user_id}
                  onClick={() => handleRejectPending(pendingUser)}
                >
                  {rejectingUserId === pendingUser.user_id ? 'Rejeitando...' : 'Rejeitar'}
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs"
                  disabled={approvingUserId === pendingUser.user_id || rejectingUserId === pendingUser.user_id}
                  onClick={() => handleApprovePending(pendingUser)}
                >
                  {approvingUserId === pendingUser.user_id ? 'Aprovando...' : 'Aprovar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {users.map((u) => {
        const isSelf = u.user_id === user?.id;
        const unitRole = u.unitRole || 'member';
        return (
          <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {unitRole === 'owner' ? (
                <AppIcon name="Crown" size={20} className="text-primary" />
              ) : u.role === 'admin' || u.role === 'super_admin' ? (
                <AppIcon name="Shield" size={20} className="text-primary" />
              ) : (
                <AppIcon name="User" size={20} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium block truncate">{u.full_name}</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {UNIT_ROLE_LABELS[unitRole] || unitRole}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {getAccessLevelLabel(u.user_id)}
                </span>
                {isSelf && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">Você</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Access level picker button */}
              <button
                onClick={() => setPickerUserId(u.user_id)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-background border border-border text-[11px] font-medium hover:bg-secondary transition-colors max-w-[100px] truncate"
                title="Nível de acesso"
              >
                <AppIcon name="Shield" size={12} className="text-muted-foreground shrink-0" />
                <span className="truncate">{getAccessLevelLabel(u.user_id)}</span>
              </button>
              <button
                onClick={() => { setPasswordDialogUser(u); setNewPassword(''); setShowPassword(true); }}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Redefinir senha"
              >
                <AppIcon name="Lock" size={16} className="text-muted-foreground" />
              </button>
              {!isSelf && (
                <button
                  onClick={() => { setActionUser(u); setShowActionMenu(true); }}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  title="Mais ações"
                >
                  <AppIcon name="MoreVertical" size={16} className="text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        );
      })}
      {users.length === 0 && (
        <div className="text-center py-8 space-y-2">
          <AppIcon name="Users" size={32} className="mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum membro nesta unidade</p>
        </div>
      )}

      {/* Access Level Picker */}
      <ListPicker
        open={!!pickerUserId}
        onOpenChange={(open) => { if (!open) setPickerUserId(null); }}
        title="Nível de Acesso"
        items={[
          { id: '_full', label: 'Acesso completo' },
          ...accessLevels.map(l => ({ id: l.id, label: `${l.name} (${l.modules.length} módulos)` })),
        ]}
        selectedId={pickerUserId ? (getUserAccessLevel(pickerUserId) || '_full') : null}
        onSelect={(id) => {
          if (pickerUserId) {
            handleAssignLevel(pickerUserId, id === '_full' ? null : id);
            setPickerUserId(null);
          }
        }}
      />

      {/* Action Menu Dialog */}
      <Dialog open={showActionMenu} onOpenChange={(open) => { if (!open) setShowActionMenu(false); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="text-base">{actionUser?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-1 pt-2">
            <button onClick={() => { setShowActionMenu(false); if (actionUser) setConfirmRemove(actionUser); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left">
              <AppIcon name="UserMinus" size={18} className="text-muted-foreground" />
              <div><p className="text-sm font-medium">Remover da unidade</p><p className="text-xs text-muted-foreground">Desvincula da {activeUnit?.name}</p></div>
            </button>
            {otherUnits.length > 0 && (
              <button onClick={() => { setShowActionMenu(false); if (actionUser) setTransferUser(actionUser); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left">
                <AppIcon name="ArrowRightLeft" size={18} className="text-muted-foreground" />
                <div><p className="text-sm font-medium">Transferir para outra unidade</p><p className="text-xs text-muted-foreground">Move para outro negócio</p></div>
              </button>
            )}
            <button onClick={() => { setShowActionMenu(false); if (actionUser) setConfirmDelete(actionUser); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/5 transition-colors text-left">
              <AppIcon name="Trash2" size={18} className="text-destructive" />
              <div><p className="text-sm font-medium text-destructive">Excluir conta</p><p className="text-xs text-muted-foreground">Remove permanentemente do sistema</p></div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!passwordDialogUser} onOpenChange={(open) => { if (!open) { setPasswordDialogUser(null); setNewPassword(''); setShowPassword(false); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Redefinir senha</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Definir nova senha para <strong>{passwordDialogUser?.full_name}</strong></p>
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                  <AppIcon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Use letras maiúsculas, minúsculas, números e caracteres especiais (ex: Prodem@2026)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogUser(null)}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={resettingPassword || newPassword.length < 6}>{resettingPassword ? 'Salvando...' : 'Salvar senha'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove */}
      <AlertDialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {confirmRemove?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>O usuário será desvinculado de <strong>{activeUnit?.name}</strong> e perderá acesso a esta unidade.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFromUnit} disabled={processing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{processing ? 'Removendo...' : 'Remover'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta de {confirmDelete?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é <strong>irreversível</strong>. A conta será excluída permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={processing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{processing ? 'Excluindo...' : 'Excluir permanentemente'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Dialog */}
      <Dialog open={!!transferUser} onOpenChange={(open) => { if (!open) { setTransferUser(null); setTargetUnitId(''); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Transferir {transferUser?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Selecione a unidade de destino.</p>
            <div className="space-y-2">
              {otherUnits.map((unit) => (
                <button key={unit.id} onClick={() => setTargetUnitId(unit.id)}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                    targetUnitId === unit.id ? "bg-primary/10 border border-primary/30 text-primary" : "bg-secondary/50 hover:bg-secondary border border-transparent")}>
                  <AppIcon name="Building2" size={18} /><span className="font-medium text-sm">{unit.name}</span>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferUser(null)}>Cancelar</Button>
            <Button onClick={handleTransfer} disabled={processing || !targetUnitId}>{processing ? 'Transferindo...' : 'Transferir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: CONVITES
// ═══════════════════════════════════════════════════════════════
function InvitesTab() {
  const { user } = useAuth();
  const { activeUnitId, activeUnit } = useUnit();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [lastInviteEmail, setLastInviteEmail] = useState<string | null>(null);

  const { data: invites = [] } = useQuery({
    queryKey: ['invites', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase.from('invites').select('*').eq('unit_id', activeUnitId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeUnitId,
  });

  const sendInvite = useMutation({
    mutationFn: async () => {
      if (!user || !activeUnitId || !email.trim()) throw new Error('Dados inválidos');
      const { data, error } = await supabase.from('invites').insert({ email: email.trim().toLowerCase(), unit_id: activeUnitId, role, invited_by: user.id }).select('token').single();
      if (error) throw error;
      return data.token;
    },
    onSuccess: (token: string) => {
      const link = `${window.location.origin}/invite?token=${token}`;
      setLastInviteLink(link);
      setLastInviteEmail(email.trim().toLowerCase());
      navigator.clipboard.writeText(link);
      toast.success('Link gerado e copiado!');
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['invites', activeUnitId] });
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar convite'),
  });

  const deleteInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invites').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Convite removido'); queryClient.invalidateQueries({ queryKey: ['invites', activeUnitId] }); },
  });

  const pendingInvites = invites.filter((i: any) => !i.accepted_at);

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`https://prodem.lovable.app/invite?token=${token}`);
    toast.success('Link copiado!');
  };

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Convidar Funcionário</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Email do funcionário</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Cargo</Label>
            <div className="flex gap-2 mt-1">
              {[{ value: 'member', label: 'Funcionário' }, { value: 'admin', label: 'Gerente' }].map(r => (
                <button key={r.value} onClick={() => setRole(r.value)}
                  className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-all',
                    role === r.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary')}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => sendInvite.mutate()} disabled={!email.trim() || sendInvite.isPending} className="w-full">
            <AppIcon name="Link" size={16} className="mr-2" />
            {sendInvite.isPending ? 'Gerando...' : 'Gerar Link de Convite'}
          </Button>

          {lastInviteLink && (
            <div className="space-y-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs font-medium text-foreground text-center">Enviar convite para {lastInviteEmail}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => {
                  const subject = encodeURIComponent(`Convite para ${activeUnit?.name || 'a equipe'}`);
                  const body = encodeURIComponent(`Olá! Você foi convidado para se juntar ao ${activeUnit?.name || 'nosso time'}.\n\nClique no link para criar sua conta:\n${lastInviteLink}`);
                  window.open(`mailto:${lastInviteEmail}?subject=${subject}&body=${body}`, '_blank');
                }}>
                  <AppIcon name="Mail" size={16} />Email
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => {
                  const text = encodeURIComponent(`Olá! Você foi convidado para se juntar ao *${activeUnit?.name || 'nosso time'}* no Prodem Gestão.\n\nCrie sua conta pelo link:\n${lastInviteLink}`);
                  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                }}>
                  <AppIcon name="MessageCircle" size={16} />WhatsApp
                </Button>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(lastInviteLink!); toast.success('Link copiado!'); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1">
                Copiar link novamente
              </button>
            </div>
          )}

          {!lastInviteLink && <p className="text-[11px] text-muted-foreground text-center">O link será gerado e você poderá enviar por email ou WhatsApp.</p>}
        </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Convites Pendentes ({pendingInvites.length})</h3>
          {pendingInvites.map((inv: any) => (
            <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/20">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                <AppIcon name="Clock" size={16} className="text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{inv.email}</p>
                <p className="text-xs text-muted-foreground">Expira em {format(new Date(inv.expires_at), "dd/MM", { locale: ptBR })}</p>
              </div>
              <button onClick={() => copyLink(inv.token)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Copiar link">
                <AppIcon name="Copy" size={16} className="text-muted-foreground" />
              </button>
              <button onClick={() => deleteInvite.mutate(inv.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Remover">
                <AppIcon name="Trash2" size={16} className="text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: NÍVEIS DE ACESSO
// ═══════════════════════════════════════════════════════════════
function LevelsTab() {
  const { accessLevels, isLoading, addAccessLevel, updateAccessLevel, deleteAccessLevel } = useAccessLevels();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const [editingLevel, setEditingLevel] = useState<AccessLevel | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formModules, setFormModules] = useState<string[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // All module keys that have children — used to auto-expand
  const allExpandableKeys = useMemo(() => {
    const keys = new Set<string>();
    ALL_MODULES.forEach(m => { if (m.children && m.children.length > 0) keys.add(m.key); });
    return keys;
  }, []);

  // Fetch user assignments for count
  const { data: userAssignments = [] } = useQuery({
    queryKey: ['user-unit-assignments', activeUnitId],
    queryFn: async () => {
      const { data } = await supabase.from('user_units').select('user_id, access_level_id').eq('unit_id', activeUnitId!);
      return data || [];
    },
    enabled: !!activeUnitId,
    staleTime: 60 * 1000,
  });

  const openCreate = () => {
    setEditingLevel(null); setIsCreating(true); setFormName(''); setFormDescription(''); setFormModules([]);
    setExpandedModules(new Set());
  };

  const openEdit = (level: AccessLevel) => {
    setEditingLevel(level); setIsCreating(true); setFormName(level.name); setFormDescription(level.description || ''); setFormModules([...level.modules]);
    setExpandedModules(new Set());
  };

  const toggleExpand = useCallback((key: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  // Toggle a parent module — also toggles all its children
  const toggleParentModule = useCallback((parentKey: string) => {
    setFormModules(prev => {
      const subKeys = getSubModuleKeys(parentKey);
      const isSelected = prev.includes(parentKey);
      if (isSelected) {
        return prev.filter(m => m !== parentKey && !subKeys.includes(m));
      } else {
        return [...new Set([...prev, parentKey, ...subKeys])];
      }
    });
  }, []);

  // Toggle a single child module
  const toggleChildModule = useCallback((childKey: string) => {
    setFormModules(prev => {
      const parentKey = getParentModuleKey(childKey);
      const subKeys = getSubModuleKeys(parentKey);
      const isSelected = prev.includes(childKey);
      let next: string[];
      if (isSelected) {
        next = prev.filter(m => m !== childKey);
        const remainingChildren = next.filter(m => subKeys.includes(m));
        if (remainingChildren.length === 0) next = next.filter(m => m !== parentKey);
      } else {
        next = [...new Set([...prev, childKey, parentKey])];
      }
      return next;
    });
  }, []);

  const toggleAllInGroup = useCallback((groupModules: typeof ALL_MODULES) => {
    setFormModules(prev => {
      const allKeys: string[] = [];
      groupModules.forEach(m => {
        allKeys.push(m.key);
        if (m.children) m.children.forEach(c => allKeys.push(c.key));
      });
      const allSelected = allKeys.every(k => prev.includes(k));
      if (allSelected) {
        return prev.filter(m => !allKeys.includes(m));
      } else {
        return [...new Set([...prev, ...allKeys])];
      }
    });
  }, []);

  const getParentCheckState = useCallback((parentKey: string): boolean | 'indeterminate' => {
    const subKeys = getSubModuleKeys(parentKey);
    if (subKeys.length === 0) return formModules.includes(parentKey);
    const selectedCount = subKeys.filter(k => formModules.includes(k)).length;
    if (selectedCount === 0) return false;
    if (selectedCount === subKeys.length) return true;
    return 'indeterminate';
  }, [formModules]);

  const countParentModules = (modules: string[]) => modules.filter(m => !isSubModuleKey(m)).length;
  const countSubModules = (modules: string[]) => modules.filter(m => isSubModuleKey(m)).length;

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Nome é obrigatório'); return; }
    const parentModules = formModules.filter(m => !isSubModuleKey(m));
    if (parentModules.length === 0) { toast.error('Selecione pelo menos um módulo'); return; }
    try {
      if (editingLevel) {
        await updateAccessLevel({ id: editingLevel.id, name: formName, description: formDescription, modules: formModules });
      } else {
        await addAccessLevel({ name: formName, description: formDescription, modules: formModules });
      }
      setIsCreating(false);
    } catch { toast.error('Erro ao salvar nível de acesso'); }
  };

  const handleDelete = async (level: AccessLevel) => {
    if (!confirm(`Remover o nível "${level.name}"?`)) return;
    await deleteAccessLevel(level.id);
  };

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Crie níveis customizados para controlar o acesso a módulos específicos.</p>
        <Button size="sm" onClick={openCreate} className="gap-1.5 shrink-0">
          <AppIcon name="Plus" size={14} />Criar
        </Button>
      </div>

      {accessLevels.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AppIcon name="Shield" size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum nível criado</p>
          <p className="text-xs mt-1">Todos os usuários têm acesso completo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {accessLevels.map(level => {
            const assignedCount = userAssignments.filter(a => a.access_level_id === level.id).length;
            const parentCount = countParentModules(level.modules);
            const subCount = countSubModules(level.modules);
            return (
              <div key={level.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/30">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0">
                  <AppIcon name="Shield" size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{level.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {parentCount} módulo{parentCount !== 1 ? 's' : ''}
                    {subCount > 0 && ` · ${subCount} sub-permiss${subCount !== 1 ? 'ões' : 'ão'}`}
                    {' · '}{assignedCount} usuário{assignedCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={() => openEdit(level)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                  <AppIcon name="Pencil" size={14} className="text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(level)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                  <AppIcon name="Trash2" size={14} className="text-destructive/70" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto rounded-2xl left-1/2 -translate-x-1/2">
          <DialogHeader><DialogTitle>{editingLevel ? 'Editar Nível' : 'Novo Nível de Acesso'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Líder" />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Ex: Acesso a operação sem financeiro" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Módulos e permissões</Label>
                <span className="text-[10px] text-muted-foreground">
                  {countParentModules(formModules)} módulos · {countSubModules(formModules)} sub
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-1">Dashboard está sempre acessível. Toque na seta para ver sub-permissões.</p>
              {moduleGroups.map(group => {
                const allKeys: string[] = [];
                group.modules.forEach(m => { allKeys.push(m.key); if (m.children) m.children.forEach(c => allKeys.push(c.key)); });
                const selectedCount = allKeys.filter(k => formModules.includes(k)).length;
                const groupCheck = selectedCount === 0 ? false : selectedCount === allKeys.length ? true : 'indeterminate' as const;

                return (
                  <div key={group.label} className="space-y-1">
                    <button onClick={() => toggleAllInGroup(group.modules)}
                      className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors w-full">
                      <Checkbox checked={groupCheck === true ? true : groupCheck === 'indeterminate' ? 'indeterminate' : false} className="h-3.5 w-3.5 shrink-0" />
                      {group.label}
                    </button>
                    <div className="space-y-1 pl-0.5">
                      {group.modules.map(mod => {
                        const hasChildren = mod.children && mod.children.length > 0;
                        const isExpanded = expandedModules.has(mod.key);
                        const parentState = getParentCheckState(mod.key);
                        const isSelected = hasChildren ? parentState === true : formModules.includes(mod.key);

                        return (
                          <div key={mod.key}>
                            <div className={cn(
                              "flex items-center gap-2 p-2 rounded-lg transition-all text-xs",
                              isSelected || parentState === 'indeterminate'
                                ? "bg-primary/10 border border-primary/30"
                                : "bg-secondary/40 border border-border/20"
                            )}>
                              {hasChildren ? (
                                <button onClick={() => toggleExpand(mod.key)} className="p-0.5 rounded hover:bg-secondary transition-colors shrink-0">
                                  <AppIcon name="ChevronRight" size={14} className={cn("text-muted-foreground transition-transform duration-200", isExpanded && "rotate-90")} />
                                </button>
                              ) : (
                                <div className="w-[22px] shrink-0" />
                              )}
                              <button onClick={() => toggleParentModule(mod.key)} className="flex items-center gap-2 flex-1 min-w-0">
                                <Checkbox
                                  checked={parentState === true ? true : parentState === 'indeterminate' ? 'indeterminate' : false}
                                  className="h-3.5 w-3.5 pointer-events-none shrink-0"
                                />
                                <AppIcon name={mod.icon} size={15} className="shrink-0" />
                                <span className={cn("truncate flex-1 text-left font-medium", isSelected || parentState === 'indeterminate' ? "text-foreground" : "text-muted-foreground")}>
                                  {mod.label}
                                </span>
                              </button>
                              {hasChildren && (
                                <span className="text-[9px] text-muted-foreground/60 shrink-0">
                                  {mod.children!.filter(c => formModules.includes(c.key)).length}/{mod.children!.length}
                                </span>
                              )}
                            </div>
                            {hasChildren && isExpanded && (
                              <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-primary/10 pl-2">
                                {mod.children!.map(child => {
                                  const childSelected = formModules.includes(child.key);
                                  return (
                                    <button key={child.key} onClick={() => toggleChildModule(child.key)}
                                      className={cn(
                                        "flex items-center gap-2 p-1.5 rounded-md transition-all text-[11px] w-full",
                                        childSelected ? "bg-primary/8 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                                      )}>
                                      <Checkbox checked={childSelected} className="h-3 w-3 pointer-events-none shrink-0" />
                                      <AppIcon name={child.icon} size={12} className="shrink-0 opacity-70" />
                                      <span className="truncate flex-1 text-left">{child.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingLevel ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
