import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { ProductionReport } from './ProductionReport';
import { ProductionReportItem, ProductionOrder } from '@/hooks/useProductionOrders';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProductionReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ProductionReportItem[];
  totals: { ordered: number; done: number; pending: number; percent: number };
  order: ProductionOrder | null;
  date: Date;
  isAdmin: boolean;
  currentShift: number;
  shift1Report: ProductionReportItem[];
  shift1Totals: { ordered: number; done: number; pending: number; percent: number };
  shift2Report: ProductionReportItem[];
  shift2Totals: { ordered: number; done: number; pending: number; percent: number };
  hasShift2: boolean;
  onEditPlan: () => void;
  onReopenShift?: () => void;
}

export function ProductionReportSheet({
  open, onOpenChange, report, totals, order, date, isAdmin, currentShift,
  shift1Report, shift1Totals, shift2Report, shift2Totals, hasShift2,
  onEditPlan, onReopenShift,
}: ProductionReportSheetProps) {
  const [viewMode, setViewMode] = useState<'current' | 'day'>('current');

  // Day totals combining both shifts
  const dayTotals = {
    ordered: shift1Totals.ordered + shift2Totals.ordered,
    done: shift1Totals.done + shift2Totals.done,
    pending: shift1Totals.pending + shift2Totals.pending,
    percent: (shift1Totals.ordered + shift2Totals.ordered) > 0
      ? Math.round(((shift1Totals.done + shift2Totals.done) / (shift1Totals.ordered + shift2Totals.ordered)) * 100)
      : 0,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="BarChart3" size={20} className="text-primary" />
            Produção — {format(date, "dd/MM/yyyy", { locale: ptBR })}
          </SheetTitle>
        </SheetHeader>

        {/* Tab selector: Turno atual vs Dia completo */}
        {hasShift2 && (
          <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 mb-3">
            <button
              onClick={() => setViewMode('current')}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all",
                viewMode === 'current' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              Turno {currentShift}
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all",
                viewMode === 'day' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              Relatório do Dia
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {viewMode === 'current' ? (
            <ProductionReport report={report} totals={totals} />
          ) : (
            <div className="space-y-6">
              {/* Day summary */}
              <ProductionReport report={[]} totals={dayTotals} label="Resumo do Dia" />

              {/* Shift 1 */}
              {shift1Report.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                    <AppIcon name="Factory" size={16} className="text-primary" />
                    Turno 1
                    <span className="text-[10px] font-normal text-muted-foreground">
                      — {shift1Totals.done}/{shift1Totals.ordered} peças ({shift1Totals.percent}%)
                    </span>
                  </h4>
                  <ProductionReport report={shift1Report} totals={shift1Totals} compact />
                </div>
              )}

              {/* Shift 2 */}
              {shift2Report.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                    <AppIcon name="Factory" size={16} className="text-primary" />
                    Turno 2
                    <span className="text-[10px] font-normal text-muted-foreground">
                      — {shift2Totals.done}/{shift2Totals.ordered} peças ({shift2Totals.percent}%)
                    </span>
                  </h4>
                  <ProductionReport report={shift2Report} totals={shift2Totals} compact />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin actions */}
        {isAdmin && order && (
          <div className="flex gap-2 pt-3 border-t border-border/40">
            {order.status === 'closed' && onReopenShift ? (
              <Button variant="outline" className="flex-1" onClick={() => { onReopenShift(); onOpenChange(false); }}>
                <AppIcon name="RotateCcw" size={14} />
                Reabrir Turno {currentShift}
              </Button>
            ) : order.status !== 'closed' ? (
              <Button variant="outline" className="flex-1" onClick={onEditPlan}>
                <AppIcon name="Pencil" size={14} />
                Editar Plano
              </Button>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
