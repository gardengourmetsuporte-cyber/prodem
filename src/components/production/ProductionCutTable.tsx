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
  onStartItem, onFinishItem, onTapItem,
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

      {grouped.map(group => {
        const isCollapsed = collapsedSectors.has(group.sectorName);
        const groupDone = group.items.reduce((s, i) => s + i.quantity_done, 0);
        const groupTotal = group.items.reduce((s, i) => s + i.quantity_ordered, 0);
        const groupInProg = group.items.filter(i => inProgressIds.has(i.checklist_item_id)).length;

        return (
          <div key={group.sectorName} className="industrial-card rounded-xl overflow-hidden">
            {/* Sector header — process/machine group */}
            <button
              onClick={() => toggleSector(group.sectorName)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.02] transition-colors"
            >
              <div
                className="w-3 h-8 rounded-sm shrink-0"
                style={{ backgroundColor: group.sectorColor }}
              />
              <span className="text-[11px] font-black text-foreground uppercase tracking-wider flex-1 text-left">
                {group.sectorName}
              </span>
              {groupInProg > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-warning/10">
                  <div className="w-1 h-1 rounded-full bg-warning animate-pulse" />
                  <span className="text-[8px] font-bold text-warning">{groupInProg}</span>
                </div>
              )}
              <span className={cn(
                "text-[10px] font-mono font-bold px-2 py-0.5 rounded",
                groupDone >= groupTotal ? "bg-success/10 text-success" : "text-muted-foreground"
              )}>
                {groupDone}/{groupTotal}
              </span>
              <AppIcon
                name="ChevronRight"
                size={14}
                className={cn("text-muted-foreground/40 transition-transform", !isCollapsed && "rotate-90")}
              />
            </button>

            {/* Items — industrial row format */}
            {!isCollapsed && (
              <div className="border-t border-border/10">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_48px_48px_40px] px-3 py-1 text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 bg-background/30">
                  <span className="pl-1">PEÇA / CÓD</span>
                  <span className="text-center">PED</span>
                  <span className="text-center">FEITO</span>
                  <span className="text-center">AÇÃo</span>
                </div>

                {group.items.map((item, idx) => {
                  const isInProgress = inProgressIds.has(item.checklist_item_id);
                  const isComplete = item.status === 'complete';

                  return (
                    <div
                      key={item.checklist_item_id}
                      className={cn(
                        "grid grid-cols-[1fr_48px_48px_40px] items-center px-3 py-2.5 transition-all",
                        idx < group.items.length - 1 && "border-b border-border/5",
                        isInProgress && "bg-warning/[0.06] border-l-2 border-l-warning",
                        isComplete && "opacity-50",
                      )}
                    >
                      {/* Item info */}
                      <button onClick={() => onTapItem(item.checklist_item_id)} className="text-left min-w-0 pl-1">
                        <p className={cn(
                          "text-[12px] font-bold leading-tight truncate",
                          isComplete && "line-through text-muted-foreground/40",
                          isInProgress && "text-warning font-black",
                        )}>
                          {item.item_name}
                        </p>
                        {item.materialCode && (
                          <span className="text-[8px] font-mono text-muted-foreground/60">
                            {item.materialCode}
                            {item.dimensions && ` · ${item.dimensions}`}
                          </span>
                        )}
                        {itemGroupingMap?.has(item.checklist_item_id) && (
                          <span className="inline-flex items-center gap-0.5 text-[7px] font-black text-warning bg-warning/10 px-1.5 py-0.5 rounded mt-0.5">
                            AG{itemGroupingMap.get(item.checklist_item_id)!.groupingNumber}
                            <span className="text-muted-foreground font-normal ml-0.5">
                              ×{itemGroupingMap.get(item.checklist_item_id)!.quantity}
                            </span>
                          </span>
                        )}
                      </button>

                      {/* Qty ordered */}
                      <span className="text-center text-[11px] font-mono font-bold text-foreground/60">
                        {item.quantity_ordered}
                      </span>

                      {/* Qty done */}
                      <span className={cn(
                        "text-center text-[11px] font-mono font-black",
                        isComplete ? "text-success" : item.quantity_done > 0 ? "text-warning" : "text-muted-foreground/30"
                      )}>
                        {item.quantity_done}
                      </span>

                      {/* Action */}
                      <div className="flex justify-center">
                        {isClosed ? (
                          <AppIcon name="Lock" size={12} className="text-muted-foreground/20" />
                        ) : isComplete ? (
                          <AppIcon name="CheckCircle" size={16} className="text-success" />
                        ) : isInProgress ? (
                          <button
                            onClick={() => onFinishItem(item.checklist_item_id)}
                            className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center active:scale-90 transition-transform ring-1 ring-warning/30"
                          >
                            <AppIcon name="Square" size={12} className="text-warning" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onStartItem(item.checklist_item_id)}
                            className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center active:scale-90 transition-transform hover:bg-success/20 ring-1 ring-success/20"
                          >
                            <AppIcon name="Play" size={12} className="text-success" />
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
