import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { ProductionPiece } from '@/hooks/useProductionPieces';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  piece: ProductionPiece | null;
  elapsedSeconds: number;
  alreadyDone?: number;
  onFinish: (quantity: number, machineRef?: string) => Promise<void>;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}min ${s}s`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

export function FinishTaskDialog({ open, onOpenChange, piece, elapsedSeconds, alreadyDone = 0, onFinish }: Props) {
  const [quantity, setQuantity] = useState<number | ''>('');
  const [machineRef, setMachineRef] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open || !piece) return null;

  const handleSubmit = async () => {
    const qty = Number(quantity);
    if (!qty || qty <= 0) return;
    const maxQty = Math.max(0, piece.qty_total - (alreadyDone || 0));
    const cappedQty = Math.min(qty, maxQty > 0 ? maxQty : qty);
    try {
      setLoading(true);
      await onFinish(cappedQty, machineRef || undefined);
      onOpenChange(false);
      setQuantity('');
      setMachineRef('');
    } catch {
      // handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-sm rounded-2xl border border-border/40 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-success/10 border-b border-border/30 text-center space-y-1">
          <AppIcon name="CheckCircle2" size={28} className="text-success mx-auto" />
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
            Finalizar Tarefa
          </h3>
          <p className="text-xs text-muted-foreground truncate">{piece.description}</p>
        </div>

        {/* Elapsed time */}
        <div className="flex items-center justify-center gap-2 p-3 bg-muted/10">
          <AppIcon name="Clock" size={14} className="text-primary" />
          <span className="text-sm font-mono font-bold text-foreground">{formatDuration(elapsedSeconds)}</span>
          <span className="text-[10px] text-muted-foreground uppercase">de produção</span>
        </div>

        {/* Form */}
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
              Quantidade Produzida *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                className="w-full border border-border/50 rounded-lg px-3 py-2.5 font-black text-lg text-center bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                autoFocus
              />
              <button
                onClick={() => setQuantity(Math.max(0, piece.qty_total - alreadyDone))}
                className="px-3 py-2 rounded-lg border border-border/50 text-[10px] font-bold text-primary hover:bg-primary/5 transition-colors whitespace-nowrap"
              >
                MAX ({Math.max(0, piece.qty_total - alreadyDone)})
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
              Ref. Máquina <span className="text-muted-foreground/50">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Serra 1"
              className="w-full border border-border/50 rounded-lg px-3 py-2 text-sm bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={machineRef}
              onChange={e => setMachineRef(e.target.value)}
            />
          </div>

          <div className="text-[10px] text-muted-foreground flex items-center gap-3 py-1">
            <span>📅 {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</span>
            <span>⏱️ {formatDuration(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex gap-2">
          <button
            onClick={() => { setQuantity(''); setMachineRef(''); onOpenChange(false); }}
            className="flex-1 py-2.5 rounded-lg border border-border/50 text-xs font-bold text-muted-foreground hover:bg-muted/10 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !quantity || Number(quantity) <= 0}
            className="flex-1 py-2.5 rounded-lg bg-success text-success-foreground text-xs font-bold disabled:opacity-50 transition-colors hover:bg-success/90"
          >
            {loading ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
