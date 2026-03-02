import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMenuAdmin, MenuProduct, MenuOptionGroup } from '@/hooks/useMenuAdmin';
import { MenuCategoryTree } from '@/components/menu/MenuCategoryTree';
import { MenuGroupContent } from '@/components/menu/MenuGroupContent';
import { ProductSheet } from '@/components/menu/ProductSheet';
import { OptionGroupList } from '@/components/menu/OptionGroupList';
import { OptionGroupSheet } from '@/components/menu/OptionGroupSheet';
import { LinkOptionsDialog } from '@/components/menu/LinkOptionsDialog';
import { AppIcon } from '@/components/ui/app-icon';

export default function MenuAdmin() {
  const {
    categories, groups, products, optionGroups, loading,
    saveCategory, deleteCategory,
    saveGroup, deleteGroup,
    saveProduct, deleteProduct, uploadProductImage,
    saveOptionGroup, deleteOptionGroup,
    getProductsByGroup, getLinkedProductIds, getLinkedOptionGroupIds,
    setProductOptionLinks,
  } = useMenuAdmin();

  const [activeTab, setActiveTab] = useState<'menu' | 'options'>('menu');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

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

  const openNewProduct = () => {
    setEditingProduct({
      name: '', price: 0, category: 'Geral', group_id: selectedGroupId,
      is_active: true, availability: { tablet: true, delivery: true },
      price_type: 'fixed', is_highlighted: false, is_18_plus: false,
    });
    setProductSheetOpen(true);
  };

  const openEditProduct = (p: MenuProduct) => {
    setEditingProduct(p);
    setProductSheetOpen(true);
  };

  const openLinkOptionsForProduct = (productId: string) => {
    setActiveTab('options');
  };

  const openNewOG = () => {
    setEditingOG({
      title: '', min_selections: 0, max_selections: 1,
      allow_repeat: false, is_active: true,
      availability: { tablet: true, delivery: true },
      options: [],
    });
    setOgSheetOpen(true);
  };

  const openEditOG = (og: MenuOptionGroup) => {
    setEditingOG(og);
    setOgSheetOpen(true);
  };

  const openLinkProducts = (og: MenuOptionGroup) => {
    setLinkingOG(og);
    setLinkDialogOpen(true);
  };

  // Stats
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const totalOptions = optionGroups.length;
  const activeProducts = products.filter(p => p.is_active).length;

  return (
    <AppLayout>

      {/* Quick Stats */}
      <div className="px-4 pt-4 grid grid-cols-4 gap-2">
        {[
          { label: 'Categorias', value: totalCategories, color: 'hsl(var(--neon-purple))' },
          { label: 'Produtos', value: totalProducts, color: 'hsl(var(--primary))' },
          { label: 'Ativos', value: activeProducts, color: 'hsl(var(--neon-green))' },
          { label: 'Opcionais', value: totalOptions, color: 'hsl(var(--neon-amber))' },
        ].map(s => (
          <div key={s.label} className="card-base p-3 text-center">
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="tab-command">
          <button
            className={`tab-command-item ${activeTab === 'menu' ? 'tab-command-item-active' : 'tab-command-inactive'}`}
            onClick={() => setActiveTab('menu')}
          >
            <AppIcon name="BookOpen" size={16} />
            <span>Catálogo</span>
          </button>
          <button
            className={`tab-command-item ${activeTab === 'options' ? 'tab-command-item-active' : 'tab-command-inactive'}`}
            onClick={() => setActiveTab('options')}
          >
            <AppIcon name="Settings" size={16} />
            <span>Variações</span>
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'menu' ? (
          <div className="space-y-4">
            {/* Category Tree */}
            <MenuCategoryTree
              categories={categories}
              groups={groups}
              selectedGroupId={selectedGroupId}
              onSelectGroup={setSelectedGroupId}
              onSaveCategory={saveCategory}
              onDeleteCategory={deleteCategory}
              onSaveGroup={saveGroup}
              onDeleteGroup={deleteGroup}
              getProductCount={(gid) => getProductsByGroup(gid).length}
            />

            {/* Group Content */}
            <MenuGroupContent
              group={selectedGroup}
              products={groupProducts}
              getOptionCount={(pid) => getLinkedOptionGroupIds(pid).length}
              onNewProduct={openNewProduct}
              onEditProduct={openEditProduct}
              onDeleteProduct={deleteProduct}
              onLinkOptions={openLinkOptionsForProduct}
              onToggleProductAvailability={(prod, channel) => {
                const avail = (prod.availability as any) || { tablet: true, delivery: true };
                saveProduct({ ...prod, availability: { ...avail, [channel]: !avail[channel] } } as any);
              }}
            />
          </div>
        ) : (
          <OptionGroupList
            optionGroups={optionGroups}
            onNew={openNewOG}
            onEdit={openEditOG}
            onDelete={deleteOptionGroup}
            onLinkProducts={openLinkProducts}
          />
        )}
      </div>

      {/* Product Sheet */}
      <ProductSheet
        open={productSheetOpen}
        onOpenChange={setProductSheetOpen}
        product={editingProduct}
        groups={groups}
        onSave={saveProduct}
        onDelete={deleteProduct}
        onImageUpload={(productId, file) => uploadProductImage(productId, file)}
      />

      {/* Option Group Sheet */}
      <OptionGroupSheet
        open={ogSheetOpen}
        onOpenChange={setOgSheetOpen}
        optionGroup={editingOG}
        onSave={saveOptionGroup}
        onDelete={deleteOptionGroup}
      />

      {/* Link Options Dialog */}
      <LinkOptionsDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        optionGroup={linkingOG}
        categories={categories}
        groups={groups}
        products={products}
        linkedProductIds={linkingOG ? getLinkedProductIds(linkingOG.id) : []}
        onSave={(ogId, pids) => setProductOptionLinks(ogId, pids)}
      />
    </AppLayout>
  );
}
