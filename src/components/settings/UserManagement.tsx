import { useState, useEffect } from 'react';
import { useUsers, UserWithRole } from '@/hooks/useUsers';
import { AppRole } from '@/types/database';
import { AppIcon } from '@/components/ui/app-icon';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ROLES: { value: AppRole; label: string; icon: string; description: string }[] = [
  { value: 'super_admin', label: 'Super Admin', icon: 'ShieldAlert', description: 'Acesso total ao sistema' },
  { value: 'admin', label: 'Administrador', icon: 'Shield', description: 'Gerencia tudo na unidade' },
  { value: 'lider', label: 'Líder de Setor', icon: 'Crown', description: 'Supervisiona equipe e produção' },
  { value: 'funcionario', label: 'Operador', icon: 'HardHat', description: 'Executa tarefas e checklists' },
];

interface SectorModule {
  id: string;
  sector_name: string;
  description: string | null;
  color: string;
  icon: string | null;
}

export function UserManagement() {
  const { users, pendingUsers, isLoading, updateUserRole, approveUser, suspendUser, reactivateUser, refetch } = useUsers();
  const { user } = useAuth();
  const { activeUnit, activeUnitId, units } = useUnit();
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [roleDialogUser, setRoleDialogUser] = useState<UserWithRole | null>(null);
  const [passwordDialogUser, setPasswordDialogUser] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [sectors, setSectors] = useState<SectorModule[]>([]);

  // Approval dialog
  const [approveDialogUser, setApproveDialogUser] = useState<UserWithRole | null>(null);
  const [approveRole, setApproveRole] = useState<AppRole>('funcionario');
  const [approveSectorId, setApproveSectorId] = useState<string>('');
  const [approving, setApproving] = useState(false);

  // Action menu
  const [actionUser, setActionUser] = useState<UserWithRole | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<UserWithRole | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserWithRole | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState<UserWithRole | null>(null);
  const [transferUser, setTransferUser] = useState<UserWithRole | null>(null);
  const [targetUnitId, setTargetUnitId] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  // Load sectors
  useEffect(() => {
    if (!activeUnitId) return;
    supabase.from('sector_modules').select('*').eq('unit_id', activeUnitId).order('sort_order')
      .then(({ data }) => setSectors((data as any[]) || []));
  }, [activeUnitId]);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setRoleDialogUser(null);
    setUpdatingUser(userId);
    try {
      await updateUserRole(userId, newRole);
      toast.success('Perfil atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar função');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleApprove = async () => {
    if (!approveDialogUser) return;
    setApproving(true);
    try {
      await approveUser(approveDialogUser.user_id, approveRole, approveSectorId || undefined);
      toast.success(`${approveDialogUser.full_name} aprovado como ${ROLES.find(r => r.value === approveRole)?.label}`);
      setApproveDialogUser(null);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao aprovar');
    } finally {
      setApproving(false);
    }
  };

  const handleSuspend = async () => {
    if (!confirmSuspend) return;
    setProcessing(true);
    try {
      await suspendUser(confirmSuspend.user_id);
      toast.success(`${confirmSuspend.full_name} suspenso`);
      setConfirmSuspend(null);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao suspender');
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async (u: UserWithRole) => {
    try {
      await reactivateUser(u.user_id);
      toast.success(`${u.full_name} reativado`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao reativar');
    }
  };

  const handleResetPassword = async () => {
    if (!passwordDialogUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    setResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { target_user_id: passwordDialogUser.user_id, new_password: newPassword },
      });
      if (error) throw new Error(data?.error || 'Erro ao redefinir senha');
      if (data?.error) throw new Error(data.error);
      toast.success(`Senha de ${passwordDialogUser.full_name} alterada com sucesso`);
      setPasswordDialogUser(null);
      setNewPassword('');
      setShowPassword(false);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao redefinir senha');
    } finally {
      setResettingPassword(false);
    }
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
      setConfirmRemove(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao remover usuário');
    } finally {
      setProcessing(false);
    }
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
      setConfirmDelete(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir conta');
    } finally {
      setProcessing(false);
    }
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
      setTransferUser(null);
      setTargetUnitId('');
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao transferir usuário');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleLabel = (role: AppRole) => ROLES.find(r => r.value === role)?.label || role;
  const getRoleIcon = (role: AppRole) => ROLES.find(r => r.value === role)?.icon || 'User';

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 bg-amber-500/10">Pendente</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive bg-destructive/10">Suspenso</Badge>;
      default:
        return null;
    }
  };

  const otherUnits = units.filter(u => u.id !== activeUnitId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <AppIcon name="progress_activity" size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="font-semibold text-foreground text-sm">
              Aguardando Aprovação ({pendingUsers.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AppIcon name="UserPlus" size={20} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium block truncate text-sm">{u.full_name}</span>
                  <span className="text-[11px] text-muted-foreground">Cadastrou-se recentemente</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmSuspend(u)}
                  >
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setApproveDialogUser(u);
                      setApproveRole('funcionario');
                      setApproveSectorId('');
                    }}
                  >
                    Aprovar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Users */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <AppIcon name="Users" size={20} className="text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Equipe ({users.length})</h3>
            {activeUnit && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AppIcon name="Building2" size={12} />
                {activeUnit.name}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {users.map((u) => {
            const isSelf = u.user_id === user?.id;
            return (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <AppIcon name={getRoleIcon(u.role)} size={20} className={
                    u.role === 'admin' || u.role === 'super_admin' ? 'text-primary' :
                    u.role === 'lider' ? 'text-amber-500' : 'text-muted-foreground'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium block truncate">{u.full_name}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {getRoleLabel(u.role)}
                    </span>
                    {u.sectorName && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                        {u.sectorName}
                      </span>
                    )}
                    {getStatusBadge(u.status)}
                    {isSelf && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">Você</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {u.status === 'suspended' ? (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleReactivate(u)}>
                      Reativar
                    </Button>
                  ) : (
                    <>
                      <button
                        onClick={() => { setPasswordDialogUser(u); setNewPassword(''); setShowPassword(true); }}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        title="Redefinir senha"
                      >
                        <AppIcon name="Lock" size={16} className="text-muted-foreground" />
                      </button>
                      {updatingUser === u.user_id ? (
                        <AppIcon name="progress_activity" size={16} className="animate-spin" />
                      ) : (
                        <button
                          onClick={() => setRoleDialogUser(u)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs font-medium hover:bg-secondary transition-colors"
                        >
                          {getRoleLabel(u.role)}
                          <AppIcon name="ChevronDown" size={14} className="text-muted-foreground" />
                        </button>
                      )}
                      {!isSelf && (
                        <button
                          onClick={() => { setActionUser(u); setShowActionMenu(true); }}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                          title="Mais ações"
                        >
                          <AppIcon name="MoreVertical" size={16} className="text-muted-foreground" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {users.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <AppIcon name="Users" size={32} className="mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nenhum usuário vinculado a esta unidade
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={!!approveDialogUser} onOpenChange={(open) => !open && setApproveDialogUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Aprovar {approveDialogUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Perfil de acesso</Label>
              <div className="space-y-1.5">
                {ROLES.filter(r => r.value !== 'super_admin').map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setApproveRole(role.value)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                      approveRole === role.value
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-secondary/50 hover:bg-secondary border border-transparent"
                    )}
                  >
                    <AppIcon name={role.icon} size={20} className={approveRole === role.value ? 'text-primary' : 'text-muted-foreground'} />
                    <div>
                      <span className="font-medium text-sm">{role.label}</span>
                      <p className="text-[11px] text-muted-foreground">{role.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {sectors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Setor / Departamento</Label>
                <div className="space-y-1.5">
                  {sectors.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setApproveSectorId(s.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors",
                        approveSectorId === s.id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-secondary/50 hover:bg-secondary border border-transparent"
                      )}
                    >
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                      <div>
                        <span className="font-medium text-sm">{s.sector_name}</span>
                        {s.description && <p className="text-[11px] text-muted-foreground">{s.description}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogUser(null)}>Cancelar</Button>
            <Button onClick={handleApprove} disabled={approving}>
              {approving ? 'Aprovando...' : 'Aprovar Acesso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Menu Dialog */}
      <Dialog open={showActionMenu} onOpenChange={(open) => { if (!open) setShowActionMenu(false); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">{actionUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 pt-2">
            <button
              onClick={() => {
                setShowActionMenu(false);
                if (actionUser) setConfirmSuspend(actionUser);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <AppIcon name="ShieldX" size={18} className="text-amber-500" />
              <div>
                <p className="text-sm font-medium">Suspender acesso</p>
                <p className="text-xs text-muted-foreground">Bloqueia temporariamente</p>
              </div>
            </button>
            <button
              onClick={() => {
                setShowActionMenu(false);
                if (actionUser) setConfirmRemove(actionUser);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <AppIcon name="UserMinus" size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Remover da unidade</p>
                <p className="text-xs text-muted-foreground">Desvincula da {activeUnit?.name}</p>
              </div>
            </button>
            {otherUnits.length > 0 && (
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  if (actionUser) setTransferUser(actionUser);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
              >
                <AppIcon name="ArrowRightLeft" size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Transferir para outra unidade</p>
                  <p className="text-xs text-muted-foreground">Move para outro negócio</p>
                </div>
              </button>
            )}
            <button
              onClick={() => {
                setShowActionMenu(false);
                if (actionUser) setConfirmDelete(actionUser);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/5 transition-colors text-left"
            >
              <AppIcon name="Trash2" size={18} className="text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Excluir conta</p>
                <p className="text-xs text-muted-foreground">Remove permanentemente do sistema</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={!!roleDialogUser} onOpenChange={(open) => !open && setRoleDialogUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar perfil de {roleDialogUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {ROLES.map((role) => {
              const isActive = roleDialogUser?.role === role.value;
              return (
                <button
                  key={role.value}
                  onClick={() => roleDialogUser && handleRoleChange(roleDialogUser.user_id, role.value)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                    isActive
                      ? "bg-primary/10 border border-primary/30 text-primary"
                      : "bg-secondary/50 hover:bg-secondary border border-transparent"
                  )}
                >
                  <AppIcon name={role.icon} size={20} />
                  <div>
                    <span className="font-medium text-sm">{role.label}</span>
                    <p className="text-[11px] text-muted-foreground">{role.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!passwordDialogUser} onOpenChange={(open) => { if (!open) { setPasswordDialogUser(null); setNewPassword(''); setShowPassword(false); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Definir nova senha para <strong>{passwordDialogUser?.full_name}</strong>
            </p>
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                  <AppIcon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogUser(null)}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={resettingPassword || newPassword.length < 6}>
              {resettingPassword ? 'Salvando...' : 'Salvar senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Suspend */}
      <AlertDialog open={!!confirmSuspend} onOpenChange={(open) => !open && setConfirmSuspend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspender {confirmSuspend?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário não poderá acessar o sistema até ser reativado por um administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend} disabled={processing} className="bg-amber-600 text-white hover:bg-amber-700">
              {processing ? 'Suspendendo...' : 'Suspender'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Remove from Unit */}
      <AlertDialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {confirmRemove?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário será desvinculado de <strong>{activeUnit?.name}</strong> e perderá acesso a esta unidade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFromUnit} disabled={processing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {processing ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Account */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta de {confirmDelete?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>irreversível</strong>. A conta será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={processing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {processing ? 'Excluindo...' : 'Excluir permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Dialog */}
      <Dialog open={!!transferUser} onOpenChange={(open) => { if (!open) { setTransferUser(null); setTargetUnitId(''); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Transferir {transferUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Selecione a unidade de destino:</p>
            {otherUnits.map((u) => (
              <button
                key={u.id}
                onClick={() => setTargetUnitId(u.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                  targetUnitId === u.id
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-secondary/50 hover:bg-secondary border border-transparent"
                )}
              >
                <AppIcon name="Building2" size={18} />
                <span className="font-medium text-sm">{u.name}</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferUser(null)}>Cancelar</Button>
            <Button onClick={handleTransfer} disabled={processing || !targetUnitId}>
              {processing ? 'Transferindo...' : 'Transferir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
