import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TeamManagement() {
  const { user } = useAuth();
  const { activeUnitId, activeUnit } = useUnit();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const { data: invites = [], isLoading } = useQuery({
    queryKey: ['invites', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('unit_id', activeUnitId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeUnitId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['team-members', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase
        .from('user_units')
        .select('user_id, role, is_default, created_at')
        .eq('unit_id', activeUnitId);
      if (error) throw error;

      // Fetch profiles
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      return data.map(d => ({
        ...d,
        profile: profiles?.find(p => p.user_id === d.user_id),
      }));
    },
    enabled: !!activeUnitId,
  });

  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [lastInviteEmail, setLastInviteEmail] = useState<string | null>(null);

  const sendInvite = useMutation({
    mutationFn: async () => {
      if (!user || !activeUnitId || !email.trim()) throw new Error('Dados inválidos');

      const { data, error } = await supabase.from('invites').insert({
        email: email.trim().toLowerCase(),
        unit_id: activeUnitId,
        role,
        invited_by: user.id,
      }).select('token').single();
      if (error) throw error;
      return data.token;
    },
    onSuccess: (token: string) => {
      const link = getInviteLink(token);
      setLastInviteLink(link);
      setLastInviteEmail(email.trim().toLowerCase());
      navigator.clipboard.writeText(link);
      toast.success('Link gerado e copiado!');
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['invites', activeUnitId] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao criar convite');
    },
  });

  const deleteInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invites').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Convite removido');
      queryClient.invalidateQueries({ queryKey: ['invites', activeUnitId] });
    },
  });

  const pendingInvites = invites.filter((i: any) => !i.accepted_at);
  const acceptedInvites = invites.filter((i: any) => i.accepted_at);

  const getInviteLink = (token: string) => {
    // Always use published URL so invite links work when shared
    return `https://prodem.lovable.app/invite?token=${token}`;
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getInviteLink(token));
    toast.success('Link copiado!');
  };

  const roleLabels: Record<string, string> = {
    owner: 'Dono',
    admin: 'Admin',
    member: 'Funcionário',
  };

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Convidar Funcionário</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Email do funcionário</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Cargo</Label>
            <div className="flex gap-2 mt-1">
              {[
                { value: 'member', label: 'Funcionário' },
                { value: 'admin', label: 'Gerente' },
              ].map(r => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium border transition-all',
                    role === r.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={() => sendInvite.mutate()}
            disabled={!email.trim() || sendInvite.isPending}
            className="w-full"
          >
            <AppIcon name="Link" size={16} className="mr-2" />
            {sendInvite.isPending ? 'Gerando...' : 'Gerar Link de Convite'}
          </Button>

          {/* Share options after generating */}
          {lastInviteLink && (
            <div className="space-y-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs font-medium text-foreground text-center">Enviar convite para {lastInviteEmail}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => {
                    const subject = encodeURIComponent(`Convite para ${activeUnit?.name || 'a equipe'}`);
                    const body = encodeURIComponent(`Olá! Você foi convidado para se juntar ao ${activeUnit?.name || 'nosso time'}.\n\nClique no link para criar sua conta:\n${lastInviteLink}`);
                    window.open(`mailto:${lastInviteEmail}?subject=${subject}&body=${body}`, '_blank');
                  }}
                >
                  <AppIcon name="Mail" size={16} />
                  Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => {
                    const text = encodeURIComponent(`Olá! Você foi convidado para se juntar ao *${activeUnit?.name || 'nosso time'}* no Prodem Gestão.\n\nCrie sua conta pelo link:\n${lastInviteLink}`);
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                  }}
                >
                  <AppIcon name="MessageCircle" size={16} />
                  WhatsApp
                </Button>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(lastInviteLink);
                  toast.success('Link copiado!');
                }}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
              >
                Copiar link novamente
              </button>
            </div>
          )}

          {!lastInviteLink && (
            <p className="text-[11px] text-muted-foreground text-center">
              O link será gerado e você poderá enviar por email ou WhatsApp.
            </p>
          )}
        </div>
      </div>

      {/* Current Members */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Membros da Equipe ({members.length})
        </h3>
        {members.map((m: any) => (
          <div key={m.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/20">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <AppIcon name="User" size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.profile?.full_name || 'Sem nome'}</p>
              <p className="text-xs text-muted-foreground">{roleLabels[m.role] || m.role}</p>
            </div>
            {m.user_id === user?.id && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Você</span>
            )}
          </div>
        ))}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Convites Pendentes ({pendingInvites.length})
          </h3>
          {pendingInvites.map((inv: any) => (
            <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/20">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AppIcon name="Clock" size={16} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{inv.email}</p>
                <p className="text-xs text-muted-foreground">
                  Expira em {format(new Date(inv.expires_at), "dd/MM", { locale: ptBR })}
                </p>
              </div>
              <button
                onClick={() => copyLink(inv.token)}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                title="Copiar link"
              >
                <AppIcon name="Copy" size={16} className="text-muted-foreground" />
              </button>
              <button
                onClick={() => deleteInvite.mutate(inv.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                title="Remover"
              >
                <AppIcon name="Trash2" size={16} className="text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
