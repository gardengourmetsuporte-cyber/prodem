import { InventoryItem } from '@/types/database';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';

interface ItemCardProps {
  item: InventoryItem;
  onClick: () => void;
  onEdit?: () => void;
}

function getUnitLabel(unitType: string): string {
  switch (unitType) {
    case 'unidade': return 'un';
    case 'kg': return 'kg';
    case 'litro': return 'L';
    case 'metro': return 'm';
    case 'metro_quadrado': return 'm²';
    default: return unitType;
  }
}

function getStockStatus(item: InventoryItem): 'ok' | 'low' | 'out' {
  if (item.current_stock === 0) return 'out';
  if (item.current_stock < item.min_stock) return 'low';
  return 'ok';
}

export function ItemCard({ item, onClick, onEdit }: ItemCardProps) {
  const status = getStockStatus(item);
  const unitLabel = getUnitLabel(item.unit_type);
  const categoryColor = item.category?.color || '#6b7280';
  const warehouseStock = (item as any).warehouse_stock ?? item.current_stock;
  const productionStock = (item as any).production_stock ?? 0;

  return (
    <div
      onClick={onClick}
      className="card-surface p-3.5 cursor-pointer hover:shadow-glow-primary hover:border-white/10 active:scale-[0.98] transition-all duration-300 relative overflow-hidden group"
    >
      {/* Subtle background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-center gap-3 relative z-10">
        {/* Icon with category color */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner"
          style={{ backgroundColor: `${categoryColor}15` }}
        >
          <AppIcon name="Package" size={18} style={{ color: categoryColor, filter: `drop-shadow(0 0 6px ${categoryColor}80)` }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">{item.name}</h3>
          {(item as any).internal_code && (
            <p className="text-[10px] font-mono text-primary/70 truncate">{(item as any).internal_code}</p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryColor }} />
            <p className="text-xs text-muted-foreground truncate">
              {[
                item.category?.name,
                (item as any).material_type,
                (item as any).dimensions,
              ].filter(Boolean).join(' · ') || 'Sem categoria'}
            </p>
          </div>
          {/* Dual stock display */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <AppIcon name="Warehouse" size={10} className="opacity-60" />
              {warehouseStock.toFixed(item.unit_type === 'unidade' ? 0 : 2)}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <AppIcon name="Factory" size={10} className="opacity-60" />
              {productionStock.toFixed(item.unit_type === 'unidade' ? 0 : 2)}
            </span>
          </div>
        </div>

        {/* Stock value + badge */}
        <div className="text-right shrink-0 flex items-center gap-2">
          <div>
            <p className={cn(
              "text-base font-bold leading-tight drop-shadow-md",
              status === 'ok' && "text-foreground",
              status === 'low' && "text-warning drop-shadow-[0_0_8px_hsl(var(--warning)/0.4)]",
              status === 'out' && "text-destructive drop-shadow-[0_0_8px_hsl(var(--destructive)/0.4)]"
            )}>
              {item.current_stock.toFixed(item.unit_type === 'unidade' ? 0 : 2)}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">{unitLabel}</span>
            </p>
            <span className={cn(
              "text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded inline-block mt-0.5 shadow-sm border",
              status === 'ok' && "bg-success/10 border-success/20 text-success",
              status === 'low' && "bg-warning/10 border-warning/20 text-warning",
              status === 'out' && "bg-destructive/10 border-destructive/20 text-destructive"
            )}>
              {status === 'ok' ? 'OK' : status === 'low' ? 'BAIXO' : 'ZERADO'}
            </span>
          </div>

          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <AppIcon name="Edit" size={14} />
            </button>
          )}

          <AppIcon name="ChevronRight" size={16} className="text-muted-foreground/50 shrink-0" />
        </div>
      </div>
    </div>
  );
}
