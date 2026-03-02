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
  completions: any[];
  onStartItem: (itemId: string) => void;
  onFinishItem: (itemId: string) => void;
  onTapItem: (itemId: string) => void;
  isAdmin: boolean;
  isClosed: boolean;
}

interface GroupedRow {
  sectorName: string;
  sectorColor: string;
  items: (ProductionReportItem & { materialCode?: string; dimensions?: string })[];
}

export function ProductionCutTable({
  report, orderItems, sectors, completions,
  onStartItem, onFinishItem, onTapItem,
  isAdmin, isClosed,
}: ProductionCutTableProps) {
  const [collapsedSectors, setCollapsedSectors] = useState<Set<string>>(new Set());

  // Build a map of item metadata
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

  // In-progress items (started but not finished)
  const inProgressIds = useMemo(() => {
    const ids = new Set<string>();
    completions.forEach((c: any) => {
      if (c.started_at && !c.finished_at && c.status === 'in_progress') {
        ids.add(c.item_id);
      }
    });
    return ids;
  }, [completions]);

  // Group report items by sector (process)
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
      <div className="text-center py-10 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto">
          <AppIcon name="Factory" size={28} className="text-muted-foreground/50" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">Nenhuma peça no plano</p>
        <p className="text-xs text-muted-foreground/70">Crie um plano de produção para este turno</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {grouped.map(group => {
        const isCollapsed = collapsedSectors.has(group.sectorName);
        const groupDone = group.items.reduce((s, i) => s + i.quantity_done, 0);
        const groupTotal = group.items.reduce((s, i) => s + i.quantity_ordered, 0);
        const groupPercent = groupTotal > 0 ? Math.round((groupDone / groupTotal) * 100) : 0;

        return (
          <div key={group.sectorName} className="rounded-xl overflow-hidden ring-1 ring-border/30 bg-card/50">
            {/* Sector header */}
            <button
              onClick={() => toggleSector(group.sectorName)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.sectorColor }} />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider flex-1 text-left">
                {group.sectorName}
              </span>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                groupPercent >= 100 ? "bg-success/15 text-success" : "bg-muted/40 text-muted-foreground"
              )}>
                {groupDone}/{groupTotal}
              </span>
              <AppIcon
                name="ChevronRight"
                size={14}
                className={cn("text-muted-foreground transition-transform", !isCollapsed && "rotate-90")}
              />
            </button>

            {/* Items table */}
            {!isCollapsed && (
              <div className="border-t border-border/20">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_60px_60px_44px] px-3 py-1.5 bg-muted/10 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  <span>Peça</span>
                  <span className="text-center">Qtd</span>
                  <span className="text-center">Feito</span>
                  <span className="text-center">Ação</span>
                </div>

                {/* Rows */}
                {group.items.map((item, idx) => {
                  const isInProgress = inProgressIds.has(item.checklist_item_id);
                  const isComplete = item.status === 'complete';
                  const isPartial = item.status === 'partial';

                  return (
                    <div
                      key={item.checklist_item_id}
                      className={cn(
                        "grid grid-cols-[1fr_60px_60px_44px] items-center px-3 py-2.5 transition-all",
                        idx < group.items.length - 1 && "border-b border-border/10",
                        isInProgress && "production-highlight-amber",
                        isComplete && "production-strikethrough",
                      )}
                    >
                      {/* Item info */}
                      <button onClick={() => onTapItem(item.checklist_item_id)} className="text-left min-w-0">
                        <p className={cn(
                          "text-[13px] font-medium leading-tight truncate",
                          isComplete && "line-through text-muted-foreground/60",
                          isInProgress && "text-warning font-semibold",
                        )}>
                          {item.item_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.materialCode && (
                            <span className="text-[9px] font-mono text-primary/70 bg-primary/5 px-1 py-0.5 rounded">
                              {item.materialCode}
                            </span>
                          )}
                          {item.dimensions && (
                            <span className="text-[9px] text-muted-foreground/50">
                              {item.dimensions}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Qty ordered */}
                      <span className="text-center text-xs font-bold text-foreground/80">
                        {item.quantity_ordered}
                      </span>

                      {/* Qty done */}
                      <span className={cn(
                        "text-center text-xs font-black",
                        isComplete ? "text-success" : isPartial ? "text-warning" : "text-muted-foreground/50"
                      )}>
                        {item.quantity_done}
                      </span>

                      {/* Action button */}
                      <div className="flex justify-center">
                        {isClosed ? (
                          <AppIcon name="Lock" size={14} className="text-muted-foreground/30" />
                        ) : isComplete ? (
                          <AppIcon name="check_circle" size={18} fill={1} className="text-success" />
                        ) : isInProgress ? (
                          <button
                            onClick={() => onFinishItem(item.checklist_item_id)}
                            className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center active:scale-95 transition-transform"
                          >
                            <AppIcon name="Square" size={14} className="text-warning" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onStartItem(item.checklist_item_id)}
                            className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center active:scale-95 transition-transform hover:bg-primary/20"
                          >
                            <AppIcon name="Play" size={14} className="text-primary" />
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
