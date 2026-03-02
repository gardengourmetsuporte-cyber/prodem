import { useState, useMemo } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { InventoryItem, Supplier, Order } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInventoryDB } from '@/hooks/useInventoryDB';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useOrders } from '@/hooks/useOrders';
import { useSupplierInvoices } from '@/hooks/useSupplierInvoices';
import { useAuth } from '@/contexts/AuthContext';
import { useQuotations } from '@/hooks/useQuotations';
import { ReceiveOrderSheet } from '@/components/inventory/ReceiveOrderSheet';
import { RegisterInvoiceAfterReceive } from '@/components/inventory/RegisterInvoiceAfterReceive';
import { SmartReceivingSheet } from '@/components/inventory/SmartReceivingSheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QuotationList } from '@/components/orders/QuotationList';

export default function OrdersPage() {
  const { isAdmin } = useAuth();
  const { items, registerMovement } = useInventoryDB();
  const { suppliers } = useSuppliers();
  const { orders, createOrder, updateOrderStatus, deleteOrder, refetch: refetchOrders } = useOrders();
  const { addInvoice } = useSupplierInvoices();
  const { createQuotation } = useQuotations();

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
  const [orderTab, setOrderTab] = useState<'to-order' | 'orders' | 'quotations'>('to-order');
  const [expandedSuppliers, setExpandedSuppliers] = useState<Record<string, boolean>>({});
  const [cotationStep, setCotationStep] = useState(false);
  const [extraSuppliers, setExtraSuppliers] = useState<string[]>([]);
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false);

  const lowStockItems = useMemo(() => items.filter(item => item.current_stock <= item.min_stock), [items]);

  const itemsBySupplier = useMemo(() => {
    const grouped: Record<string, InventoryItem[]> = {};
    lowStockItems.forEach(item => {
      if (item.supplier_id) {
        if (!grouped[item.supplier_id]) grouped[item.supplier_id] = [];
        grouped[item.supplier_id].push(item);
      }
    });
    const noSupplier = lowStockItems.filter(item => !item.supplier_id);
    if (noSupplier.length > 0) grouped['no-supplier'] = noSupplier;
    return grouped;
  }, [lowStockItems]);

  const handleOpenOrder = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    const supplierItems = itemsBySupplier[supplier.id] || [];
    const initialQuantities: Record<string, number> = {};
    supplierItems.forEach(item => {
      initialQuantities[item.id] = Math.max(0, item.min_stock - item.current_stock);
    });
    setQuantities(initialQuantities);
    setCotationStep(false);
    setExtraSuppliers([]);
    setSheetOpen(true);
  };

  const handleStartQuotation = async () => {
    if (!selectedSupplier || extraSuppliers.length === 0) return;
    const orderItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([item_id, quantity]) => ({ item_id, quantity }));
    if (orderItems.length === 0) {
      toast.error('Adicione pelo menos 1 item com quantidade');
      return;
    }
    setIsCreatingQuotation(true);
    try {
      await createQuotation({
        title: `Cotação — ${selectedSupplier.name}`,
        supplierIds: [selectedSupplier.id, ...extraSuppliers],
        items: orderItems,
      });
      setSheetOpen(false);
      setSelectedSupplier(null);
      setQuantities({});
      setCotationStep(false);
      setExtraSuppliers([]);
      setOrderTab('quotations');
    } catch {
      toast.error('Erro ao criar cotação');
    } finally {
      setIsCreatingQuotation(false);
    }
  };

  const otherSuppliers = useMemo(() => {
    if (!selectedSupplier) return [];
    return suppliers.filter(s => s.id !== selectedSupplier.id);
  }, [suppliers, selectedSupplier]);

  const handleCreateOrder = async () => {
    if (!selectedSupplier) return;
    const orderItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([item_id, quantity]) => ({ item_id, quantity }));
    if (orderItems.length === 0) return;
    setIsSubmitting(true);
    try {
      await createOrder(selectedSupplier.id, orderItems);
      setSheetOpen(false);
      setSelectedSupplier(null);
      setQuantities({});
    } catch {
      toast.error('Erro ao criar pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneForWhatsApp = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55') && cleaned.length >= 12) return cleaned;
    return `55${cleaned}`;
  };

  const hasValidWhatsApp = (phone: string | null): boolean => {
    if (!phone) return false;
    return phone.replace(/\D/g, '').length >= 10;
  };

  const handleSendWhatsApp = (order: Order) => {
    if (!order.supplier?.phone || !hasValidWhatsApp(order.supplier.phone)) {
      toast.error('Fornecedor sem WhatsApp cadastrado');
      return;
    }
    const itemsList = order.order_items?.map(oi => {
      const unit = oi.item?.unit_type === 'kg' ? 'kg' : oi.item?.unit_type === 'litro' ? 'L' : 'un';
      return `• ${oi.item?.name}: ${oi.quantity} ${unit}`;
    }).join('\n');
    const message = `*Pedido de Compra*\n\nOlá! Gostaria de fazer o seguinte pedido:\n\n${itemsList}\n\n${order.notes ? `Obs: ${order.notes}` : ''}`;
    const phone = formatPhoneForWhatsApp(order.supplier.phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    updateOrderStatus(order.id, 'sent');
  };

  const handleReceiveOrder = async (orderId: string, receivedItems: { itemId: string; quantity: number }[]) => {
    try {
      for (const item of receivedItems) {
        await registerMovement(item.itemId, 'entrada', item.quantity, 'Recebimento de pedido');
      }
      await updateOrderStatus(orderId, 'received');
    } catch {
      toast.error('Erro ao receber pedido');
      throw new Error();
    }
  };

  const handleRegisterInvoice = async (data: {
    orderId: string; supplierId: string; amount: number; dueDate: string; description: string; invoiceNumber?: string;
  }): Promise<string> => {
    const invoiceId = await addInvoice({
      supplier_id: data.supplierId, amount: data.amount, due_date: data.dueDate,
      description: data.description, invoice_number: data.invoiceNumber,
    });
    if (invoiceId) {
      await supabase.from('orders').update({ supplier_invoice_id: invoiceId }).eq('id', data.orderId);
      await refetchOrders();
    }
    return invoiceId || '';
  };

  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'draft': return { label: 'Rascunho', bg: 'bg-muted', text: 'text-muted-foreground' };
      case 'sent': return { label: 'Enviado', bg: 'bg-primary/10', text: 'text-primary' };
      case 'received': return { label: 'Recebido', bg: 'bg-success/10', text: 'text-success' };
      case 'cancelled': return { label: 'Cancelado', bg: 'bg-destructive/10', text: 'text-destructive' };
      default: return { label: status, bg: 'bg-muted', text: 'text-muted-foreground' };
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'draft' || o.status === 'sent');
  const completedOrders = orders.filter(o => o.status === 'received' || o.status === 'cancelled');

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-4">
          {/* Animated Tabs */}
          <AnimatedTabs
            tabs={[
              { key: 'to-order', label: 'Sugestões', icon: <AppIcon name="Package" size={16} />, badge: lowStockItems.length },
              { key: 'quotations', label: 'Cotações', icon: <AppIcon name="Scale" size={16} /> },
              { key: 'orders', label: 'Histórico', icon: <AppIcon name="Clock" size={16} />, badge: pendingOrders.length },
            ]}
            activeTab={orderTab}
            onTabChange={(key) => setOrderTab(key as 'to-order' | 'orders' | 'quotations')}
          />

          <div className="animate-fade-in" key={orderTab}>
            {orderTab === 'to-order' && (
              Object.keys(itemsBySupplier).length === 0 ? (
                <EmptyState
                  icon="PackageCheck"
                  title="Estoque em dia!"
                  subtitle="Todos os itens estão acima do mínimo"
                />
              ) : (
                <div className="space-y-3">
                  {Object.entries(itemsBySupplier).map(([supplierId, supplierItems], index) => {
                    const supplier = suppliers.find(s => s.id === supplierId);
                    const isNoSupplier = supplierId === 'no-supplier';
                    const isExpanded = expandedSuppliers[supplierId] ?? false;

                    return (
                      <div
                        key={supplierId}
                        className="bg-[#0a1a10] rounded-2xl border border-emerald-500/10 overflow-hidden transition-all hover:border-emerald-500/25 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <Collapsible open={isExpanded} onOpenChange={(open) => setExpandedSuppliers(prev => ({ ...prev, [supplierId]: open }))}>
                          {/* Card header - always visible */}
                          <div className="flex items-center justify-between p-4">
                            <CollapsibleTrigger className="flex items-center gap-3 min-w-0 flex-1 text-left">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                isNoSupplier ? "bg-muted" : "bg-emerald-500/10"
                               )}>
                                 <AppIcon name="Package" size={20} className={cn(isNoSupplier ? "text-muted-foreground" : "text-emerald-400")} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold font-display text-foreground truncate">
                                  {isNoSupplier ? 'Sem Fornecedor' : supplier?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {supplierItems.length} ite{supplierItems.length !== 1 ? 'ns' : 'm'} abaixo do mínimo
                                </p>
                              </div>
                              <AppIcon name="ChevronDown" size={16} className={cn(
                                "text-muted-foreground transition-transform duration-200 shrink-0 mr-2",
                                isExpanded && "rotate-180"
                              )} />
                            </CollapsibleTrigger>
                            {!isNoSupplier && supplier && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenOrder(supplier)}
                                className="gap-1.5 rounded-xl shadow-lg shadow-emerald-500/20 shrink-0"
                              >
                                <AppIcon name="Plus" size={16} />
                                Pedir
                              </Button>
                            )}
                          </div>

                          {/* Items list - collapsible */}
                          <CollapsibleContent>
                            <div className="border-t border-emerald-500/5">
                              {supplierItems.map((item, i) => (
                                <div
                                  key={item.id}
                                  className={cn(
                                    "flex items-center justify-between px-4 py-2.5 transition-colors",
                                    i < supplierItems.length - 1 && "border-b border-emerald-500/5"
                                  )}
                                >
                                  <span className="text-sm text-foreground">{item.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                                      item.current_stock === 0
                                        ? "bg-destructive/10 text-destructive"
                                        : "bg-warning/10 text-warning"
                                    )}>
                                      {item.current_stock}/{item.min_stock}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">{item.unit_type}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Cotações Tab */}
            {orderTab === 'quotations' && <QuotationList />}

            {/* Histórico Tab */}
            {orderTab === 'orders' && (
              orders.length === 0 ? (
                <EmptyState
                  icon="Clock"
                  title="Nenhum pedido"
                  subtitle="Crie um pedido a partir das sugestões"
                />
              ) : (
                <div className="space-y-6 animate-fade-in">
                  {/* Pending orders */}
                  {pendingOrders.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Pendentes</p>
                      {pendingOrders.map((order, index) => {
                        const status = getStatusConfig(order.status);
                        return (
                          <Collapsible key={order.id}>
                            <div
                               className="bg-[#0a1a10] rounded-2xl border border-emerald-500/10 overflow-hidden transition-all hover:border-emerald-500/25 animate-fade-in"
                               style={{ animationDelay: `${index * 50}ms` }}
                             >
                               <CollapsibleTrigger className="w-full text-left">
                                 <div className="flex items-center justify-between p-4">
                                   <div className="flex items-center gap-3 min-w-0">
                                     <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                       <AppIcon name="ShoppingCart" size={20} className="text-emerald-400" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold font-display text-foreground truncate">{order.supplier?.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString('pt-BR')} · {Array.isArray(order.order_items) ? order.order_items.length : 0} itens
                                      </p>
                                    </div>
                                  </div>
                                  <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full shrink-0", status.bg, status.text)}>
                                    {status.label}
                                  </span>
                                </div>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                 <div className="border-t border-emerald-500/5 px-4 py-3 space-y-3">
                                   {/* Items */}
                                   <div className="space-y-1.5">
                                     {order.order_items?.map(oi => (
                                       <div key={oi.id} className="flex items-center justify-between py-1.5">
                                        <span className="text-sm text-foreground">{oi.item?.name}</span>
                                        <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                                          ×{oi.quantity} {oi.item?.unit_type}
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Actions */}
                                   <div className="flex items-center gap-2 pt-1 border-t border-emerald-500/5">
                                     {order.status === 'draft' && (
                                      hasValidWhatsApp(order.supplier?.phone || null) ? (
                                         <Button
                                          size="sm"
                                          onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(order); }}
                                          className="gap-1.5 rounded-xl bg-[hsl(142,70%,35%)] hover:bg-[hsl(142,70%,30%)] shadow-lg"
                                        >
                                          <AppIcon name="MessageCircle" className="w-4 h-4" />
                                          WhatsApp
                                        </Button>
                                      ) : (
                                        <span className="text-xs text-warning flex items-center gap-1 px-2 py-1 bg-warning/10 rounded-lg">
                                          <AppIcon name="MessageCircle" className="w-3.5 h-3.5" />
                                          Sem WhatsApp
                                        </span>
                                      )
                                    )}
                                    {order.status === 'sent' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => { e.stopPropagation(); setOrderToReceive(order); setReceiveOrderOpen(true); }}
                                        className="gap-1.5 rounded-xl bg-success/10 hover:bg-success/20 text-success border-success/30"
                                      >
                                        <AppIcon name="PackageCheck" size={16} />
                                        Receber
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                                      className="text-destructive hover:text-destructive rounded-xl ml-auto"
                                    >
                                      <AppIcon name="Trash2" size={16} />
                                    </Button>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        );
                      })}
                    </div>
                  )}

                  {/* Completed orders */}
                  {completedOrders.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Concluídos</p>
                      {completedOrders.map((order, index) => {
                        const status = getStatusConfig(order.status);
                        return (
                          <Collapsible key={order.id}>
                            <div
                               className="bg-[#0a1a10] rounded-2xl border border-emerald-500/10 overflow-hidden transition-all hover:border-emerald-500/25 animate-fade-in"
                               style={{ animationDelay: `${index * 50}ms` }}
                             >
                               <CollapsibleTrigger className="w-full text-left">
                                 <div className="flex items-center justify-between p-4">
                                   <div className="flex items-center gap-3 min-w-0">
                                     <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                      order.status === 'received' ? "bg-success/10" : "bg-destructive/10"
                                    )}>
                                      {order.status === 'received'
                                        ? <AppIcon name="PackageCheck" size={20} className="text-success" />
                                        : <AppIcon name="ShoppingCart" size={20} className="text-destructive" />
                                      }
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-foreground truncate">{order.supplier?.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString('pt-BR')} · {Array.isArray(order.order_items) ? order.order_items.length : 0} itens
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {order.status === 'received' && order.supplier_invoice_id && (
                                      <AppIcon name="FileText" size={16} className="text-success" />
                                    )}
                                    <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full", status.bg, status.text)}>
                                      {status.label}
                                    </span>
                                  </div>
                                </div>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                 <div className="border-t border-emerald-500/5 px-4 py-3 space-y-3">
                                   <div className="space-y-1.5">
                                     {order.order_items?.map(oi => (
                                       <div key={oi.id} className="flex items-center justify-between py-1.5">
                                        <span className="text-sm text-foreground">{oi.item?.name}</span>
                                        <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                                          ×{oi.quantity} {oi.item?.unit_type}
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex items-center gap-2 pt-1 border-t border-emerald-500/5">
                                    {order.status === 'received' && !order.supplier_invoice_id && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => { e.stopPropagation(); setOrderForInvoice(order); setInvoiceSheetOpen(true); }}
                                        className="gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                                      >
                                        <AppIcon name="FileText" size={16} />
                                        Despesa
                                      </Button>
                                    )}
                                    {order.status === 'received' && order.supplier_invoice_id && (
                                      <span className="text-xs text-success flex items-center gap-1 px-2 py-1 bg-success/10 rounded-lg">
                                        <AppIcon name="FileText" size={14} />
                                        Despesa registrada
                                      </span>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                                      className="text-destructive hover:text-destructive rounded-xl ml-auto"
                                    >
                                      <AppIcon name="Trash2" size={16} />
                                    </Button>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        );
                      })}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* Sheets */}
        <ReceiveOrderSheet
          order={orderToReceive}
          open={receiveOrderOpen}
          onOpenChange={setReceiveOrderOpen}
          onConfirmReceive={handleReceiveOrder}
          onSmartReceive={() => { setSmartReceivingOrder(orderToReceive); setSmartReceivingOpen(true); }}
        />

        <SmartReceivingSheet
          open={smartReceivingOpen}
          onOpenChange={setSmartReceivingOpen}
          order={smartReceivingOrder}
          inventoryItems={items}
          onComplete={() => setSmartReceivingOpen(false)}
        />

        <RegisterInvoiceAfterReceive
          order={orderForInvoice}
          open={invoiceSheetOpen}
          onOpenChange={setInvoiceSheetOpen}
          onRegisterInvoice={handleRegisterInvoice}
          onSkip={() => setOrderForInvoice(null)}
        />

        {/* Create Order Sheet */}
        <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) { setCotationStep(false); setExtraSuppliers([]); } }}>
          <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[80vh] overflow-y-auto">
            <SheetHeader className="pb-4">
              <SheetTitle>
                {cotationStep
                  ? `Cotação — ${selectedSupplier?.name} + ?`
                  : `Novo Pedido — ${selectedSupplier?.name}`}
              </SheetTitle>
            </SheetHeader>

            {!cotationStep ? (
              <div className="space-y-3">
                {selectedSupplier && itemsBySupplier[selectedSupplier.id]?.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Atual: {item.current_stock} · Mín: {item.min_stock}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={quantities[item.id] || 0}
                      onChange={(e) => setQuantities(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                      className="w-16 h-10 text-center rounded-xl shrink-0"
                    />
                    <span className="text-xs text-muted-foreground w-14 text-right shrink-0">{item.unit_type}</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateOrder}
                    disabled={isSubmitting || Object.values(quantities).every(q => q === 0)}
                    className="flex-1 h-12 rounded-xl shadow-lg shadow-emerald-500/20"
                  >
                    {isSubmitting ? 'Criando...' : 'Criar Pedido'}
                  </Button>
                  {otherSuppliers.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setCotationStep(true)}
                      disabled={Object.values(quantities).every(q => q === 0)}
                      className="h-12 rounded-xl gap-2"
                    >
                      <AppIcon name="Scale" size={16} />
                      Cotar
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione fornecedores adicionais para comparar preços:
                </p>
                <div className="flex flex-wrap gap-2">
                  {otherSuppliers.map(s => {
                    const isSelected = extraSuppliers.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => setExtraSuppliers(prev =>
                          isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id]
                        )}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                           isSelected
                             ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                             : "bg-emerald-500/5 border-emerald-500/10 text-foreground hover:border-emerald-500/20"
                        )}
                      >
                        {isSelected && <AppIcon name="Check" size={14} />}
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                {otherSuppliers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum outro fornecedor cadastrado.
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setCotationStep(false)}
                    className="h-12 rounded-xl gap-2"
                  >
                    <AppIcon name="ArrowLeft" size={16} />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleStartQuotation}
                    disabled={extraSuppliers.length === 0 || isCreatingQuotation}
                    className="flex-1 h-12 rounded-xl shadow-lg shadow-emerald-500/20 gap-2"
                  >
                    <AppIcon name="Scale" size={16} />
                    {isCreatingQuotation ? 'Criando...' : 'Iniciar Cotação'}
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
