import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useQuotations, Quotation } from '@/hooks/useQuotations';
import { QuotationSheet } from './QuotationSheet';
import { QuotationDetail } from './QuotationDetail';
import { AppIcon } from '@/components/ui/app-icon';

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  draft: { label: 'Rascunho', bg: 'bg-muted', text: 'text-muted-foreground', icon: 'Clock' },
  sent: { label: 'Aguardando', bg: 'bg-warning/10', text: 'text-warning', icon: 'Clock' },
  comparing: { label: 'Comparando', bg: 'bg-primary/10', text: 'text-primary', icon: 'ArrowLeftRight' },
  contested: { label: 'Contestada', bg: 'bg-orange-500/10', text: 'text-orange-500', icon: 'AlertTriangle' },
  resolved: { label: 'Resolvida', bg: 'bg-success/10', text: 'text-success', icon: 'CheckCircle2' },
};

export function QuotationList() {
  const { quotations, isLoading, deleteQuotation } = useQuotations();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  if (selectedQuotation) {
    return (
      <QuotationDetail
        quotation={selectedQuotation}
        onBack={() => { setSelectedQuotation(null); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setSheetOpen(true)} className="w-full gap-2 rounded-xl h-12 shadow-lg shadow-primary/20">
        <AppIcon name="Plus" className="w-4 h-4" />
        Nova Cotação
      </Button>

      {quotations.length === 0 ? (
        <EmptyState
          icon="Scale"
          title="Nenhuma cotação"
          subtitle="Crie uma cotação para comparar preços entre fornecedores"
        />
      ) : (
        <div className="space-y-3">
          {quotations.map((q, i) => {
            const status = statusConfig[q.status] || statusConfig.draft;
            const responded = q.quotation_suppliers?.filter(s => s.status === 'responded').length || 0;
            const total = q.quotation_suppliers?.length || 0;
            const itemCount = q.quotation_items?.length || 0;

            return (
              <div
                key={q.id}
                onClick={() => setSelectedQuotation(q)}
                className="bg-card rounded-2xl border border-border/30 p-4 cursor-pointer transition-all hover:border-primary/25 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                     <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                       <AppIcon name="Scale" className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {q.title || `Cotação #${q.id.slice(0, 6)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {itemCount} ite{itemCount !== 1 ? 'ns' : 'm'} · {responded}/{total} responderam
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('px-2.5 py-1 text-xs font-semibold rounded-full', status.bg, status.text)}>
                      {status.label}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteQuotation(q.id); }}
                    >
                      <AppIcon name="Trash2" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Supplier chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {q.quotation_suppliers?.map(qs => (
                    <span
                      key={qs.id}
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        qs.status === 'responded' ? 'bg-success/10 text-success' :
                        qs.status === 'contested' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-muted text-muted-foreground'
                      )}
                    >
                      {qs.supplier?.name} {qs.status === 'responded' ? '✅' : qs.status === 'contested' ? '⚠️' : '⏳'}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <QuotationSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
