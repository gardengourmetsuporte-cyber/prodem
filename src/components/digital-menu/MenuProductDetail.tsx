import { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { DMProduct, DMOptionGroup, CartItem } from '@/hooks/useDigitalMenu';
import { cn } from '@/lib/utils';

interface Props {
  product: DMProduct | null;
  optionGroups: DMOptionGroup[];
  open: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

import { formatCurrency as formatPrice } from '@/lib/format';

export function MenuProductDetail({ product, optionGroups, open, onClose, onAddToCart }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [showNotes, setShowNotes] = useState(false);

  // Reset on product change
  useEffect(() => {
    if (open) {
      setQuantity(1);
      setNotes('');
      setSelectedOptions({});
      setShowNotes(false);
    }
  }, [open, product?.id]);

  if (!product) return null;

  const toggleOption = (groupId: string, optionId: string, maxSelections: number) => {
    setSelectedOptions(prev => {
      const current = prev[groupId] || [];
      if (maxSelections === 1) {
        return { ...prev, [groupId]: current.includes(optionId) ? [] : [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter(id => id !== optionId) };
      }
      if (current.length >= maxSelections) {
        return { ...prev, [groupId]: [...current.slice(1), optionId] };
      }
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const selectedOptionsList = Object.entries(selectedOptions).flatMap(([groupId, optionIds]) => {
    const group = optionGroups.find(og => og.id === groupId);
    return optionIds.map(optId => {
      const opt = group?.options.find(o => o.id === optId);
      return opt ? { groupId, optionId: opt.id, name: opt.name, price: opt.price } : null;
    }).filter(Boolean) as CartItem['selectedOptions'];
  });

  const optionsTotal = selectedOptionsList.reduce((s, o) => s + o.price, 0);
  const itemTotal = (product.price + optionsTotal) * quantity;

  const handleAdd = () => {
    onAddToCart({ product, quantity, notes, selectedOptions: selectedOptionsList });
    onClose();
  };

  const isValid = optionGroups.every(og => {
    const selected = (selectedOptions[og.id] || []).length;
    return selected >= og.min_selections;
  });

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92dvh] overflow-hidden p-0 flex flex-col">
        {/* Image */}
        {product.image_url ? (
          <div className="w-full h-56 relative overflow-hidden shrink-0">
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur-xl flex items-center justify-center"
            >
              <AppIcon name="X" size={18} className="text-foreground" />
            </button>
          </div>
        ) : (
          <div className="w-full h-4 shrink-0" />
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-5 pt-3">
            {/* Title + Price */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-bold text-foreground leading-tight">{product.name}</h2>
                {product.is_highlighted && (
                  <span className="shrink-0 px-2 py-1 rounded-lg bg-[hsl(var(--neon-amber)/0.12)] text-[hsl(var(--neon-amber))] text-[10px] font-bold">
                    ⭐ Destaque
                  </span>
                )}
              </div>
              {product.description && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{product.description}</p>
              )}
              <p className="text-lg font-bold text-primary mt-3">{formatPrice(product.price)}</p>
            </div>

            {/* Option groups */}
            {optionGroups.map(og => {
              const isRadio = og.max_selections === 1;
              const selectedCount = (selectedOptions[og.id] || []).length;
              return (
                <div key={og.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground">{og.title}</h3>
                    <div className="flex items-center gap-1.5">
                      {og.min_selections > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-destructive/12 text-destructive text-[10px] font-bold">
                          Obrigatório
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {selectedCount}/{og.max_selections}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {og.options.map(opt => {
                      const isChecked = (selectedOptions[og.id] || []).includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98]',
                            isChecked
                              ? 'bg-primary/8 border border-primary/30'
                              : 'bg-secondary/40 border border-transparent'
                          )}
                        >
                          <div
                            className={cn(
                              'w-5 h-5 flex items-center justify-center shrink-0 transition-colors',
                              isRadio ? 'rounded-full border-2' : 'rounded-md border-2',
                              isChecked
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-muted-foreground/30'
                            )}
                            onClick={(e) => { e.preventDefault(); toggleOption(og.id, opt.id, og.max_selections); }}
                          >
                            {isChecked && <AppIcon name="Check" size={12} />}
                          </div>
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            {opt.image_url && (
                              <img src={opt.image_url} alt={opt.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            )}
                            <span className="text-sm text-foreground">{opt.name}</span>
                          </div>
                          {opt.price > 0 && (
                            <span className="text-xs text-muted-foreground shrink-0">+ {formatPrice(opt.price)}</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Notes toggle */}
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <AppIcon name="MessageSquare" size={16} />
              {showNotes ? 'Ocultar observações' : 'Adicionar observação'}
              <AppIcon name={showNotes ? 'ChevronUp' : 'ChevronDown'} size={14} />
            </button>
            {showNotes && (
              <Textarea
                placeholder="Especificar acabamento, quantidade exata, material, etc."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            )}
          </div>
        </div>

        {/* Fixed bottom action bar */}
        <div className="shrink-0 px-4 py-3 border-t border-border/30 bg-card/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-secondary rounded-xl">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center text-foreground active:scale-90 transition-transform"
              >
                <AppIcon name="Minus" size={18} />
              </button>
              <span className="w-8 text-center font-bold text-foreground text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-11 h-11 flex items-center justify-center text-foreground active:scale-90 transition-transform"
              >
                <AppIcon name="Plus" size={18} />
              </button>
            </div>
            <Button
              className="flex-1 h-12 text-base font-bold rounded-xl"
              onClick={handleAdd}
              disabled={!isValid}
            >
              Adicionar {formatPrice(itemTotal)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
