import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { ProductionReport } from './ProductionReport';
import { ProductionReportItem, ProductionOrder } from '@/hooks/useProductionOrders';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProductionReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ProductionReportItem[];
  totals: { ordered: number; done: number; pending: number; percent: number };
  order: ProductionOrder | null;
  date: Date;
  isAdmin: boolean;
  onEditPlan: () => void;
  onClosePlan: () => void;
}

export function ProductionReportSheet({
  open, onOpenChange, report, totals, order, date, isAdmin, onEditPlan, onClosePlan,
}: ProductionReportSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="BarChart3" size={20} className="text-primary" />
            Produção — {format(date, "dd/MM/yyyy", { locale: ptBR })}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          <ProductionReport report={report} totals={totals} />
        </div>

        {/* Admin actions */}
        {isAdmin && order && order.status !== 'closed' && (
          <div className="flex gap-2 pt-3 border-t border-border/40">
            <Button variant="outline" className="flex-1" onClick={onEditPlan}>
              <AppIcon name="Pencil" size={14} />
              Editar Plano
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onClosePlan}>
              <AppIcon name="Lock" size={14} />
              Fechar Dia
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
