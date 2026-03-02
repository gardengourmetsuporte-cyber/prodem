import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { useProductionOrders, ProductionReportItem } from '@/hooks/useProductionOrders';
import { useUnit } from '@/contexts/UnitContext';
import { cn } from '@/lib/utils';
import { InventoryItem } from '@/types/database';

/* ── helpers ── */
function getUnitLabel(u: string) {
  switch (u) {
    case 'unidade': return 'un';
    case 'kg': return 'kg';
    case 'litro': return 'L';
    case 'metro': return 'm';
    case 'metro_quadrado': return 'm²';
    default: return u;
  }
}

/* ── Status Badge ── */
function StatusBadge({ status }: { status: ProductionReportItem['status'] }) {
  const config = {
    complete: { label: 'Concluído', cls: 'bg-success/15 text-success border-success/30' },
    partial: { label: 'Parcial', cls: 'bg-warning/15 text-warning border-warning/30' },
    not_started: { label: 'Pendente', cls: 'bg-muted text-muted-foreground border-border' },
  }[status];

  return (
    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', config.cls)}>
      {config.label}
    </span>
  );
}

/* ── Production checklist item ── */
function ProductionItem({ item, onClick }: { item: ProductionReportItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all text-left"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <AppIcon name="Hammer" size={18} className="text-primary" />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground truncate">{item.item_name}</span>
          <StatusBadge status={item.status} />
        </div>

        {item.piece_dimensions && (
          <p className="text-[11px] text-muted-foreground truncate">{item.piece_dimensions}</p>
        )}

        <div className="flex items-center gap-2">
          <Progress value={item.percent} className="h-1.5 flex-1" />
          <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
            {item.quantity_done}/{item.quantity_ordered}
          </span>
        </div>
      </div>

      <AppIcon name="ChevronRight" size={16} className="text-muted-foreground flex-shrink-0" />
    </button>
  );
}

/* ── Props ── */
interface ProductionStockViewProps {
  items?: InventoryItem[];
  onItemClick?: (item: InventoryItem) => void;
}

/* ── Main Component ── */
export function ProductionStockView({ items = [], onItemClick }: ProductionStockViewProps) {
  const navigate = useNavigate();
  const { activeUnitId } = useUnit();
  const { report, totals, isLoading } = useProductionOrders(activeUnitId, new Date());
  const hasOrder = report.length > 0;

  const productionItems = items.filter(i => (i.production_stock ?? 0) > 0);

  // Group by category
  const grouped: Record<string, InventoryItem[]> = {};
  productionItems.forEach(item => {
    const cat = item.category?.name || 'Sem Categoria';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });
  const categoryNames = Object.keys(grouped).sort();

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCat = (name: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const hasProduction = hasOrder && report.length > 0;
  const hasMaterials = productionItems.length > 0;

  if (!hasProduction && !hasMaterials) {
    return (
      <EmptyState
        icon="Factory"
        title="Nenhum pedido de produção hoje"
        subtitle="Crie um plano de produção para ver o progresso das peças aqui."
        actionLabel="Criar plano"
        actionIcon="Plus"
        onAction={() => navigate('/checklists', { state: { openProduction: true } })}
        accent="primary"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Produção (checklist progress) ── */}
      {hasProduction && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Progresso geral</span>
                <span className="text-sm font-bold text-foreground">{totals.percent}%</span>
              </div>
              <Progress value={totals.percent} className="h-2" />
            </div>
            <div className="text-right pl-3 border-l border-border">
              <p className="text-lg font-bold text-foreground leading-none">{totals.done}/{totals.ordered}</p>
              <p className="text-[10px] text-muted-foreground">peças</p>
            </div>
          </div>

          <div className="space-y-2">
            {report.map(item => (
              <ProductionItem
                key={item.checklist_item_id}
                item={item}
                onClick={() => navigate('/checklists')}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Materiais em Produção (grouped by category) ── */}
      {hasMaterials && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AppIcon name="Boxes" size={16} className="text-warning" />
            <h3 className="text-sm font-semibold text-foreground">Materiais em Produção</h3>
            <span className="text-xs text-muted-foreground">({productionItems.length})</span>
          </div>

          {categoryNames.map(catName => {
            const catItems = grouped[catName];
            const isCollapsed = collapsed.has(catName);
            const catColor = catItems[0]?.category?.color || '#6b7280';

            return (
              <div key={catName} className="space-y-1">
                <button
                  onClick={() => toggleCat(catName)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor }} />
                    <span className="text-xs font-semibold text-foreground">{catName}</span>
                    <span className="text-[11px] text-muted-foreground">({catItems.length})</span>
                  </div>
                  <AppIcon
                    name="ChevronDown"
                    size={14}
                    className={cn("text-muted-foreground transition-transform duration-200", !isCollapsed && "rotate-180")}
                  />
                </button>

                <div className={cn(
                  "overflow-hidden transition-all duration-300 ease-out",
                  isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
                )}>
                  <div className="space-y-1 pl-2">
                    {catItems.map(item => {
                      const stock = item.production_stock ?? 0;
                      return (
                        <button
                          key={item.id}
                          onClick={() => onItemClick?.(item)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-card/50 border border-border/50 hover:border-warning/30 transition-all text-left"
                        >
                          <span className="text-sm text-foreground truncate flex-1">{item.name}</span>
                          <span className="text-sm font-bold text-foreground whitespace-nowrap">
                            {stock.toFixed(item.unit_type === 'unidade' ? 0 : 2)}
                            <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{getUnitLabel(item.unit_type)}</span>
                          </span>
                          <AppIcon name="ArrowRightFromLine" size={14} className="text-muted-foreground/50 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
