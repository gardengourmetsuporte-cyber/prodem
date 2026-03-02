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
import { ProductionProject } from '@/hooks/useProductionProjects';

interface PlanItem {
  checklist_item_id: string;
  name: string;
  target_quantity: number;
  piece_dimensions: string | null;
  material_code: string | null;
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
  onSave: (items: { checklist_item_id: string; quantity_ordered: number }[], notes?: string, projectId?: string) => Promise<any>;
  onPullPendingFromYesterday: () => Promise<{ checklist_item_id: string; quantity_ordered: number }[] | null>;
  hasExistingPlan?: boolean;
  currentShift?: number;
  isShift1Closed?: boolean;
  onCloseShift?: () => void;
  onDeletePlan?: () => void;
  activeProjects?: ProductionProject[];
  selectedProjectId?: string | null;
}

export function ProductionPlanSheet({
  open, onOpenChange, sectors, existingItems, date, onSave, onPullPendingFromYesterday,
  hasExistingPlan, currentShift, isShift1Closed, onCloseShift, onDeletePlan,
  activeProjects = [], selectedProjectId,
}: ProductionPlanSheetProps) {
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsedSectors, setCollapsedSectors] = useState<Set<string>>(new Set(['__init__']));
  const [projectId, setProjectId] = useState<string | undefined>(selectedProjectId || undefined);

  // Sync projectId with the active project whenever the sheet opens
  useEffect(() => {
    if (open) {
      setProjectId(selectedProjectId || undefined);
    }
  }, [open, selectedProjectId]);

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
            material_code: item.material_code || null,
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
          material_code: (ei.checklist_item as any)?.material_code || avail?.material_code || null,
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
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateLabel = format(yesterday, "dd/MM", { locale: ptBR });
    const totalQty = items.reduce((s, i) => s + i.quantity_ordered, 0);
    toast.success(`${items.length} itens pendentes de ${dateLabel} importados (${totalQty} pç)`);
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
        projectId,
      );
      toast.success('Plano salvo!');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseShift = async () => {
    if (!onCloseShift) return;
    if (!confirm('Fechar Turno 1 e criar/atualizar Turno 2 com pendentes?')) return;

    setSaving(true);
    try {
      await onCloseShift();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível fechar o turno');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!onDeletePlan) return;
    if (!confirm('Zerar todo o dia de produção (Turno 1 e Turno 2) para testar novamente?')) return;

    try {
      await onDeletePlan();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível zerar o dia');
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
  const canResetDay = hasExistingPlan && !!onDeletePlan;

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

          {/* Project selector */}
          {activeProjects.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Projeto / OS</label>
              <select
                value={projectId || ''}
                onChange={e => setProjectId(e.target.value || undefined)}
                className="w-full h-9 rounded-lg bg-secondary/60 border border-border px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Sem projeto vinculado</option>
                {activeProjects.map(p => (
                  <option key={p.id} value={p.id}>#{p.project_number} — {p.description}{p.client ? ` (${p.client})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search + quick actions */}
          <div className="space-y-2">
            <div className="relative">
              <AppIcon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar peça..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePullPending}
                className="h-9 flex-1 rounded-lg bg-secondary/60 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                title="Puxar pendências do dia anterior"
              >
                <AppIcon name="History" size={14} />
                <span>Pendências de ontem</span>
              </button>
              <button
                onClick={handleReset}
                className="h-9 px-3 rounded-lg bg-secondary/60 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                title="Zerar quantidades"
              >
                <AppIcon name="RotateCcw" size={14} />
                <span>Zerar qtd.</span>
              </button>
            </div>
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
                                <div className="flex items-center gap-2 flex-wrap">
                                  {item.material_code && (
                                    <span className="text-[10px] font-mono text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded">{item.material_code}</span>
                                  )}
                                  {item.piece_dimensions && (
                                    <span className="text-[10px] text-muted-foreground/60">📐 {item.piece_dimensions}</span>
                                  )}
                                </div>
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
        <div className="px-6 pb-5 pt-3 space-y-2.5 border-t border-border/30 bg-background">
          {/* Notes — compact */}
          <Input
            placeholder="Observações (opcional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="h-9 text-sm"
          />

          {/* Save row */}
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex-1">
              <span className="font-bold text-foreground">{activeCount}</span> itens · <span className="font-bold text-foreground">{totalOrdered}</span> peças
            </p>

            {canCloseShift && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseShift}
                disabled={saving}
                className="gap-1.5 text-xs border-warning/30 text-warning hover:bg-warning/10 hover:text-warning"
              >
                <AppIcon name="ArrowRightToLine" size={14} />
                T1 → T2
              </Button>
            )}

            <Button onClick={handleSave} disabled={saving} size="sm" className="min-w-[90px]">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>

          {/* Danger zone — collapsible */}
          {canResetDay && (
            <button
              onClick={handleDeletePlan}
              className="text-[10px] text-destructive/50 hover:text-destructive transition-colors underline underline-offset-2 mx-auto block"
            >
              Zerar dia (teste)
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
