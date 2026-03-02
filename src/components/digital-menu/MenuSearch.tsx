import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { DMProduct } from '@/hooks/useDigitalMenu';

interface Props {
  products: DMProduct[];
  onSelectProduct: (product: DMProduct) => void;
}

import { formatCurrency as formatPrice } from '@/lib/format';

export function MenuSearch({ products, onSelectProduct }: Props) {
  const [query, setQuery] = useState('');

  const highlighted = useMemo(() => products.filter(p => p.is_highlighted).slice(0, 6), [products]);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [query, products]);

  const showResults = query.trim().length > 0;

  return (
    <div className="px-4 pb-28 space-y-4">
      <div className="relative">
        <AppIcon name="Search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar peça ou produto..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-10 h-12 rounded-xl text-sm"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <AppIcon name="X" size={16} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Popular items when no query */}
      {!showResults && highlighted.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
            <AppIcon name="TrendingUp" size={14} className="text-primary" />
            Destaques
          </h3>
          <div className="space-y-2">
            {highlighted.map(product => (
              <SearchResultCard key={product.id} product={product} onSelect={onSelectProduct} />
            ))}
          </div>
        </div>
      )}

      {showResults && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <AppIcon name="SearchX" size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Nenhum produto encontrado</p>
          <p className="text-xs mt-1 opacity-60">Tente outro termo de busca</p>
        </div>
      )}

      {showResults && filtered.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{filtered.length} resultado(s)</p>
          {filtered.map(product => (
            <SearchResultCard key={product.id} product={product} onSelect={onSelectProduct} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ product, onSelect }: { product: DMProduct; onSelect: (p: DMProduct) => void }) {
  return (
    <button
      onClick={() => onSelect(product)}
      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/30 hover:border-primary/20 transition-all active:scale-[0.98] text-left"
    >
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover shrink-0" loading="lazy" />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
          <AppIcon name="Image" size={20} className="text-muted-foreground/30" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-sm truncate">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{product.description}</p>
        )}
        <p className="text-sm font-bold text-primary mt-1">{formatPrice(product.price)}</p>
      </div>
    </button>
  );
}
