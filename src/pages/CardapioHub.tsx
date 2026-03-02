import { useState, useMemo, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMenuAdmin, MenuProduct, MenuOptionGroup } from '@/hooks/useMenuAdmin';
import { useTabletAdmin } from '@/hooks/useTabletAdmin';
import { useUnit } from '@/contexts/UnitContext';
import { useFabAction } from '@/contexts/FabActionContext';

// Menu components
import { MenuCategoryTree } from '@/components/menu/MenuCategoryTree';
import { MenuGroupContent } from '@/components/menu/MenuGroupContent';
import { ProductSheet } from '@/components/menu/ProductSheet';
import { OptionGroupList } from '@/components/menu/OptionGroupList';
import { OptionGroupSheet } from '@/components/menu/OptionGroupSheet';
import { LinkOptionsDialog } from '@/components/menu/LinkOptionsDialog';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CardapioSettings = lazy(() => import('@/components/settings/CardapioSettings').then(m => ({ default: m.CardapioSettings })));

type CardapioTab = 'produtos' | 'opcionais' | 'config';

export default function CardapioHub() {
  const { activeUnit } = useUnit();
  const [searchParams] = useSearchParams();
  const isPedidos = searchParams.get('tab') === 'pedidos';
  const isConfigFromUrl = searchParams.get('section') === 'config';

  // Menu admin hook
  const menuAdmin = useMenuAdmin();
  const {
    categories, groups, products, optionGroups, loading: menuLoading,
    saveCategory, deleteCategory,
    saveGroup, deleteGroup,
    saveProduct, deleteProduct,
    saveOptionGroup, deleteOptionGroup,
    getProductsByGroup, getLinkedProductIds, getLinkedOptionGroupIds,
    setProductOptionLinks, uploadProductImage,
  } = menuAdmin;

  // Tablet admin hook (for orders)
  const tabletAdmin = useTabletAdmin();
  const { orders, pdvConfig, retryPDV } = tabletAdmin;

  // Internal tab for cardápio content
  const [cardapioTab, setCardapioTab] = useState<CardapioTab>(isConfigFromUrl ? 'config' : 'produtos');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (isConfigFromUrl) setCardapioTab('config');
  }, [isConfigFromUrl]);
  const handleSelectGroup = useCallback((groupId: string) => {
    setSelectedGroupId(prev => prev === groupId ? null : groupId);
  }, []);

  // Product sheet
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<MenuProduct> | null>(null);

  // Option group sheet
  const [ogSheetOpen, setOgSheetOpen] = useState(false);
  const [editingOG, setEditingOG] = useState<Partial<MenuOptionGroup> | null>(null);

  // Link dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingOG, setLinkingOG] = useState<MenuOptionGroup | null>(null);

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;
  const groupProducts = selectedGroupId ? getProductsByGroup(selectedGroupId) : [];

  // Contextual FAB action based on current sub-view
  const fabAction = useMemo(() => {
    if (isPedidos || cardapioTab === 'config') {
      return null; // No primary action on orders or config
    }
    if (cardapioTab === 'opcionais') {
      return { icon: 'Plus', label: 'Novo Opcional', onClick: () => {
        setEditingOG({
          title: '', min_selections: 0, max_selections: 1,
          allow_repeat: false, is_active: true,
          availability: { tablet: true, delivery: true }, options: [],
        });
        setOgSheetOpen(true);
      }};
    }
    // Default: add product
    return { icon: 'Plus', label: 'Novo Produto', onClick: () => {
      setEditingProduct({
        name: '', price: 0, category: 'Geral', group_id: selectedGroupId,
        is_active: true, availability: { tablet: true, delivery: true },
        price_type: 'fixed', is_highlighted: false, is_18_plus: false,
      });
      setProductSheetOpen(true);
    }};
  }, [isPedidos, cardapioTab, selectedGroupId]);

  useFabAction(fabAction, [fabAction]);

  // Order stats
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter(o => o.created_at.slice(0, 10) === today);
    return {
      total: todayOrders.length,
      sent: todayOrders.filter(o => o.status === 'sent_to_pdv').length,
      errors: todayOrders.filter(o => o.status === 'error').length,
      pending: todayOrders.filter(o => o.status === 'confirmed' || o.status === 'awaiting_confirmation').length,
    };
  }, [orders]);

  const statusColor: Record<string, string> = {
    draft: 'bg-secondary text-muted-foreground',
    awaiting_confirmation: 'bg-warning/15 text-warning',
    confirmed: 'bg-primary/15 text-primary',
    sent_to_pdv: 'bg-success/15 text-success',
    error: 'bg-destructive/15 text-destructive',
  };
  const statusLabel: Record<string, string> = {
    draft: 'Rascunho',
    awaiting_confirmation: 'Aguardando',
    confirmed: 'Confirmado',
    sent_to_pdv: 'Enviado PDV',
    error: 'Erro',
  };
  const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Product sheet handlers
  const openNewProduct = () => {
    setEditingProduct({
      name: '', price: 0, category: 'Geral', group_id: selectedGroupId,
      is_active: true, availability: { tablet: true, delivery: true },
      price_type: 'fixed', is_highlighted: false, is_18_plus: false,
    });
    setProductSheetOpen(true);
  };
  const openEditProduct = (p: MenuProduct) => { setEditingProduct(p); setProductSheetOpen(true); };

  // Option group handlers
  const openNewOG = () => {
    setEditingOG({
      title: '', min_selections: 0, max_selections: 1,
      allow_repeat: false, is_active: true,
      availability: { tablet: true, delivery: true }, options: [],
    });
    setOgSheetOpen(true);
  };
  const openEditOG = (og: MenuOptionGroup) => { setEditingOG(og); setOgSheetOpen(true); };
  const openLinkProducts = (og: MenuOptionGroup) => { setLinkingOG(og); setLinkDialogOpen(true); };

  // ==================== PEDIDOS VIEW ====================
  if (isPedidos) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background pb-24">
          <header className="page-header-bar">
            <div className="page-header-content flex items-center justify-between">
              <h1 className="text-lg font-bold flex items-center gap-2">
                <AppIcon name="ShoppingBag" size={20} className="text-primary" />
                Pedidos
              </h1>
              {activeUnit && (
                <a href={`/m/${activeUnit.id}`} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-primary font-medium">
                  <AppIcon name="ExternalLink" size={14} /> Catálogo
                </a>
              )}
            </div>
          </header>

          <div className="px-4 py-3 lg:px-6 space-y-4">
            {/* Stats row */}
            {pdvConfig?.is_active && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: 'Send', value: todayStats.sent, label: 'Enviados', color: 'text-success' },
                  { icon: 'AlertCircle', value: todayStats.errors, label: 'Erros', color: 'text-destructive' },
                  { icon: 'Clock', value: todayStats.pending, label: 'Pendentes', color: 'text-warning' },
                ].map(s => (
                  <div key={s.label} className="card-base p-3 text-center">
                    <AppIcon name={s.icon as any} size={16} className={`mx-auto ${s.color} mb-1`} />
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {orders.length === 0 ? (
              <EmptyState icon="QrCode" title="Nenhum pedido ainda" subtitle="Os pedidos feitos no cardápio digital aparecerão aqui" />
            ) : (
              orders.map(order => (
                <div key={order.id} className="card-base p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">Mesa {order.table_number}</span>
                      <Badge className={statusColor[order.status] || 'bg-secondary'}>
                        {statusLabel[order.status] || order.status}
                      </Badge>
                    </div>
                    <span className="font-bold text-primary">{formatPrice(order.total)}</span>
                  </div>
                  {order.tablet_order_items && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {order.tablet_order_items.map((item: any) => (
                        <p key={item.id}>{item.quantity}x {item.tablet_products?.name || '?'}</p>
                      ))}
                    </div>
                  )}
                  {order.error_message && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AppIcon name="AlertCircle" size={12} /> {order.error_message}
                    </p>
                  )}
                  {order.status === 'error' && (
                    <Button size="sm" variant="outline" onClick={() => retryPDV(order.id)}>
                      <AppIcon name="RefreshCw" size={14} className="mr-1" /> Reenviar
                    </Button>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(order.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // ==================== CARDÁPIO VIEW (default) ====================
  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="page-header-bar">
          <div className="page-header-content flex items-center justify-between">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <AppIcon name="Package" size={20} className="text-primary" />
              Catálogo de Produtos
            </h1>
            {activeUnit && (
              <a href={`/m/${activeUnit.id}`} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-primary font-medium">
                <AppIcon name="ExternalLink" size={14} /> Ver catálogo
              </a>
            )}
          </div>
        </header>

        {cardapioTab !== 'config' && (
          <div className="px-4 pt-3 lg:px-6">
            <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 w-fit">
              {([
                { id: 'produtos' as CardapioTab, label: 'Produtos', icon: 'ShoppingBag', count: products.length },
                { id: 'opcionais' as CardapioTab, label: 'Opcionais', icon: 'ListPlus', count: optionGroups.length },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCardapioTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    cardapioTab === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <AppIcon name={tab.icon} size={15} />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-3 lg:px-6 space-y-4">
          {/* ==================== PRODUTOS ==================== */}
          {cardapioTab === 'produtos' && (
            <div className="space-y-4">
              <MenuCategoryTree
                categories={categories}
                groups={groups}
                selectedGroupId={selectedGroupId}
                onSelectGroup={handleSelectGroup}
                onSaveCategory={saveCategory}
                onDeleteCategory={deleteCategory}
                onSaveGroup={saveGroup}
                onDeleteGroup={deleteGroup}
                getProductCount={(gid) => getProductsByGroup(gid).length}
                renderGroupContent={(gid) => {
                  const grp = groups.find(g => g.id === gid) || null;
                  const prods = getProductsByGroup(gid);
                  return (
                    <MenuGroupContent
                      group={grp}
                      products={prods}
                      getOptionCount={(pid) => getLinkedOptionGroupIds(pid).length}
                      onNewProduct={openNewProduct}
                      onEditProduct={openEditProduct}
                      onDeleteProduct={deleteProduct}
                      onLinkOptions={() => setCardapioTab('opcionais')}
                      onImageUpload={(productId, file) => uploadProductImage(productId, file)}
                      onToggleProductAvailability={(prod, channel) => {
                        const avail = (prod.availability as any) || { tablet: true, delivery: true };
                        saveProduct({ ...prod, availability: { ...avail, [channel]: !avail[channel] } } as any);
                      }}
                    />
                  );
                }}
              />
            </div>
          )}

          {/* ==================== OPCIONAIS ==================== */}
          {cardapioTab === 'opcionais' && (
            <OptionGroupList
              optionGroups={optionGroups}
              onNew={openNewOG}
              onEdit={openEditOG}
              onDelete={deleteOptionGroup}
              onLinkProducts={openLinkProducts}
            />
          )}

          {/* ==================== CONFIGURAÇÕES ==================== */}
          {cardapioTab === 'config' && (
            <Suspense fallback={<div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>}>
              <CardapioSettings />
            </Suspense>
          )}
        </div>
      </div>

      {/* Sheets */}
      <ProductSheet open={productSheetOpen} onOpenChange={setProductSheetOpen} product={editingProduct} groups={groups} onSave={saveProduct} onDelete={deleteProduct} onImageUpload={(productId, file) => uploadProductImage(productId, file)} />
      <OptionGroupSheet open={ogSheetOpen} onOpenChange={setOgSheetOpen} optionGroup={editingOG} onSave={saveOptionGroup} onDelete={deleteOptionGroup} />
      <LinkOptionsDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} optionGroup={linkingOG} categories={categories} groups={groups} products={products} linkedProductIds={linkingOG ? getLinkedProductIds(linkingOG.id) : []} onSave={(ogId, pids) => setProductOptionLinks(ogId, pids)} />
    </AppLayout>
  );
}
