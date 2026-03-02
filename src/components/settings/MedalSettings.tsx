import { useState } from 'react';
import { invalidateGamificationCaches } from '@/lib/queryKeys';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIER_CONFIG, TIER_CONFIG_DARK, type MedalTier } from '@/lib/medals';
import { useTheme } from 'next-themes';

function useTierConfig() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (tier: MedalTier) => {
    const base = TIER_CONFIG[tier];
    if (isDark) {
      const dark = TIER_CONFIG_DARK[tier];
      return { ...base, color: dark.color, bg: dark.bg, border: dark.border };
    }
    return base;
  };
}

interface MedalType {
  badge_id: string;
  title: string;
  description: string;
  tier: MedalTier;
  bonusPoints: number;
  icon: string;
}

const AVAILABLE_MEDALS: MedalType[] = [
  {
    badge_id: 'employee_of_month',
    title: 'Funcionário do Mês',
    description: 'Reconhece o melhor desempenho do mês',
    tier: 'platinum',
    bonusPoints: 50,
    icon: 'Crown',
  },
  {
    badge_id: 'inventor',
    title: 'Inventor',
    description: 'Criou uma receita oficial para o Prodem',
    tier: 'gold',
    bonusPoints: 40,
    icon: 'FlaskConical',
  },
];

export function MedalSettings() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const getTier = useTierConfig();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedMedal, setSelectedMedal] = useState<string>('');
  const [isGranting, setIsGranting] = useState(false);

  // Fetch users in current unit
  const { data: users } = useQuery({
    queryKey: ['unit-users-for-medals', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data: unitUsers } = await supabase
        .from('user_units')
        .select('user_id')
        .eq('unit_id', activeUnitId);
      if (!unitUsers?.length) return [];
      const ids = unitUsers.map(u => u.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', ids);
      return profiles || [];
    },
    enabled: !!activeUnitId,
  });

  // Fetch granted medals history
  const { data: grantedMedals } = useQuery({
    queryKey: ['granted-medals', activeUnitId],
    queryFn: async () => {
      let query = supabase
        .from('bonus_points')
        .select('id, user_id, badge_id, points, reason, created_at')
        .in('badge_id', ['employee_of_month', 'inventor'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (activeUnitId) query = query.eq('unit_id', activeUnitId);
      const { data } = await query;
      return data || [];
    },
    enabled: !!activeUnitId,
  });

  const handleGrant = async () => {
    if (!selectedUser || !selectedMedal || !activeUnitId || !user) return;

    const medal = AVAILABLE_MEDALS.find(m => m.badge_id === selectedMedal);
    if (!medal) return;

    setIsGranting(true);
    try {
      const now = new Date();
      const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');

      const { error } = await supabase.from('bonus_points').insert({
        user_id: selectedUser,
        unit_id: activeUnitId,
        badge_id: medal.badge_id,
        points: medal.bonusPoints,
        reason: medal.title,
        type: 'badge',
        month: monthStart,
        awarded_by: user.id,
      });

      if (error) throw error;

      toast({ title: `Medalha "${medal.title}" concedida com sucesso! (+${medal.bonusPoints} pts)` });
      setSelectedUser('');
      setSelectedMedal('');
      queryClient.invalidateQueries({ queryKey: ['granted-medals'] });
      invalidateGamificationCaches(queryClient);
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao conceder medalha', variant: 'destructive' });
    } finally {
      setIsGranting(false);
    }
  };

  const getUserName = (userId: string) => {
    return users?.find(u => u.user_id === userId)?.full_name || 'Usuário';
  };

  const getMedalInfo = (badgeId: string) => {
    return AVAILABLE_MEDALS.find(m => m.badge_id === badgeId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Medalhas de Prestígio</h2>
        <p className="text-sm text-muted-foreground">
          Conceda medalhas especiais aos funcionários como reconhecimento
        </p>
      </div>

      {/* Available medals info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AVAILABLE_MEDALS.map(medal => {
          const tier = getTier(medal.tier);
          return (
            <div
              key={medal.badge_id}
              className="p-3 rounded-xl border"
              style={{
                borderColor: tier.border,
                background: tier.bg,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <AppIcon name={medal.icon} size={18} style={{ color: tier.color }} />
                <span className="font-semibold text-sm" style={{ color: tier.color }}>
                  {medal.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{medal.description}</p>
              <p className="text-xs mt-1" style={{ color: tier.color }}>
                +{medal.bonusPoints} pontos de bônus
              </p>
            </div>
          );
        })}
      </div>

      {/* Grant medal form */}
      <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-secondary/20">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <AppIcon name="Award" size={16} className="text-primary" />
          Conceder Medalha
        </h3>

        <div className="space-y-3">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger data-vaul-no-drag>
              <SelectValue placeholder="Selecione o funcionário" />
            </SelectTrigger>
            <SelectContent className="z-[10000]" position="popper" sideOffset={4}>
              {(users || []).map(u => (
                <SelectItem key={u.user_id} value={u.user_id} data-vaul-no-drag>
                  {u.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMedal} onValueChange={setSelectedMedal}>
            <SelectTrigger data-vaul-no-drag>
              <SelectValue placeholder="Selecione a medalha" />
            </SelectTrigger>
            <SelectContent className="z-[10000]" position="popper" sideOffset={4}>
              {AVAILABLE_MEDALS.map(m => (
                <SelectItem key={m.badge_id} value={m.badge_id} data-vaul-no-drag>
                  {m.title} (+{m.bonusPoints} pts)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleGrant}
            disabled={!selectedUser || !selectedMedal || isGranting}
            className="w-full"
          >
            <AppIcon name="Award" size={16} className="mr-2" />
            {isGranting ? 'Concedendo...' : 'Conceder Medalha'}
          </Button>
        </div>
      </div>

      {/* History */}
      {grantedMedals && grantedMedals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Histórico</h3>
          <div className="space-y-2">
            {grantedMedals.map(gm => {
              const medal = getMedalInfo(gm.badge_id || '');
              const tier = medal ? getTier(medal.tier) : null;
              return (
                <div key={gm.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border/20">
                  <div className="flex items-center gap-2">
                    {medal && tier && (
                      <AppIcon name={medal.icon} size={14} style={{ color: tier.color }} />
                    )}
                    <div>
                      <p className="text-xs font-medium">{getUserName(gm.user_id)}</p>
                      <p className="text-[10px] text-muted-foreground">{medal?.title || gm.badge_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-[10px]" style={tier ? { borderColor: tier.border, color: tier.color } : undefined}>
                      +{gm.points} pts
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(gm.created_at), "dd/MM/yy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
