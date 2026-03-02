import { useState, useMemo } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { InventoryItem, Supplier, Order } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ReceiveOrderSheet } from './ReceiveOrderSheet';
import { RegisterInvoiceAfterReceive } from './RegisterInvoiceAfterReceive';
import { SmartReceivingSheet } from './SmartReceivingSheet';

interface OrdersTabProps {
  items: InventoryItem[];
  suppliers: Supplier[];
  orders: Order[];
  onCreateOrder: (supplierId: string, items: { item_id: string; quantity: number }[]) => Promise<void>;
  onSendOrder: (orderId: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onReceiveOrder: (orderId: string, items: { itemId: string; quantity: number }[]) => Promise<void>;
  onRegisterInvoice?: (data: {
    orderId: string;
    supplierId: string;
    amount: number;
    dueDate: string;
    description: string;
    invoiceNumber?: string;
  }) => Promise<string | void>;
}

export function OrdersTab({
  items,
  suppliers,
  orders,
  onCreateOrder,
  onSendOrder,
  onDeleteOrder,
  onReceiveOrder,
  onRegisterInvoice,
}: OrdersTabProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiveOrderOpen, setReceiveOrderOpen] = useState(false);
  const [orderToReceive, setOrderToReceive] = useState<Order | null>(null);
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false);
  const [orderForInvoice, setOrderForInvoice] = useState<Order | null>(null);
  const [smartReceivingOpen, setSmartReceivingOpen] = useState(false);
  const [smartReceivingOrder, setSmartReceivingOrder] = useState<Order | null>(null);

  // Get items that need to be ordered (below minimum stock)
  const lowStockItems = useMemo(() => {
    return items.filter(item => item.current_stock <= item.min_stock);
  }, [items]);

  // Group low stock items by supplier
  const itemsBySupplier = useMemo(() => {
    const grouped: Record<string, InventoryItem[]> = {};
    
    // Group items with suppliers
    lowStockItems.forEach(item => {
      if (item.supplier_id) {
        if (!grouped[item.supplier_id]) {
          grouped[item.supplier_id] = [];
        }
        grouped[item.supplier_id].push(item);
      }
    });

    // Items without supplier
    const noSupplier = lowStockItems.filter(item => !item.supplier_id);
    if (noSupplier.length > 0) {
      grouped['no-supplier'] = noSupplier;
    }

    return grouped;
  }, [lowStockItems]);

  const handleOpenOrder = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    // Initialize quantities with suggested amounts (min_stock - current_stock)
    const supplierItems = itemsBySupplier[supplier.id] || [];
    const initialQuantities: Record<string, number> = {};
    supplierItems.forEach(item => {
      initialQuantities[item.id] = Math.max(0, item.min_stock - item.current_stock);
    });
    setQuantities(initialQuantities);
    setSheetOpen(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedSupplier) return;

    const orderItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([item_id, quantity]) => ({ item_id, quantity }));

    if (orderItems.length === 0) return;

    setIsSubmitting(true);
    try {
      await onCreateOrder(selectedSupplier.id, orderItems);
      setSheetOpen(false);
      setSelectedSupplier(null);
      setQuantities({});
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneForWhatsApp = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    // Se já começa com 55, usa direto
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      return cleaned;
    }
    // Adiciona 55 se não tiver
    return `55${cleaned}`;
  };

  const hasValidWhatsApp = (phone: string | null): boolean => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  const handleSendWhatsApp = (order: Order) => {
    if (!order.supplier?.phone || !hasValidWhatsApp(order.supplier.phone)) {
      alert('Este fornecedor não tem telefone válido cadastrado. Cadastre um número de WhatsApp nas configurações.');
      return;
    }

    const itemsList = order.order_items?.map(oi => {
      const unit = oi.item?.unit_type === 'kg' ? 'kg' : oi.item?.unit_type === 'litro' ? 'L' : 'un';
      return `• ${oi.item?.name}: ${oi.quantity} ${unit}`;
    }).join('\n');

    const message = `*Pedido de Compra*\n\nOlá! Gostaria de fazer o seguinte pedido:\n\n${itemsList}\n\n${order.notes ? `Obs: ${order.notes}` : ''}`;
    
    const phone = formatPhoneForWhatsApp(order.supplier.phone);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    onSendOrder(order.id);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs rounded-full bg-secondary text-muted-foreground">Rascunho</span>;
      case 'sent':
        return <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">Enviado</span>;
      case 'received':
        return <span className="px-2 py-1 text-xs rounded-full bg-success/10 text-success">Recebido</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs rounded-full bg-destructive/10 text-destructive">Cancelado</span>;
    }
  };

  const [orderTab, setOrderTab] = useState<'to-order' | 'orders'>('to-order');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
        <button
          onClick={() => setOrderTab('to-order')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
            orderTab === 'to-order'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <AppIcon name="Package" size={16} />
          Itens para Pedido
          {lowStockItems.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-warning/10 text-warning">
              {lowStockItems.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setOrderTab('orders')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
            orderTab === 'orders'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <AppIcon name="Schedule" size={16} />
          Pedidos Feitos
          {orders.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary">
              {orders.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Itens para Pedido */}
      {orderTab === 'to-order' && (
        Object.keys(itemsBySupplier).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AppIcon name="Package" size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum item precisa de reposição</p>
            <p className="text-sm mt-1">Todos os itens estão acima do estoque mínimo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(itemsBySupplier).map(([supplierId, supplierItems]) => {
              const supplier = suppliers.find(s => s.id === supplierId);
              const isNoSupplier = supplierId === 'no-supplier';

              return (
                <div key={supplierId} className="bg-card rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {isNoSupplier ? 'Sem Fornecedor' : supplier?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {supplierItems.length} item(ns) abaixo do mínimo
                      </p>
                    </div>
                    {!isNoSupplier && supplier && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenOrder(supplier)}
                        className="gap-2"
                      >
                        <AppIcon name="Add" size={16} />
                        Criar Pedido
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {supplierItems.slice(0, 3).map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 border-t border-border/50 first:border-t-0"
                      >
                        <span className="text-sm">{item.name}</span>
                        <span className={cn(
                          "text-sm font-medium",
                          item.current_stock === 0 ? "text-destructive" : "text-warning"
                        )}>
                          {item.current_stock} / {item.min_stock} {item.unit_type}
                        </span>
                      </div>
                    ))}
                    {supplierItems.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{supplierItems.length - 3} mais item(ns)
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Tab: Pedidos Feitos */}
      {orderTab === 'orders' && (
        orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AppIcon name="Schedule" size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum pedido feito</p>
            <p className="text-sm mt-1">Crie um pedido a partir dos itens para pedido</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-card rounded-xl border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{order.supplier?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="text-sm text-muted-foreground mb-3">
                  {order.order_items?.map(oi => (
                    <span key={oi.id} className="inline-block mr-2">
                      {oi.item?.name} ({oi.quantity})
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  {order.status === 'draft' && (
                    <>
                      {hasValidWhatsApp(order.supplier?.phone || null) ? (
                        <Button
                          size="sm"
                          onClick={() => handleSendWhatsApp(order)}
                          className="gap-2 bg-success hover:bg-success/90"
                        >
                          <AppIcon name="Chat" size={16} />
                          Enviar WhatsApp
                        </Button>
                      ) : (
                        <span className="text-xs text-warning flex items-center gap-1">
                          <AppIcon name="Chat" size={16} />
                          Sem WhatsApp
                        </span>
                      )}
                    </>
                  )}
                  {order.status === 'sent' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOrderToReceive(order);
                        setReceiveOrderOpen(true);
                      }}
                      className="gap-2 bg-success/10 hover:bg-success/20 text-success border-success/30"
                    >
                      <AppIcon name="PackageCheck" size={16} />
                      Receber Pedido
                    </Button>
                  )}
                  {order.status === 'received' && onRegisterInvoice && !order.supplier_invoice_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOrderForInvoice(order);
                        setInvoiceSheetOpen(true);
                      }}
                      className="gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                    >
                      <AppIcon name="Description" size={16} />
                      Cadastrar Despesa
                    </Button>
                  )}
                  {order.status === 'received' && order.supplier_invoice_id && (
                    <span className="text-xs text-success flex items-center gap-1">
                      <AppIcon name="Description" size={16} />
                      Despesa cadastrada
                    </span>
                  )}
                  {(order.status === 'draft' || order.status === 'sent' || order.status === 'received') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteOrder(order.id)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <AppIcon name="Delete" size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Receive Order Sheet */}
      <ReceiveOrderSheet
        order={orderToReceive}
        open={receiveOrderOpen}
        onOpenChange={setReceiveOrderOpen}
        onConfirmReceive={async (orderId, items) => {
          await onReceiveOrder(orderId, items);
          if (onRegisterInvoice) {
            setOrderForInvoice(orderToReceive);
            setInvoiceSheetOpen(true);
          }
        }}
        onSmartReceive={() => {
          setSmartReceivingOrder(orderToReceive);
          setSmartReceivingOpen(true);
        }}
      />

      {/* Smart Receiving Sheet */}
      <SmartReceivingSheet
        open={smartReceivingOpen}
        onOpenChange={setSmartReceivingOpen}
        order={smartReceivingOrder}
        inventoryItems={items}
        onComplete={() => {
          setSmartReceivingOpen(false);
        }}
      />

      {/* Register Invoice After Receive */}
      {onRegisterInvoice && (
        <RegisterInvoiceAfterReceive
          order={orderForInvoice}
          open={invoiceSheetOpen}
          onOpenChange={setInvoiceSheetOpen}
          onRegisterInvoice={async (data) => {
            const invoiceId = await onRegisterInvoice(data);
            return invoiceId;
          }}
          onSkip={() => {
            setOrderForInvoice(null);
          }}
        />
      )}

      {/* Create Order Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[80vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>
              Novo Pedido - {selectedSupplier?.name}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            {selectedSupplier && itemsBySupplier[selectedSupplier.id]?.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Estoque: {item.current_stock} / Mínimo: {item.min_stock}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={quantities[item.id] || 0}
                    onChange={(e) => setQuantities(prev => ({
                      ...prev,
                      [item.id]: Number(e.target.value)
                    }))}
                    className="w-20 h-10 text-center"
                  />
                  <span className="text-sm text-muted-foreground w-8">
                    {item.unit_type}
                  </span>
                </div>
              </div>
            ))}

            <Button
              onClick={handleCreateOrder}
              disabled={isSubmitting || Object.values(quantities).every(q => q === 0)}
              className="w-full h-12"
            >
              {isSubmitting ? 'Criando...' : 'Criar Pedido'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
