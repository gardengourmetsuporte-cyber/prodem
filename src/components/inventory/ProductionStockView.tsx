import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { useProductionOrders, ProductionReportItem } from '@/hooks/useProductionOrders';
import { useUnit } from '@/contexts/UnitContext';
import { cn } from '@/lib/utils';
import { InventoryItem } from '@/types/database';

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

/* ── Material card (inventory item in production) ── */
function MaterialCard({ item, onClick }: { item: InventoryItem; onClick: () => void }) {
  const stock = item.production_stock ?? 0;
  const unitLabel = item.unit_type === 'unidade' ? 'un' : item.unit_type === 'kg' ? 'kg' : item.unit_type === 'litro' ? 'L' : item.unit_type === 'metro' ? 'm' : 'm²';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-warning/30 transition-all text-left"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
        <AppIcon name="Package" size={18} className="text-warning" />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate block">{item.name}</span>
        {item.category?.name && (
          <span className="text-[11px] text-muted-foreground">{item.category.name}</span>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-foreground leading-none">{stock}</p>
        <p className="text-[10px] text-muted-foreground">{unitLabel}</p>
      </div>

      <AppIcon name="ArrowRightFromLine" size={16} className="text-muted-foreground flex-shrink-0" />
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
  const { report, totals, isLoading, hasOrder } = useProductionOrders(activeUnitId, new Date());

  const productionItems = items.filter(i => (i.production_stock ?? 0) > 0);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
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
          {/* Summary bar */}
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

          {/* Items list */}
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

      {/* ── Materiais em Produção ── */}
      {hasMaterials && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AppIcon name="Boxes" size={16} className="text-warning" />
            <h3 className="text-sm font-semibold text-foreground">Materiais em Produção</h3>
            <span className="text-xs text-muted-foreground">({productionItems.length})</span>
          </div>

          <div className="space-y-2">
            {productionItems.map(item => (
              <MaterialCard
                key={item.id}
                item={item}
                onClick={() => onItemClick?.(item)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
