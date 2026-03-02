import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Customer, LoyaltyEvent } from '@/types/customer';
import { SEGMENT_CONFIG } from '@/types/customer';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  events: LoyaltyEvent[];
  eventsLoading: boolean;
  onEdit: () => void;
  onAddPoints: (customerId: string) => void;
  loyaltyRules?: import('@/types/customer').LoyaltyRule[];
}

export function CustomerDetail({ open, onOpenChange, customer, events, eventsLoading, onEdit, onAddPoints, loyaltyRules = [] }: Props) {
  if (!customer) return null;

  const activePointsRule = loyaltyRules.find(r => r.rule_type === 'points_per_real' && r.is_active);
  const activeOrdersRule = loyaltyRules.find(r => r.rule_type === 'orders_for_free' && r.is_active);

  const seg = SEGMENT_CONFIG[customer.segment] || SEGMENT_CONFIG.new;
  const daysSince = customer.last_purchase_at
    ? differenceInDays(new Date(), new Date(customer.last_purchase_at))
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] rounded-t-2xl flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            {customer.name}
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full', seg.bg, seg.color)}>
              <span className="material-symbols-rounded" style={{ fontSize: 12 }}>{seg.icon}</span>
              {seg.label}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-5 mt-4 pb-8">
          {/* Score visual */}
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score de Relacionamento</span>
              <span className="text-2xl font-bold">{customer.score}</span>
            </div>
            <Progress value={Math.min(customer.score, 100)} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <p className="font-semibold">{daysSince !== null ? `${daysSince}d` : '-'}</p>
                <p className="text-muted-foreground">Recência</p>
              </div>
              <div>
                <p className="font-semibold">{customer.total_orders || 0}</p>
                <p className="text-muted-foreground">Frequência</p>
              </div>
              <div>
                <p className="font-semibold">R$ {Number(customer.total_spent || 0).toFixed(0)}</p>
                <p className="text-muted-foreground">Monetário</p>
              </div>
            </div>
          </div>

          {/* Quick info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/30 bg-card/60 p-3 text-center">
              <p className="text-lg font-bold text-amber-500">{customer.loyalty_points}</p>
              <p className="text-[10px] text-muted-foreground">Pontos Fidelidade</p>
            </div>
            <div className="rounded-xl border border-border/30 bg-card/60 p-3 text-center">
              <p className="text-lg font-bold">{customer.visit_frequency_days ? `${Math.round(customer.visit_frequency_days)}d` : '-'}</p>
              <p className="text-[10px] text-muted-foreground">Freq. Visita</p>
            </div>
          </div>

          {/* Active loyalty rules */}
          {(activePointsRule || activeOrdersRule) && (
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 space-y-2">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>loyalty</span>
                Regras de Fidelidade Ativas
              </p>
              {activePointsRule && (
                <p className="text-xs text-muted-foreground">
                  ⭐ {activePointsRule.reward_value} pt{activePointsRule.reward_value > 1 ? 's' : ''} a cada R${activePointsRule.threshold} gasto
                </p>
              )}
              {activeOrdersRule && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    🎁 A cada {activeOrdersRule.threshold} pedidos = {activeOrdersRule.reward_value} grátis
                  </p>
                  <div className="flex items-center gap-2">
                    <Progress value={((customer.total_orders || 0) % activeOrdersRule.threshold) / activeOrdersRule.threshold * 100} className="h-1.5 flex-1" />
                    <span className="text-[10px] font-bold text-primary">
                      {(customer.total_orders || 0) % activeOrdersRule.threshold}/{activeOrdersRule.threshold}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact */}
          <div className="space-y-1.5">
            {customer.phone && (
              <p className="text-sm flex items-center gap-2">
                <span className="material-symbols-rounded text-muted-foreground" style={{ fontSize: 16 }}>call</span>
                {customer.phone}
              </p>
            )}
            {customer.email && (
              <p className="text-sm flex items-center gap-2">
                <span className="material-symbols-rounded text-muted-foreground" style={{ fontSize: 16 }}>mail</span>
                {customer.email}
              </p>
            )}
            {customer.birthday && (
              <p className="text-sm flex items-center gap-2">
                <span className="material-symbols-rounded text-muted-foreground" style={{ fontSize: 16 }}>cake</span>
                {format(new Date(customer.birthday + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            )}
          </div>

          <Separator />

          {/* Loyalty history */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Histórico de Fidelidade</h3>
            {eventsLoading ? (
              <p className="text-xs text-muted-foreground">Carregando...</p>
            ) : events.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum evento registrado.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {events.map(ev => (
                  <div key={ev.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'material-symbols-rounded',
                          ev.type === 'earn' ? 'text-success' : ev.type === 'redeem' ? 'text-destructive' : 'text-amber-500'
                        )}
                        style={{ fontSize: 14 }}
                      >
                        {ev.type === 'earn' ? 'add_circle' : ev.type === 'redeem' ? 'remove_circle' : 'redeem'}
                      </span>
                      <span>{ev.description || ev.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('font-bold', ev.type === 'redeem' ? 'text-destructive' : 'text-success')}>
                        {ev.type === 'redeem' ? '-' : '+'}{ev.points}
                      </span>
                      <span className="text-muted-foreground">
                        {format(new Date(ev.created_at), 'dd/MM', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 pb-4">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onEdit}>
              <span className="material-symbols-rounded mr-1.5" style={{ fontSize: 16 }}>edit</span>
              Editar
            </Button>
            <Button className="flex-1 rounded-xl" onClick={() => onAddPoints(customer.id)}>
              <span className="material-symbols-rounded mr-1.5" style={{ fontSize: 16 }}>star</span>
              Adicionar Pontos
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
