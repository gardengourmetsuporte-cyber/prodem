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

  const itemMeta = useMemo(() => {
    const meta = new Map<string, { sectorName: string; materialCode?: string; dimensions?: string }>();
    sectors.forEach((sector: any) => {
      if (sector.scope === 'bonus') return;
      sector.subcategories?.forEach((sub: any) => {
        sub.items?.forEach((item: any) => {
          meta.set(item.id, {
            sectorName: sector.name,
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

  const tableData = useMemo(() => {
    return report.map(item => {
      const m = itemMeta.get(item.checklist_item_id);
      return {
        ...item,
        sectorName: m?.sectorName || 'Sem setor',
        materialCode: m?.materialCode || '-',
        dimensions: m?.dimensions || '-',
      };
    });
  }, [report, itemMeta]);

  if (tableData.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="w-14 h-14 rounded-xl bg-muted/10 flex items-center justify-center mx-auto industrial-border">
          <AppIcon name="Factory" size={28} className="text-muted-foreground/30" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nenhuma peça no plano</p>
        <p className="text-[10px] text-muted-foreground/60">Crie a receita com itens para esta OS</p>
      </div>
    );
  }

  // Totals
  const totalOrdered = tableData.reduce((s, i) => s + i.quantity_ordered, 0);
  const totalDone = tableData.reduce((s, i) => s + i.quantity_done, 0);

  return (
    <div className="space-y-4">
      {/* Header — mimic the paper header text */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <AppIcon name="TableProperties" size={16} className="text-muted-foreground/50" />
          <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
            TABELA DE CORTES DE BARRAS
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className={cn(
            "font-bold px-2 py-0.5 rounded-sm",
            totalDone >= totalOrdered ? "bg-success/20 text-success" : "bg-white/5 text-foreground/80"
          )}>
            {totalDone}/{totalOrdered} PCS
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-[12px] border border-border/40 bg-card/60 shadow-sm relative">
        <table className="w-full text-left font-sans whitespace-nowrap border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b border-border/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              <th className="px-4 py-3 border-r border-border/20">Cód. Do Material</th>
              <th className="px-4 py-3 border-r border-border/20 w-full min-w-[200px]">Descrição do Material</th>
              <th className="px-4 py-3 border-r border-border/20">Comp. (mm)</th>
              <th className="px-4 py-3 border-r border-border/20 text-center">Qtd Total</th>
              <th className="px-4 py-3 border-r border-border/20">Processo</th>
              <th className="px-4 py-3 text-center min-w-[80px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20 text-[12px]">
            {tableData.map((row, idx) => {
              const isInProgress = inProgressIds.has(row.checklist_item_id);
              const isComplete = row.status === 'complete';

              return (
                <tr
                  key={row.checklist_item_id}
                  className={cn(
                    "transition-colors hover:bg-white/[0.04]",
                    idx % 2 === 0 ? "bg-card" : "bg-card/40",
                    isComplete && "opacity-40"
                  )}
                  onClick={() => onTapItem(row.checklist_item_id)}
                >
                  <td className="px-4 py-3 border-r border-border/10 font-mono text-muted-foreground/80">{row.materialCode}</td>
                  <td className="px-4 py-3 border-r border-border/10 font-bold text-foreground truncate max-w-[250px]">{row.item_name}</td>
                  <td className="px-4 py-3 border-r border-border/10 font-mono text-foreground/80">{row.dimensions}</td>
                  <td className="px-4 py-3 border-r border-border/10 text-center font-black text-sm text-foreground">
                    {row.quantity_ordered}
                  </td>
                  <td className="px-4 py-3 border-r border-border/10 text-muted-foreground uppercase tracking-widest text-[9px] font-black">
                    {row.sectorName}
                  </td>
                  <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    {isClosed ? (
                      <AppIcon name="Lock" size={14} className="mx-auto text-muted-foreground/30" />
                    ) : isComplete ? (
                      <div className="mx-auto w-16 py-1 rounded bg-success/20 text-success text-[10px] font-black uppercase tracking-widest text-center border border-success/30">
                        OK
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isInProgress) {
                            if (onQuickComplete) onQuickComplete(row.checklist_item_id, row.quantity_ordered);
                            else onFinishItem(row.checklist_item_id);
                          } else {
                            onStartItem(row.checklist_item_id);
                          }
                        }}
                        className={cn(
                          "mx-auto w-16 py-1 rounded text-[10px] font-black uppercase tracking-widest text-center border transition-all cursor-pointer",
                          isInProgress
                            ? "bg-warning/20 text-warning border-warning/30 hover:bg-warning/30"
                            : "bg-background hover:bg-success/10 text-muted-foreground hover:text-success border-border/50 hover:border-success/30"
                        )}
                      >
                        {isInProgress ? 'FECHAR' : 'INICIAR'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
