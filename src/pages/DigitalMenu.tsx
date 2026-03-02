import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDigitalMenu, DMProduct } from '@/hooks/useDigitalMenu';
import { MenuLanding } from '@/components/digital-menu/MenuLanding';
import { MenuBottomNav, MenuTab } from '@/components/digital-menu/MenuBottomNav';
import { MenuProductList } from '@/components/digital-menu/MenuProductList';
import { MenuProductDetail } from '@/components/digital-menu/MenuProductDetail';
import { MenuCart } from '@/components/digital-menu/MenuCart';
import { MenuSearch } from '@/components/digital-menu/MenuSearch';
import { AppIcon } from '@/components/ui/app-icon';

export default function DigitalMenu() {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();
  const mesa = searchParams.get('mesa');
  const initialTab = (searchParams.get('tab') as MenuTab) || 'home';

  const {
    unit, categories, groups, products, loading,
    getProductOptionGroups, getGroupProducts,
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartCount,
  } = useDigitalMenu(unitId);

  const [activeTab, setActiveTab] = useState<MenuTab>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DMProduct | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleProductSelect = (product: DMProduct) => {
    setSelectedProduct(product);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border/40 shadow-lg flex items-center justify-center animate-pulse">
          <AppIcon name="Package" size={28} className="text-primary" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold text-foreground">Carregando catálogo...</p>
          <div className="flex gap-1 mt-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  const unitInitials = unit?.name
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="min-h-[100dvh] bg-background max-w-4xl mx-auto relative">
      {/* Home tab */}
      {activeTab === 'home' && (
        <div>
          <MenuLanding unit={unit} unitInitials={unitInitials} />

          <div className="px-4 md:px-8 mt-5">
            <button
              onClick={() => { setSearchOpen(true); setActiveTab('menu'); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border border-border/40 text-muted-foreground text-sm"
            >
              <AppIcon name="Search" size={16} />
              Buscar peça ou produto...
            </button>
          </div>

          {products.filter(p => p.is_highlighted).length > 0 && (
            <div className="mt-6 px-4 md:px-8">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                <AppIcon name="Star" size={14} className="text-primary" />
                Produtos em Destaque
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {products.filter(p => p.is_highlighted).slice(0, 8).map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="shrink-0 w-36 rounded-2xl bg-card border border-border/30 overflow-hidden active:scale-[0.97] transition-transform text-left"
                  >
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-24 object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-24 bg-secondary/50 flex items-center justify-center">
                        <AppIcon name="Image" size={24} className="text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-foreground truncate">{product.name}</p>
                      <p className="text-xs font-bold text-primary mt-1">
                        {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <div className="mt-6 px-4 md:px-8 pb-28">
              <h3 className="text-sm font-bold text-foreground mb-3">Categorias</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setActiveTab('menu'); }}
                    className="flex items-center gap-2.5 p-3.5 rounded-xl bg-card border border-border/30 active:scale-[0.97] transition-transform text-left"
                  >
                    {cat.icon && <AppIcon name={cat.icon} size={20} className="text-muted-foreground" />}
                    <span className="text-sm font-semibold text-foreground truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Catalog tab */}
      {activeTab === 'menu' && (
        <div className="pt-4">
          {searchOpen ? (
            <div className="px-4 md:px-8 mb-4">
              <MenuSearch products={products} onSelectProduct={handleProductSelect} />
            </div>
          ) : (
            <>
              <div className="px-4 md:px-8 mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Catálogo</h2>
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 rounded-xl bg-card border border-border/40 flex items-center justify-center"
                >
                  <AppIcon name="Search" size={16} className="text-muted-foreground" />
                </button>
              </div>
              <MenuProductList
                categories={categories}
                groups={groups}
                products={products}
                getGroupProducts={getGroupProducts}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onSelectProduct={handleProductSelect}
              />
            </>
          )}
        </div>
      )}

      {/* Quotation tab */}
      {activeTab === 'cart' && unitId && (
        <div className="pt-4">
          <MenuCart
            cart={cart}
            cartTotal={cartTotal}
            unitId={unitId}
            mesa={mesa}
            onUpdateQuantity={updateCartQuantity}
            onRemove={removeFromCart}
            onClear={clearCart}
          />
        </div>
      )}

      {/* Product detail sheet */}
      <MenuProductDetail
        product={selectedProduct}
        optionGroups={selectedProduct ? getProductOptionGroups(selectedProduct.id) : []}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      <MenuBottomNav active={activeTab} onTabChange={(tab) => { setActiveTab(tab); setSearchOpen(false); }} cartCount={cartCount} />
    </div>
  );
}
