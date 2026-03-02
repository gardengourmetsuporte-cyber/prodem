import { useState, useMemo } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { ProductionReportItem } from '@/hooks/useProductionOrders';
import { ChecklistSector } from '@/types/database';
import { ProductionOrderItem } from '@/hooks/useProductionOrders';

interface ProductionCutTableProps {
  report: ProductionReportItem[];
  orderItems: ProductionOrderItem[];
  sectors: ChecklistSector[];
  onStartItem: (itemId: string) => void;
  onFinishItem: (itemId: string) => void;
  onQuickComplete?: (itemId: string, quantity: number) => void;
  onTapItem: (itemId: string) => void;
  isAdmin: boolean;
  isClosed: boolean;
  itemGroupingMap?: Map<string, { groupingNumber: number; quantity: number; material?: string; thickness?: string }>;
}

interface GroupedRow {
  sectorName: string;
  sectorColor: string;
  items: (ProductionReportItem & { materialCode?: string; dimensions?: string })[];
}

export function ProductionCutTable({
  report, orderItems, sectors,
  onStartItem, onFinishItem, onQuickComplete, onTapItem,
  isAdmin, isClosed, itemGroupingMap,
}: ProductionCutTableProps) {
  const [collapsedSectors, setCollapsedSectors] = useState<Set<string>>(new Set());

  const itemMeta = useMemo(() => {
    const meta = new Map<string, { sectorName: string; sectorColor: string; materialCode?: string; dimensions?: string }>();
    sectors.forEach((sector: any) => {
      if (sector.scope === 'bonus') return;
      sector.subcategories?.forEach((sub: any) => {
        sub.items?.forEach((item: any) => {
          meta.set(item.id, {
            sectorName: sector.name,
            sectorColor: sector.color || '#64748b',
            materialCode: item.material_code || undefined,
            dimensions: item.piece_dimensions || undefined,
          });
        });
      });
    });
    return meta;
  }, [sectors]);

  const inProgressIds = useMemo(() => {
    const ids = new Set<string>();
    report.forEach(r => {
      if (r.status === 'in_progress') {
        ids.add(r.checklist_item_id);
      }
    });
    return ids;
  }, [report]);

  const grouped = useMemo(() => {
    const groups: GroupedRow[] = [];
    const sectorMap = new Map<string, GroupedRow>();

    report.forEach(item => {
      const m = itemMeta.get(item.checklist_item_id);
      const sectorName = m?.sectorName || 'Sem setor';
      const sectorColor = m?.sectorColor || '#64748b';

      let group = sectorMap.get(sectorName);
      if (!group) {
        group = { sectorName, sectorColor, items: [] };
        sectorMap.set(sectorName, group);
        groups.push(group);
      }
      group.items.push({
        ...item,
        materialCode: m?.materialCode,
        dimensions: m?.dimensions,
      });
    });

    return groups;
  }, [report, itemMeta]);

  const toggleSector = (name: string) => {
    setCollapsedSectors(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (report.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="w-14 h-14 rounded-xl bg-muted/10 flex items-center justify-center mx-auto industrial-border">
          <AppIcon name="Factory" size={28} className="text-muted-foreground/30" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nenhuma peça no plano</p>
        <p className="text-[10px] text-muted-foreground/60">Crie um plano de produção para este turno</p>
      </div>
    );
  }

  // Totals
  const totalOrdered = report.reduce((s, i) => s + i.quantity_ordered, 0);
  const totalDone = report.reduce((s, i) => s + i.quantity_done, 0);
  const totalInProgress = inProgressIds.size;

  return (
    <div className="space-y-3">
      {/* Table header — industrial style */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <AppIcon name="ClipboardList" size={12} className="text-muted-foreground/50" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
            Tabela de Cortes
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="text-muted-foreground">{report.length} itens</span>
          {totalInProgress > 0 && (
            <span className="text-warning font-bold">{totalInProgress} produzindo</span>
          )}
          <span className={cn(
            "font-bold",
            totalDone >= totalOrdered ? "text-success" : "text-foreground"
          )}>
            {totalDone}/{totalOrdered}
          </span>
        </div>
      </div>

      {grouped.map((group, groupIndex) => {
        const isCollapsed = collapsedSectors.has(group.sectorName);
        const groupDone = group.items.reduce((s, i) => s + i.quantity_done, 0);
        const groupTotal = group.items.reduce((s, i) => s + i.quantity_ordered, 0);
        const groupInProg = group.items.filter(i => inProgressIds.has(i.checklist_item_id)).length;

        return (
          <div key={group.sectorName} className={cn("industrial-card rounded-[20px] overflow-hidden bg-card border-none", groupIndex > 0 && "mt-3")}>
            {/* Sector header — process/machine group */}
            <button
              onClick={() => toggleSector(group.sectorName)}
              className="w-full flex items-center gap-4 px-4 py-4 hover:bg-white/[0.02] transition-colors"
            >
              <div
                className="w-3.5 h-12 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: group.sectorColor }}
              />
              <span className="text-sm font-black text-foreground uppercase tracking-widest flex-1 text-left">
                {group.sectorName}
              </span>
              {groupInProg > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-warning/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                  <span className="text-[10px] font-bold text-warning">{groupInProg}</span>
                </div>
              )}
              <span className="text-[13px] font-mono font-bold text-muted-foreground mr-2">
                {groupDone}/{groupTotal}
              </span>
              <AppIcon
                name="ChevronRight"
                size={16}
                className={cn("text-muted-foreground transition-transform duration-200", !isCollapsed && "rotate-90")}
              />
            </button>

            {/* Items — industrial row format */}
            {!isCollapsed && (
              <div className="border-t border-border/10 bg-background/20">
                {/* Column headers */}
                <div className="grid grid-cols-[80px_1fr_80px_100px] px-4 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 bg-card">
                  <span className="col-span-2 text-left">MINIATURA NOME DA PEÇA</span>
                  <span className="text-right pr-2">TAMANHO</span>
                  <span className="text-right">CONTAGEM</span>
                </div>

                {group.items.map((item, idx) => {
                  const isInProgress = inProgressIds.has(item.checklist_item_id);
                  const isComplete = item.status === 'complete';

                  return (
                    <div
                      key={item.checklist_item_id}
                      className={cn(
                        "grid grid-cols-[70px_1fr_80px_100px] items-center px-4 py-3 transition-all min-h-[70px]",
                        idx < group.items.length - 1 && "border-b border-border/5",
                        isInProgress && "bg-warning/[0.04]",
                        isComplete && "opacity-50",
                      )}
                    >
                      {/* Miniatura */}
                      <button onClick={() => onTapItem(item.checklist_item_id)} className="flex items-center">
                        <div className="w-14 h-11 border border-border/40 rounded-lg flex items-center justify-center bg-card/50 text-muted-foreground/20 hover:border-border transition-colors">
                          <AppIcon name="Minus" size={12} className="opacity-40" />
                        </div>
                      </button>

                      {/* Item info */}
                      <button onClick={() => onTapItem(item.checklist_item_id)} className="text-left flex flex-col justify-center py-2 h-full">
                        <p className={cn(
                          "text-sm font-bold truncate pr-3 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]",
                          isComplete ? "text-muted-foreground/50 line-through" : "text-foreground",
                          isInProgress && "text-warning",
                        )}>
                          {item.item_name}
                        </p>
                      </button>

                      {/* Tamanho */}
                      <div className="text-right pr-4 flex flex-col justify-center h-full border-r border-border/10">
                        {item.dimensions ? (
                          <span className="text-xs font-mono text-muted-foreground/70">{item.dimensions}</span>
                        ) : item.materialCode ? (
                          <span className="text-xs font-mono text-muted-foreground/70">{item.materialCode}</span>
                        ) : (
                          <span className="text-xs font-mono text-muted-foreground/40">-</span>
                        )}
                      </div>

                      {/* Contagem / Action */}
                      <div className="flex justify-end items-center gap-4 pl-3">
                        <span className="text-[17px] font-black text-foreground">
                          {item.quantity_ordered}
                        </span>

                        {isClosed ? (
                          <AppIcon name="Lock" size={18} className="text-muted-foreground/30" />
                        ) : isComplete ? (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-1">
                            <span className="text-[12px] font-black italic text-success font-display">OK</span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isInProgress) {
                                if (onQuickComplete) onQuickComplete(item.checklist_item_id, item.quantity_ordered);
                                else onFinishItem(item.checklist_item_id);
                              } else {
                                onStartItem(item.checklist_item_id);
                              }
                            }}
                            className={cn(
                              "w-10 h-10 shrink-0 rounded-full border-[2.5px] flex items-center justify-center transition-all mr-1",
                              isInProgress
                                ? "border-warning/50 bg-warning/10"
                                : "border-border/30 bg-card hover:bg-success/5 hover:border-success/30"
                            )}
                          >
                            {isInProgress && <div className="w-3.5 h-3.5 rounded-full bg-warning animate-pulse" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
