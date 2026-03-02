import { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { ChecklistSector } from '@/types/database';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProductionOrderItem } from '@/hooks/useProductionOrders';

interface PlanItem {
  checklist_item_id: string;
  name: string;
  target_quantity: number;
  piece_dimensions: string | null;
  quantity_ordered: number;
}

interface ProductionPlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectors: ChecklistSector[];
  existingItems: ProductionOrderItem[];
  date: Date;
  onSave: (items: { checklist_item_id: string; quantity_ordered: number }[], notes?: string) => Promise<any>;
  onCopyFromDate: (sourceDate: string) => Promise<{ checklist_item_id: string; quantity_ordered: number }[] | null>;
}

export function ProductionPlanSheet({
  open, onOpenChange, sectors, existingItems, date, onSave, onCopyFromDate,
}: ProductionPlanSheetProps) {
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Build available items from sectors (only production items with target_quantity > 0)
  const availableItems = useMemo(() => {
    const items: PlanItem[] = [];
    sectors.forEach((sector: any) => {
      if (sector.scope === 'bonus') return;
      sector.subcategories?.forEach(sub => {
        sub.items?.forEach((item: any) => {
          if (!item.is_active || item.deleted_at) return;
          if (item.target_quantity > 0) {
            items.push({
              checklist_item_id: item.id,
              name: item.name,
              target_quantity: item.target_quantity,
              piece_dimensions: item.piece_dimensions || null,
              quantity_ordered: item.target_quantity, // Default to target
            });
          }
        });
      });
    });
    return items;
  }, [sectors]);

  // Initialize from existing items or defaults
  useEffect(() => {
    if (!open) return;
    if (existingItems.length > 0) {
      const mapped = existingItems.map(ei => ({
        checklist_item_id: ei.checklist_item_id,
        name: ei.checklist_item?.name || 'Item',
        target_quantity: ei.checklist_item?.target_quantity || 0,
        piece_dimensions: ei.checklist_item?.piece_dimensions || null,
        quantity_ordered: ei.quantity_ordered,
      }));
      setPlanItems(mapped);
    } else {
      // Start with all available items at their target qty
      setPlanItems(availableItems.map(a => ({ ...a })));
    }
  }, [open, existingItems, availableItems]);

  const updateQty = (itemId: string, qty: number) => {
    setPlanItems(prev => prev.map(p =>
      p.checklist_item_id === itemId ? { ...p, quantity_ordered: Math.max(0, qty) } : p
    ));
  };

  const toggleItem = (itemId: string) => {
    const exists = planItems.find(p => p.checklist_item_id === itemId);
    if (exists) {
      setPlanItems(prev => prev.filter(p => p.checklist_item_id !== itemId));
    } else {
      const avail = availableItems.find(a => a.checklist_item_id === itemId);
      if (avail) setPlanItems(prev => [...prev, { ...avail }]);
    }
  };

  const handleCopyYesterday = async () => {
    const yesterday = format(subDays(date, 1), 'yyyy-MM-dd');
    const items = await onCopyFromDate(yesterday);
    if (!items || items.length === 0) {
      toast.error('Nenhum plano encontrado no dia anterior');
      return;
    }
    // Map copied items with names from availableItems
    const nameMap = new Map(availableItems.map(a => [a.checklist_item_id, a]));
    const mapped = items
      .filter(i => nameMap.has(i.checklist_item_id))
      .map(i => ({
        ...nameMap.get(i.checklist_item_id)!,
        quantity_ordered: i.quantity_ordered,
      }));
    setPlanItems(mapped);
    toast.success('Plano copiado do dia anterior');
  };

  const handleSave = async () => {
    const activeItems = planItems.filter(p => p.quantity_ordered > 0);
    if (activeItems.length === 0) {
      toast.error('Adicione pelo menos um item ao plano');
      return;
    }
    setSaving(true);
    try {
      await onSave(
        activeItems.map(i => ({ checklist_item_id: i.checklist_item_id, quantity_ordered: i.quantity_ordered })),
        notes || undefined,
      );
      toast.success('Plano de produção salvo!');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  };

  const filteredAvailable = search
    ? availableItems.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    : availableItems;

  const selectedIds = new Set(planItems.map(p => p.checklist_item_id));
  const totalOrdered = planItems.reduce((s, p) => s + p.quantity_ordered, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="Factory" size={20} className="text-primary" />
            Plano de Produção — {format(date, "dd/MM", { locale: ptBR })}
          </SheetTitle>
        </SheetHeader>

        {/* Actions */}
        <div className="flex gap-2 mb-3">
          <Button variant="outline" size="sm" onClick={handleCopyYesterday} className="text-xs">
            <AppIcon name="Copy" size={14} />
            Copiar de ontem
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPlanItems(availableItems.map(a => ({ ...a })))}
            className="text-xs"
          >
            <AppIcon name="RotateCcw" size={14} />
            Resetar
          </Button>
        </div>

        {/* Search */}
        <Input
          placeholder="Buscar peça..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-3 h-10"
        />

        {/* Items list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 -mx-2 px-2">
          {filteredAvailable.map(item => {
            const isSelected = selectedIds.has(item.checklist_item_id);
            const planItem = planItems.find(p => p.checklist_item_id === item.checklist_item_id);

            return (
              <div
                key={item.checklist_item_id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all",
                  isSelected ? "bg-primary/5 ring-1 ring-primary/20" : "bg-card/60"
                )}
              >
                <button
                  onClick={() => toggleItem(item.checklist_item_id)}
                  className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                    isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && <AppIcon name="Check" size={14} />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  {item.piece_dimensions && (
                    <p className="text-[10px] text-muted-foreground">{item.piece_dimensions}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">Meta padrão: {item.target_quantity}</p>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.checklist_item_id, (planItem?.quantity_ordered || 0) - 5)}
                      className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                    >
                      <AppIcon name="Minus" size={12} />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={planItem?.quantity_ordered || 0}
                      onChange={e => updateQty(item.checklist_item_id, parseInt(e.target.value) || 0)}
                      className="w-14 h-7 text-center text-sm font-bold rounded-lg bg-background border border-border"
                    />
                    <button
                      onClick={() => updateQty(item.checklist_item_id, (planItem?.quantity_ordered || 0) + 5)}
                      className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                    >
                      <AppIcon name="Plus" size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {filteredAvailable.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma peça com meta encontrada. Configure target_quantity nos itens do checklist.
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="pt-3">
          <Input
            placeholder="Observações do plano (opcional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="h-10"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <div className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{planItems.filter(p => p.quantity_ordered > 0).length}</span> itens · <span className="font-bold text-foreground">{totalOrdered}</span> peças
          </div>
          <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
            {saving ? 'Salvando...' : 'Salvar Plano'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
