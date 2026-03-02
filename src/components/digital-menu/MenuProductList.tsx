import { DMCategory, DMGroup, DMProduct } from '@/hooks/useDigitalMenu';
import { AppIcon } from '@/components/ui/app-icon';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Props {
  categories: DMCategory[];
  groups: DMGroup[];
  products: DMProduct[];
  getGroupProducts: (groupId: string) => DMProduct[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  onSelectProduct: (product: DMProduct) => void;
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function MenuProductList({
  categories, groups, products, getGroupProducts,
  selectedCategory, onSelectCategory, onSelectProduct,
}: Props) {
  const visibleGroups = selectedCategory
    ? groups.filter(g => g.category_id === selectedCategory)
    : groups;

  const ungroupedProducts = selectedCategory
    ? products.filter(p => !p.group_id && p.category === categories.find(c => c.id === selectedCategory)?.name)
    : products.filter(p => !p.group_id);

  return (
    <div className="flex flex-col gap-5">
      {/* Category pills */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 px-4 py-1">
          <button
            onClick={() => onSelectCategory(null)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all',
              !selectedCategory
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'bg-card text-muted-foreground border border-border/50 active:scale-95'
            )}
          >
            <AppIcon name="LayoutGrid" size={14} />
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all',
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'bg-card text-muted-foreground border border-border/50 active:scale-95'
              )}
            >
              {cat.icon && <AppIcon name={cat.icon} size={14} />}
              {cat.name}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Grouped products */}
      <div className="px-4 md:px-8 space-y-6 pb-28">
        {visibleGroups.map(group => {
          const groupProducts = getGroupProducts(group.id);
          if (groupProducts.length === 0) return null;
          return (
            <section key={group.id}>
              <div className="mb-3">
                <h2 className="text-base font-bold text-foreground">{group.name}</h2>
                {group.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupProducts.map(product => (
                  <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />
                ))}
              </div>
            </section>
          );
        })}

        {ungroupedProducts.length > 0 && (
          <section>
            {visibleGroups.length > 0 && (
              <h2 className="text-base font-bold text-foreground mb-3">Outros</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ungroupedProducts.map(product => (
                <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />
              ))}
            </div>
          </section>
        )}

        {visibleGroups.length === 0 && ungroupedProducts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <AppIcon name="UtensilsCrossed" size={44} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Nenhum produto disponível</p>
            <p className="text-xs mt-1 opacity-60">Este cardápio ainda não possui itens</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, onSelect }: { product: DMProduct; onSelect: (p: DMProduct) => void }) {
  return (
    <button
      onClick={() => onSelect(product)}
      className="w-full flex items-start gap-3 p-3 rounded-2xl bg-card border border-border/30 hover:border-primary/20 transition-all active:scale-[0.98] text-left group"
    >
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-1.5">
          <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{product.name}</h3>
          {product.is_highlighted && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-[hsl(var(--neon-amber)/0.12)] text-[hsl(var(--neon-amber))] text-[9px] font-bold uppercase tracking-wide">
              Destaque
            </span>
          )}
        </div>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        <p className="text-sm font-bold text-primary mt-2">{formatPrice(product.price)}</p>
      </div>

      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-[88px] h-[88px] rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
          loading="lazy"
        />
      ) : (
        <div className="w-[88px] h-[88px] rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
          <AppIcon name="Image" size={24} className="text-muted-foreground/30" />
        </div>
      )}
    </button>
  );
}
