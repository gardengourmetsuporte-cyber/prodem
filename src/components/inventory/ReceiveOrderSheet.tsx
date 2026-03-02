import { useState, useEffect, forwardRef } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Order, OrderItem } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface ReceivedItem {
  orderItemId: string;
  itemId: string;
  itemName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitType: string;
  received: boolean;
}

interface ReceiveOrderSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmReceive: (orderId: string, items: { itemId: string; quantity: number }[]) => Promise<void>;
  onSmartReceive?: () => void;
}

export const ReceiveOrderSheet = forwardRef<HTMLDivElement, ReceiveOrderSheetProps>(function ReceiveOrderSheet({
  order,
  open,
  onOpenChange,
  onConfirmReceive,
  onSmartReceive,
}, ref) {
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order?.order_items) {
      setReceivedItems(
        order.order_items.map(oi => ({
          orderItemId: oi.id,
          itemId: oi.item_id,
          itemName: oi.item?.name || 'Item desconhecido',
          orderedQuantity: oi.quantity,
          receivedQuantity: oi.quantity,
          unitType: oi.item?.unit_type || 'unidade',
          received: true,
        }))
      );
    }
  }, [order]);

  const handleQuantityChange = (orderItemId: string, value: number) => {
    setReceivedItems(prev =>
      prev.map(item =>
        item.orderItemId === orderItemId
          ? { ...item, receivedQuantity: Math.max(0, value) }
          : item
      )
    );
  };

  const handleReceivedToggle = (orderItemId: string) => {
    setReceivedItems(prev =>
      prev.map(item =>
        item.orderItemId === orderItemId
          ? { ...item, received: !item.received, receivedQuantity: !item.received ? item.orderedQuantity : 0 }
          : item
      )
    );
  };

  const handleConfirm = async () => {
    if (!order) return;

    const itemsToAdd = receivedItems
      .filter(item => item.received && item.receivedQuantity > 0)
      .map(item => ({
        itemId: item.itemId,
        quantity: item.receivedQuantity,
      }));

    if (itemsToAdd.length === 0) {
      toast.error('Nenhum item selecionado para receber');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmReceive(order.id, itemsToAdd);
      onOpenChange(false);
    } catch (error) {
      console.error('Error receiving order:', error);
      toast.error('Erro ao receber pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasDiscrepancies = receivedItems.some(
    item => item.received && item.receivedQuantity !== item.orderedQuantity
  );

  const formatUnit = (unit: string) => {
    switch (unit) {
      case 'kg': return 'kg';
      case 'litro': return 'L';
      default: return 'un';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent ref={ref} side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="Package" size={20} className="text-primary" />
            Receber Pedido - {order?.supplier?.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Confira os itens recebidos. Ajuste as quantidades se algo veio diferente do pedido.
          </p>

          {/* Smart Receiving Button */}
          {onSmartReceive && (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onSmartReceive();
              }}
              className="w-full h-12 gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary"
            >
              <AppIcon name="auto_awesome" size={20} />
              Escanear Nota Fiscal com IA
            </Button>
          )}

          {receivedItems.map(item => (
            <div
              key={item.orderItemId}
              className={`p-4 rounded-xl border transition-colors ${
                item.received ? 'bg-card' : 'bg-secondary/30 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={item.received}
                  onCheckedChange={() => handleReceivedToggle(item.orderItemId)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{item.itemName}</span>
                    <span className="text-xs text-muted-foreground">
                      Pedido: {item.orderedQuantity} {formatUnit(item.unitType)}
                    </span>
                  </div>
                  
                  {item.received && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Recebido:</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.receivedQuantity}
                        onChange={(e) => handleQuantityChange(item.orderItemId, Number(e.target.value))}
                        className="w-24 h-9 text-center"
                      />
                      <span className="text-sm text-muted-foreground">
                        {formatUnit(item.unitType)}
                      </span>
                      
                      {item.receivedQuantity !== item.orderedQuantity && (
                        <AppIcon name="Warning" size={16} className="text-warning ml-2" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {hasDiscrepancies && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning">
              <AppIcon name="Warning" size={16} />
              <span className="text-sm">Algumas quantidades foram ajustadas</span>
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || receivedItems.every(i => !i.received)}
            className="w-full h-12 gap-2"
          >
            <AppIcon name="Check" size={16} />
            {isSubmitting ? 'Processando...' : 'Confirmar Recebimento e Adicionar ao Estoque'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});
