import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuotations, Quotation, QuotationPrice } from '@/hooks/useQuotations';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';

interface Props {
  quotation: Quotation;
  onBack: () => void;
}

export function QuotationDetail({ quotation: initialQ, onBack }: Props) {
  const { quotations, contestSupplier, resolveQuotation, fetchPrices, invalidate } = useQuotations();
  const quotation = quotations.find(q => q.id === initialQ.id) || initialQ;

  const [prices, setPrices] = useState<QuotationPrice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPrices = async () => {
    try {
      const p = await fetchPrices(quotation.id);
      setPrices(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();

    // Subscribe to realtime price updates
    const channel = supabase
      .channel(`quotation-prices-${quotation.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotation_prices' }, () => {
        loadPrices();
        invalidate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotation_suppliers' }, () => {
        invalidate();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [quotation.id]);

  const suppliers = quotation.quotation_suppliers || [];
  const items = quotation.quotation_items || [];

  // Build comparison matrix
  const comparison = useMemo(() => {
    return items.map(item => {
      const supplierPrices = suppliers.map(qs => {
        const itemPrices = prices
          .filter(p => p.quotation_item_id === item.id && p.quotation_supplier_id === qs.id)
          .sort((a, b) => b.round - a.round);
        return {
          supplier: qs,
          price: itemPrices[0] || null,
        };
      });

      const respondedPrices = supplierPrices.filter(sp => sp.price);
      const minPrice = respondedPrices.length > 0
        ? Math.min(...respondedPrices.map(sp => sp.price!.unit_price))
        : null;

      return {
        item,
        supplierPrices,
        minPrice,
      };
    });
  }, [items, suppliers, prices]);

  // Calculate economy
  const economy = useMemo(() => {
    let savings = 0;
    comparison.forEach(row => {
      const respondedPrices = row.supplierPrices.filter(sp => sp.price).map(sp => sp.price!.unit_price);
      if (respondedPrices.length >= 2) {
        const max = Math.max(...respondedPrices);
        const min = Math.min(...respondedPrices);
        savings += (max - min) * row.item.quantity;
      }
    });
    return savings;
  }, [comparison]);

  const getPublicUrl = (token: string) => {
    const base = window.location.origin;
    return `${base}/cotacao/${token}`;
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getPublicUrl(token));
    toast.success('Link copiado!');
  };

  const sendWhatsApp = (qs: any) => {
    const phone = qs.supplier?.phone;
    if (!phone) { toast.error('Sem telefone cadastrado'); return; }
    const cleaned = phone.replace(/\D/g, '');
    const formatted = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    const itemCount = items.length;
    const deadlineStr = quotation.deadline
      ? new Date(quotation.deadline).toLocaleDateString('pt-BR')
      : '';
    const msg = `Olá! Temos uma cotação de preços para você:\n\n📋 ${itemCount} itens para cotar${deadlineStr ? `\n⏰ Prazo: ${deadlineStr}` : ''}\n\nAcesse e preencha seus preços:\n${getPublicUrl(qs.token)}\n\nObrigado!`;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleContest = async (supplierId: string) => {
    await contestSupplier({ quotationId: quotation.id, supplierId });
    loadPrices();
  };

  const handleResolve = async () => {
    await resolveQuotation(quotation.id);
  };

  const allResponded = suppliers.every(s => s.status === 'responded');
  const canResolve = allResponded && prices.length > 0 && quotation.status !== 'resolved';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
          <AppIcon name="ArrowLeft" className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg truncate">{quotation.title || 'Cotação'}</h2>
          <p className="text-xs text-muted-foreground">
            {items.length} itens · {suppliers.length} fornecedores
          </p>
        </div>
      </div>

      {/* Supplier links */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Links dos Fornecedores</p>
        {suppliers.map(qs => (
          <div key={qs.id} className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border/30">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{qs.supplier?.name}</p>
              <p className={cn(
                'text-xs',
                qs.status === 'responded' ? 'text-success' :
                qs.status === 'contested' ? 'text-orange-500' :
                'text-muted-foreground'
              )}>
                {qs.status === 'responded' ? '✅ Respondeu' :
                 qs.status === 'contested' ? '⚠️ Contestado' :
                 '⏳ Aguardando'}
              </p>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl gap-1" onClick={() => copyLink(qs.token)}>
              <AppIcon name="Copy" className="w-3.5 h-3.5" />
            </Button>
            {qs.supplier?.phone && (
              <Button size="sm" className="rounded-xl gap-1 bg-[hsl(142,70%,35%)] hover:bg-[hsl(142,70%,30%)]" onClick={() => sendWhatsApp(qs)}>
                <AppIcon name="MessageCircle" className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      {prices.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AppIcon name="Scale" className="w-4 h-4" />
            Comparação de Preços
          </p>
           <div className="overflow-x-auto rounded-2xl border border-border/30 bg-card">
             <table className="w-full text-sm">
               <thead>
                 <tr className="border-b border-border/30 bg-primary/5">
                  <th className="text-left p-3 font-semibold">Item</th>
                  {suppliers.map(qs => (
                    <th key={qs.id} className="text-center p-3 font-semibold whitespace-nowrap">
                      {qs.supplier?.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.item.id} className={cn(i < comparison.length - 1 && 'border-b border-border/50')}>
                    <td className="p-3">
                      <p className="font-medium">{row.item.item?.name}</p>
                      <p className="text-xs text-muted-foreground">×{row.item.quantity} {row.item.item?.unit_type}</p>
                    </td>
                    {row.supplierPrices.map(sp => {
                      const isWinner = sp.price && row.minPrice !== null && sp.price.unit_price === row.minPrice;
                      const isLoser = sp.price && row.minPrice !== null && sp.price.unit_price > row.minPrice;
                      return (
                        <td key={sp.supplier.id} className="p-3 text-center">
                          {sp.price ? (
                            <div>
                              <span className={cn(
                                'font-bold',
                                isWinner ? 'text-success' : isLoser ? 'text-destructive' : ''
                              )}>
                                R$ {sp.price.unit_price.toFixed(2).replace('.', ',')}
                                {isWinner && ' 🏆'}
                              </span>
                              {sp.price.brand && (
                                <p className="text-xs text-muted-foreground mt-0.5">{sp.price.brand}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Economy */}
          {economy > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20">
              <AppIcon name="Sparkles" className="w-5 h-5 text-success" />
              <p className="text-sm font-semibold text-success">
                Economia estimada: R$ {economy.toFixed(2).replace('.', ',')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {suppliers.map(qs => {
              // Show contest button if supplier has higher prices on some items
              const hasLosing = comparison.some(row => {
                const sp = row.supplierPrices.find(s => s.supplier.id === qs.id);
                return sp?.price && row.minPrice !== null && sp.price.unit_price > row.minPrice;
              });

              if (!hasLosing || qs.status === 'contested' || quotation.status === 'resolved') return null;

              return (
                <Button
                  key={qs.id}
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                  onClick={() => handleContest(qs.supplier_id)}
                >
                  <AppIcon name="AlertTriangle" className="w-3.5 h-3.5" />
                  Contestar {qs.supplier?.name}
                </Button>
              );
            })}

            {canResolve && (
              <Button
                onClick={handleResolve}
                className="rounded-xl gap-1.5 shadow-lg shadow-primary/20"
              >
                <AppIcon name="Trophy" className="w-4 h-4" />
                Gerar Pedidos Otimizados
              </Button>
            )}
          </div>
        </div>
      )}

      {loading && prices.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">Carregando preços...</p>
      )}
    </div>
  );
}
