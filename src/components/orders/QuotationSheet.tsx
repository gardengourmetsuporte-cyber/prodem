import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useInventoryDB } from '@/hooks/useInventoryDB';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useQuotations } from '@/hooks/useQuotations';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuotationSheet({ open, onOpenChange }: Props) {
  const { items } = useInventoryDB();
  const { suppliers } = useSuppliers();
  const { createQuotation } = useQuotations();

  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(q));
  }, [items, search]);

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleItem = (id: string, minStock: number, currentStock: number) => {
    setSelectedItems(prev => {
      if (prev[id] !== undefined) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: Math.max(1, minStock - currentStock) };
    });
  };

  const handleSubmit = async () => {
    if (selectedSuppliers.length < 2) return;
    const itemEntries = Object.entries(selectedItems).filter(([_, qty]) => qty > 0);
    if (itemEntries.length === 0) return;

    setSubmitting(true);
    try {
      await createQuotation({
        title: title || 'Nova Cotação',
        deadline: deadline || undefined,
        supplierIds: selectedSuppliers,
        items: itemEntries.map(([item_id, quantity]) => ({ item_id, quantity })),
      });
      onOpenChange(false);
      setTitle('');
      setDeadline('');
      setSelectedSuppliers([]);
      setSelectedItems({});
    } finally {
      setSubmitting(false);
    }
  };

  const itemCount = Object.keys(selectedItems).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Nova Cotação</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Title & deadline */}
          <div className="space-y-2">
            <Input
              placeholder="Título (ex: Compra Semanal)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="rounded-xl"
            />
            <Input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="rounded-xl"
              placeholder="Prazo"
            />
          </div>

          {/* Suppliers */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Fornecedores (mín. 2)</p>
            <div className="flex flex-wrap gap-2">
              {suppliers.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleSupplier(s.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-sm font-medium border transition-all',
                     selectedSuppliers.includes(s.id)
                       ? 'bg-primary/15 border-primary/30 text-primary'
                       : 'bg-primary/5 text-foreground border-primary/10 hover:border-primary/20'
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Itens ({itemCount} selecionado{itemCount !== 1 ? 's' : ''})
            </p>
            <Input
              placeholder="Buscar item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="rounded-xl mb-2"
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredItems.map(item => {
                const selected = selectedItems[item.id] !== undefined;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-xl transition-colors',
                      selected ? 'bg-primary/5 border border-primary/20' : 'hover:bg-primary/5'
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleItem(item.id, item.min_stock, item.current_stock)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.unit_type}</p>
                    </div>
                    {selected && (
                      <Input
                        type="number"
                        min="1"
                        value={selectedItems[item.id]}
                        onChange={e => setSelectedItems(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                        className="w-20 h-9 text-center rounded-xl"
                        onClick={e => e.stopPropagation()}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || selectedSuppliers.length < 2 || itemCount === 0}
            className="w-full h-12 rounded-xl shadow-lg shadow-primary/20"
          >
            {submitting ? 'Criando...' : `Criar Cotação (${itemCount} itens, ${selectedSuppliers.length} fornecedores)`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
