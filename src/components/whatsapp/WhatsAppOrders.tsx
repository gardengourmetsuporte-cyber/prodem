import { Button } from '@/components/ui/button';
import { useWhatsAppOrders, useRecoverCarts } from '@/hooks/useWhatsApp';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';

const statusMap: Record<string, { label: string; class: string }> = {
  draft: { label: 'Rascunho', class: 'badge-warning' },
  confirmed: { label: 'Confirmado', class: 'badge-success' },
  cancelled: { label: 'Cancelado', class: 'badge-error' },
};

export function WhatsAppOrders() {
  const { orders, isLoading, updateOrderStatus } = useWhatsAppOrders();
  const recoverCarts = useRecoverCarts();

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">Carregando...</div>;

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <AppIcon name="ShoppingBag" className="empty-state-icon" />
        <p className="empty-state-title">Nenhum pedido</p>
        <p className="empty-state-text">Os pedidos gerados via WhatsApp aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-foreground">Pedidos via WhatsApp</h3>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 border-primary/30 text-primary hover:bg-primary/10 transition-colors"
          onClick={() => recoverCarts.mutate()}
          disabled={recoverCarts.isPending}
        >
          <AppIcon name="RefreshCcw" className={cn("w-3.5 h-3.5", recoverCarts.isPending && "animate-spin")} />
          {recoverCarts.isPending ? "Processando..." : "Recuperar Carrinhos"}
        </Button>
      </div>
      {orders.map(order => {
        const st = statusMap[order.status] || statusMap.draft;
        return (
          <div key={order.id} className="list-command">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground">
                    {order.contact?.name || order.contact?.phone || 'Cliente'}
                  </span>
                  <span className={cn('badge-status text-[10px]', st.class)}>{st.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <AppIcon name="Phone" className="w-3 h-3" />
                  {order.contact?.phone || '-'}
                  <span className="ml-2">{format(new Date(order.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}</span>
                </div>
                {/* Items */}
                <div className="space-y-0.5">
                  {order.items.map((item, i) => (
                    <div key={i} className="text-xs flex justify-between text-muted-foreground">
                      <span>{item.qty}x {item.name}</span>
                      <span>R$ {(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 pt-1.5 border-t border-border/20 flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span className="text-foreground">R$ {order.total.toFixed(2)}</span>
                </div>
                {order.notes && <p className="text-xs text-muted-foreground mt-1 italic">{order.notes}</p>}
              </div>
            </div>
            {order.status === 'draft' && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => updateOrderStatus.mutate({ id: order.id, status: 'confirmed' })}
                >
                  <AppIcon name="Check" className="w-3.5 h-3.5" /> Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 text-xs text-destructive"
                  onClick={() => updateOrderStatus.mutate({ id: order.id, status: 'cancelled' })}
                >
                  <AppIcon name="X" className="w-3.5 h-3.5" /> Cancelar
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
