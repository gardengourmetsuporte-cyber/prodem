import { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { ChecklistSector } from '@/types/database';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProductionOrderItem } from '@/hooks/useProductionOrders';

interface PlanItem {
  checklist_item_id: string;
  name: string;
  target_quantity: number;
  piece_dimensions: string | null;
  quantity_ordered: number;
  sectorName: string;
  sectorColor: string;
  subcategoryName: string;
}

interface GroupedItems {
  sectorName: string;
  sectorColor: string;
  subcategories: {
    name: string;
    items: PlanItem[];
  }[];
}

interface ProductionPlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectors: ChecklistSector[];
  existingItems: ProductionOrderItem[];
  date: Date;
  onSave: (items: { checklist_item_id: string; quantity_ordered: number }[], notes?: string) => Promise<any>;
  onPullPendingFromYesterday: () => Promise<{ checklist_item_id: string; quantity_ordered: number }[] | null>;
  hasExistingPlan?: boolean;
  currentShift?: number;
  isShift1Closed?: boolean;
  onCloseShift?: () => void;
  onDeletePlan?: () => void;
}

export function ProductionPlanSheet({
  open, onOpenChange, sectors, existingItems, date, onSave, onPullPendingFromYesterday,
  hasExistingPlan, currentShift, isShift1Closed, onCloseShift, onDeletePlan,
}: ProductionPlanSheetProps) {
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsedSectors, setCollapsedSectors] = useState<Set<string>>(new Set(['__init__']));
  const [showDangerZone, setShowDangerZone] = useState(false);

  // Build available items from sectors
  const availableItems = useMemo(() => {
    const items: PlanItem[] = [];
    sectors.forEach((sector: any) => {
      if (sector.scope === 'bonus') return;
      sector.subcategories?.forEach(sub => {
        sub.items?.forEach((item: any) => {
          if (!item.is_active || item.deleted_at) return;
          items.push({
            checklist_item_id: item.id,
            name: item.name,
            target_quantity: item.target_quantity || 0,
            piece_dimensions: item.piece_dimensions || null,
            quantity_ordered: 0,
            sectorName: sector.name,
            sectorColor: sector.color || '#64748b',
            subcategoryName: sub.name,
          });
        });
      });
    });
    return items;
  }, [sectors]);

  // Group items by sector > subcategory
  const groupedItems = useMemo(() => {
    const source = search
      ? availableItems.filter(a =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.subcategoryName.toLowerCase().includes(search.toLowerCase()) ||
          a.sectorName.toLowerCase().includes(search.toLowerCase())
        )
      : availableItems;

    const groups: GroupedItems[] = [];
    const sectorMap = new Map<string, GroupedItems>();

    source.forEach(item => {
      let group = sectorMap.get(item.sectorName);
      if (!group) {
        group = { sectorName: item.sectorName, sectorColor: item.sectorColor, subcategories: [] };
        sectorMap.set(item.sectorName, group);
        groups.push(group);
      }
      let sub = group.subcategories.find(s => s.name === item.subcategoryName);
      if (!sub) {
        sub = { name: item.subcategoryName, items: [] };
        group.subcategories.push(sub);
      }
      sub.items.push(item);
    });

    return groups;
  }, [availableItems, search]);

  // Initialize from existing items or defaults
  useEffect(() => {
    if (!open) return;
    setShowDangerZone(false);
    const allSectorNames = new Set(availableItems.map(a => a.sectorName));
    setCollapsedSectors(allSectorNames);

    if (existingItems.length > 0) {
      const nameMap = new Map(availableItems.map(a => [a.checklist_item_id, a]));
      const mapped = existingItems.map(ei => {
        const avail = nameMap.get(ei.checklist_item_id);
        return {
          checklist_item_id: ei.checklist_item_id,
          name: ei.checklist_item?.name || 'Item',
          target_quantity: ei.checklist_item?.target_quantity || 0,
          piece_dimensions: ei.checklist_item?.piece_dimensions || null,
          quantity_ordered: ei.quantity_ordered,
          sectorName: avail?.sectorName || '',
          sectorColor: avail?.sectorColor || '#64748b',
          subcategoryName: avail?.subcategoryName || '',
        };
      });
      setPlanItems(mapped);
    } else {
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

  const toggleSector = (sectorName: string) => {
    setCollapsedSectors(prev => {
      const next = new Set(prev);
      if (next.has(sectorName)) next.delete(sectorName);
      else next.add(sectorName);
      return next;
    });
  };

  const handlePullPending = async () => {
    const items = await onPullPendingFromYesterday();
    if (!items || items.length === 0) {
      toast.info('Nenhum item pendente — tudo concluído! 🎉');
      return;
    }
    const nameMap = new Map(availableItems.map(a => [a.checklist_item_id, a]));
    const currentMap = new Map(planItems.map(p => [p.checklist_item_id, p]));
    const merged = [...planItems];
    items.forEach(i => {
      if (!nameMap.has(i.checklist_item_id)) return;
      const existing = currentMap.get(i.checklist_item_id);
      if (existing) {
        existing.quantity_ordered = existing.quantity_ordered + i.quantity_ordered;
      } else {
        merged.push({ ...nameMap.get(i.checklist_item_id)!, quantity_ordered: i.quantity_ordered });
      }
    });
    setPlanItems([...merged]);
    toast.success(`${items.length} itens pendentes importados`);
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
      toast.success('Plano salvo!');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPlanItems(availableItems.map(a => ({ ...a, quantity_ordered: 0 })));
    setCollapsedSectors(new Set());
    toast.info('Quantidades zeradas');
  };

  const selectedIds = new Set(planItems.map(p => p.checklist_item_id));
  const activeCount = planItems.filter(p => p.quantity_ordered > 0).length;
  const totalOrdered = planItems.reduce((s, p) => s + p.quantity_ordered, 0);

  const canCloseShift = onCloseShift && currentShift === 1 && !isShift1Closed;
  const hasDangerActions = hasExistingPlan && (canCloseShift || onDeletePlan);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl flex flex-col p-0">
        {/* Fixed Header */}
        <div className="px-6 pt-5 pb-3 space-y-3">
          <SheetHeader className="p-0">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AppIcon name="ClipboardList" size={20} className="text-primary" />
                <span>Pedido — {format(date, "dd/MM", { locale: ptBR })}</span>
                {currentShift && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    T{currentShift}
                  </span>
                )}
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Search with inline actions */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <AppIcon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar peça..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
            <button
              onClick={handlePullPending}
              className="h-9 px-3 rounded-lg bg-secondary/60 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 shrink-0"
              title="Puxar pendentes do último turno"
            >
              <AppIcon name="History" size={14} />
              <span className="hidden min-[380px]:inline">Importar</span>
            </button>
            <button
              onClick={handleReset}
              className="h-9 w-9 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center shrink-0"
              title="Zerar quantidades"
            >
              <AppIcon name="RotateCcw" size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable Items */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          {groupedItems.map(group => {
            const isCollapsed = collapsedSectors.has(group.sectorName);
            const sectorQty = group.subcategories.reduce(
              (acc, sub) => acc + sub.items.reduce((a, i) => {
                const p = planItems.find(pi => pi.checklist_item_id === i.checklist_item_id);
                return a + (p?.quantity_ordered || 0);
              }, 0), 0
            );

            return (
              <div key={group.sectorName}>
                <button
                  onClick={() => toggleSector(group.sectorName)}
                  className="w-full flex items-center gap-2.5 py-2.5 px-2 rounded-xl hover:bg-secondary/30 transition-colors"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.sectorColor }}
                  />
                  <span className="text-sm font-bold text-foreground flex-1 text-left">
                    {group.sectorName}
                  </span>
                  {sectorQty > 0 && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                      {sectorQty} pç
                    </span>
                  )}
                  <AppIcon
                    name="ChevronRight"
                    size={14}
                    className={cn("text-muted-foreground transition-transform duration-200", !isCollapsed && "rotate-90")}
                  />
                </button>

                {!isCollapsed && (
                  <div className="pl-2 space-y-0.5 pb-2">
                    {group.subcategories.map(sub => (
                      <div key={sub.name}>
                        {group.subcategories.length > 1 && (
                          <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2 pt-1.5 pb-0.5">
                            {sub.name}
                          </p>
                        )}
                        {sub.items.map(item => {
                          const isSelected = selectedIds.has(item.checklist_item_id);
                          const planItem = planItems.find(p => p.checklist_item_id === item.checklist_item_id);
                          const qty = planItem?.quantity_ordered || 0;

                          return (
                            <div
                              key={item.checklist_item_id}
                              className={cn(
                                "flex items-center gap-2.5 py-2 px-2 rounded-xl transition-all",
                                qty > 0 && "bg-primary/5"
                              )}
                            >
                              <button
                                onClick={() => toggleItem(item.checklist_item_id)}
                                className={cn(
                                  "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                                  isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/25"
                                )}
                              >
                                {isSelected && <AppIcon name="Check" size={11} />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium truncate leading-tight">{item.name}</p>
                                {item.piece_dimensions && (
                                  <p className="text-[10px] text-muted-foreground/60">{item.piece_dimensions}</p>
                                )}
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => updateQty(item.checklist_item_id, qty - 5)}
                                    className="w-7 h-7 rounded-lg bg-secondary/80 flex items-center justify-center active:scale-95"
                                  >
                                    <AppIcon name="Minus" size={11} />
                                  </button>
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    value={qty}
                                    onChange={e => updateQty(item.checklist_item_id, parseInt(e.target.value) || 0)}
                                    className="w-12 h-7 text-center text-sm font-bold rounded-lg bg-background border border-border/60"
                                  />
                                  <button
                                    onClick={() => updateQty(item.checklist_item_id, qty + 5)}
                                    className="w-7 h-7 rounded-lg bg-secondary/80 flex items-center justify-center active:scale-95"
                                  >
                                    <AppIcon name="Plus" size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {groupedItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {search ? 'Nenhum item encontrado.' : 'Nenhum item de produção configurado.'}
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="px-6 pb-5 pt-3 space-y-2 border-t border-border/30 bg-background">
          {/* Notes — compact */}
          <Input
            placeholder="Observações (opcional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="h-9 text-sm"
          />

          {/* Save row */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{activeCount}</span> itens · <span className="font-bold text-foreground">{totalOrdered}</span> peças
            </p>
            <Button onClick={handleSave} disabled={saving} size="sm" className="min-w-[100px]">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>

          {/* Danger actions — collapsible */}
          {hasDangerActions && (
            <div>
              <button
                onClick={() => setShowDangerZone(!showDangerZone)}
                className="w-full text-center text-[11px] text-muted-foreground/50 hover:text-muted-foreground py-1 transition-colors"
              >
                {showDangerZone ? 'Ocultar opções' : 'Mais opções ···'}
              </button>
              {showDangerZone && (
                <div className="space-y-2 pt-1">
                  {canCloseShift && (
                    <button
                      onClick={() => {
                        if (!confirm('Fechar Turno 1 e criar Turno 2 com pendentes?')) return;
                        onCloseShift!();
                        onOpenChange(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-xs font-semibold text-muted-foreground"
                    >
                      <AppIcon name="ArrowRight" size={14} />
                      Fechar Turno 1 → Turno 2
                    </button>
                  )}
                  {onDeletePlan && (
                    <button
                      onClick={() => {
                        if (!confirm('Apagar plano e todos os registros? Não pode ser desfeito.')) return;
                        onDeletePlan();
                        onOpenChange(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-destructive/5 border border-destructive/15 hover:bg-destructive/10 transition-colors text-xs font-semibold text-destructive"
                    >
                      <AppIcon name="Trash2" size={14} />
                      Apagar plano
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
