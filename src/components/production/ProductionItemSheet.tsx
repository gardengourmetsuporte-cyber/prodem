import { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProductionItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
  itemName: string;
  materialCode?: string;
  dimensions?: string;
  quantityOrdered: number;
  quantityDone: number;
  date: string;
  unitId: string | null;
  checklistType: string;
}

interface CompletionRecord {
  id: string;
  started_at: string | null;
  finished_at: string | null;
  quantity_done: number;
  quantity_shipped: number;
  machine_ref: string | null;
  completed_by: string;
  status: string;
  profile_name?: string;
}

export function ProductionItemSheet({
  open, onOpenChange, itemId, itemName, materialCode, dimensions,
  quantityOrdered, quantityDone, date, unitId, checklistType,
}: ProductionItemSheetProps) {
  const [records, setRecords] = useState<CompletionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [shippedQty, setShippedQty] = useState('');
  const [savingShipped, setSavingShipped] = useState(false);

  // Fetch completion records for this item
  useEffect(() => {
    if (!open || !itemId || !unitId) return;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from('checklist_completions')
        .select('id, started_at, finished_at, quantity_done, quantity_shipped, machine_ref, completed_by, status')
        .eq('item_id', itemId)
        .eq('date', date)
        .eq('unit_id', unitId)
        .eq('checklist_type', checklistType as any)
        .in('status', ['completed', 'done', 'in_progress'])
        .order('started_at', { ascending: true });

      if (error) {
        console.error(error);
        setRecords([]);
        setLoading(false);
        return;
      }

      // Fetch profile names
      const userIds = [...new Set((data || []).map(d => d.completed_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      setRecords((data || []).map(d => ({
        ...d,
        profile_name: profileMap.get(d.completed_by) || 'Operador',
      })));
      setLoading(false);
    })();
  }, [open, itemId, date, unitId, checklistType]);

  const totalShipped = records.reduce((s, r) => s + (r.quantity_shipped || 0), 0);
  const remaining = quantityOrdered - quantityDone;
  const percent = quantityOrdered > 0 ? Math.round((quantityDone / quantityOrdered) * 100) : 0;

  const handleUpdateShipped = async (recordId: string, qty: number) => {
    setSavingShipped(true);
    try {
      const { error } = await supabase
        .from('checklist_completions')
        .update({ quantity_shipped: qty, shipped_at: new Date().toISOString() })
        .eq('id', recordId);
      if (error) throw error;
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, quantity_shipped: qty } : r));
      toast.success('Expedição atualizada');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar expedição');
    } finally {
      setSavingShipped(false);
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    try { return format(new Date(iso), 'HH:mm', { locale: ptBR }); }
    catch { return '—'; }
  };

  const getDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return '—';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}min`;
    return `${mins}min`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col p-0">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 space-y-3 border-b border-border/30">
          <SheetHeader className="p-0">
            <SheetTitle className="flex items-center gap-2">
              <AppIcon name="FileText" size={20} className="text-primary" />
              Ordem de Produção
            </SheetTitle>
          </SheetHeader>

          {/* Item info card */}
          <div className="rounded-xl p-4 bg-muted/20 ring-1 ring-border/30 space-y-2">
            <p className="text-base font-bold text-foreground">{itemName}</p>
            <div className="flex flex-wrap gap-2">
              {materialCode && (
                <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {materialCode}
                </span>
              )}
              {dimensions && (
                <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                  📐 {dimensions}
                </span>
              )}
            </div>

            {/* Progress summary */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="text-center">
                <p className="text-lg font-black text-foreground">{quantityOrdered}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Pedido</p>
              </div>
              <div className="text-center">
                <p className={cn("text-lg font-black", quantityDone >= quantityOrdered ? "text-success" : "text-warning")}>{quantityDone}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Feito</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-muted-foreground">{Math.max(0, remaining)}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Falta</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-primary">{totalShipped}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Expedido</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-secondary/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(percent, 100)}%`,
                  background: percent >= 100
                    ? 'hsl(var(--success))'
                    : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))',
                }}
              />
            </div>
          </div>
        </div>

        {/* Operations table */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
            Operações Registradas
          </h4>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Nenhuma operação registrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((record, idx) => (
                <div
                  key={record.id}
                  className={cn(
                    "rounded-xl p-3 ring-1 ring-border/20 space-y-2",
                    record.status === 'in_progress'
                      ? "bg-warning/5 ring-warning/30"
                      : "bg-card/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground">#{idx + 1}</span>
                      <span className="text-xs font-medium text-foreground">{record.profile_name}</span>
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                      record.status === 'in_progress'
                        ? "bg-warning/20 text-warning"
                        : "bg-success/15 text-success"
                    )}>
                      {record.status === 'in_progress' ? 'Produzindo' : 'Concluído'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xs font-bold text-foreground">{formatTime(record.started_at)}</p>
                      <p className="text-[8px] text-muted-foreground">Início</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{formatTime(record.finished_at)}</p>
                      <p className="text-[8px] text-muted-foreground">Fim</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{record.quantity_done || '—'}</p>
                      <p className="text-[8px] text-muted-foreground">Qtd</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{getDuration(record.started_at, record.finished_at)}</p>
                      <p className="text-[8px] text-muted-foreground">Duração</p>
                    </div>
                  </div>

                  {record.machine_ref && (
                    <div className="flex items-center gap-1.5">
                      <AppIcon name="Cog" size={11} className="text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground">Máq: {record.machine_ref}</span>
                    </div>
                  )}

                  {/* Expedition */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border/10">
                    <AppIcon name="Truck" size={12} className="text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground">Expedido:</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={record.quantity_shipped || ''}
                      placeholder="0"
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        handleUpdateShipped(record.id, val);
                      }}
                      className="w-14 h-6 text-center text-xs font-bold rounded bg-background border border-border/60"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
