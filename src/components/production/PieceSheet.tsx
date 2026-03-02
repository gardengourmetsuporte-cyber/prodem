import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { ProductionPiece } from '@/hooks/useProductionPieces';
import { ProductionLog, PieceProgress } from '@/hooks/useProductionLogs';
import { ProductionShipment } from '@/hooks/useProductionShipments';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  piece: ProductionPiece | null;
  progress: PieceProgress | null;
  shipments: ProductionShipment[];
  shippedTotal: number;
  userId: string;
  unitId: string;
  onAddLog: (log: any) => Promise<void>;
  onAddShipment: (s: any) => Promise<void>;
}

export function PieceSheet({
  open, onOpenChange, piece, progress, shipments, shippedTotal,
  userId, unitId, onAddLog, onAddShipment,
}: Props) {
  const [tab, setTab] = useState<'production' | 'shipment'>('production');
  const [qty, setQty] = useState('');
  const [machineRef, setMachineRef] = useState('');
  const [operation, setOperation] = useState('');
  const [destination, setDestination] = useState('');
  const [requester, setRequester] = useState('');
  const [shipQty, setShipQty] = useState('');
  const [saving, setSaving] = useState(false);

  if (!piece) return null;

  const done = progress?.total_done || 0;
  const remaining = Math.max(0, piece.qty_total - done);
  const percent = piece.qty_total > 0 ? Math.min(100, Math.round((done / piece.qty_total) * 100)) : 0;

  const handleAddLog = async () => {
    const qtyNum = parseInt(qty);
    if (!qtyNum || qtyNum <= 0) { toast.error('Informe a quantidade'); return; }
    const op = operation || piece.process_type || 'PRODUÇÃO';
    setSaving(true);
    try {
      await onAddLog({
        piece_id: piece.id,
        project_id: piece.project_id,
        unit_id: unitId,
        operation: op,
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        quantity_done: qtyNum,
        operator_id: userId,
        machine_ref: machineRef || null,
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      toast.success(`${qtyNum} unidades registradas!`);
      setQty('');
      setMachineRef('');
      setOperation('');
    } catch (e: any) {
      toast.error(e.message || 'Erro');
    } finally {
      setSaving(false);
    }
  };

  const handleAddShipment = async () => {
    const qtyNum = parseInt(shipQty);
    if (!qtyNum || qtyNum <= 0) { toast.error('Informe a quantidade'); return; }
    setSaving(true);
    try {
      await onAddShipment({
        piece_id: piece.id,
        project_id: piece.project_id,
        unit_id: unitId,
        quantity: qtyNum,
        shipped_at: new Date().toISOString(),
        operator_id: userId,
        destination: destination || null,
        requester: requester || null,
      });
      toast.success(`${qtyNum} unidades expedidas!`);
      setShipQty('');
      setDestination('');
      setRequester('');
    } catch (e: any) {
      toast.error(e.message || 'Erro');
    } finally {
      setSaving(false);
    }
  };

  const logs = progress?.logs || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-left space-y-1">
            <div className="flex items-center gap-2">
              {piece.material_code && (
                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{piece.material_code}</span>
              )}
              <span className="text-xs text-muted-foreground uppercase tracking-widest">{piece.process_type}</span>
            </div>
            <p className="text-base font-bold">{piece.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
              {piece.cut_length_mm && <span>{piece.cut_length_mm}mm</span>}
              <span>Qtd: {piece.qty_total}</span>
              {piece.qty_per_rack > 0 && <span>Rack: {piece.qty_per_rack}</span>}
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Progress */}
        <div className="p-3 rounded-xl bg-muted/10 border border-border/30 space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground">Produzido: <strong className="text-foreground">{done}</strong></span>
            <span className="text-muted-foreground">Expedido: <strong className="text-foreground">{shippedTotal}</strong></span>
            <span className={cn("font-bold", percent >= 100 ? "text-success" : "text-foreground")}>{percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted/20 overflow-hidden flex">
            <div className="h-full bg-success transition-all" style={{ width: `${Math.min(100, Math.round((shippedTotal / Math.max(piece.qty_total, 1)) * 100))}%` }} />
            <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(0, percent - Math.round((shippedTotal / Math.max(piece.qty_total, 1)) * 100))}%` }} />
          </div>
          <div className="flex gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Expedido</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Produzido</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-lg bg-muted/10">
          <button
            onClick={() => setTab('production')}
            className={cn("flex-1 py-2 text-xs font-bold rounded-md transition-colors",
              tab === 'production' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
          >
            Produção
          </button>
          <button
            onClick={() => setTab('shipment')}
            className={cn("flex-1 py-2 text-xs font-bold rounded-md transition-colors",
              tab === 'shipment' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
          >
            Expedição
          </button>
        </div>

        {tab === 'production' && (
          <div className="space-y-4">
            {/* Quick log form */}
            <div className="p-3 rounded-xl border border-border/30 bg-card space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Registrar Produção</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase">Quantidade</label>
                  <Input
                    type="number"
                    placeholder={String(remaining)}
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase">Operação</label>
                  <Input
                    placeholder={piece.process_type || 'SERRA'}
                    value={operation}
                    onChange={e => setOperation(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Ref. Máquina</label>
                <Input
                  placeholder="Ex: Serra 02"
                  value={machineRef}
                  onChange={e => setMachineRef(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button onClick={handleAddLog} disabled={saving} className="w-full" size="sm">
                <AppIcon name="Plus" size={14} className="mr-1" />
                Registrar
              </Button>
            </div>

            {/* Logs history */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Histórico</p>
              {logs.length === 0 && (
                <p className="text-xs text-muted-foreground/50 text-center py-4">Nenhum registro ainda</p>
              )}
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/5 border border-border/20">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <AppIcon name="Wrench" size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{log.operation}</span>
                      <span className="text-xs font-mono text-primary font-bold">×{log.quantity_done}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {log.machine_ref && <span>{log.machine_ref}</span>}
                      <span>{format(new Date(log.created_at), 'dd/MM HH:mm')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'shipment' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl border border-border/30 bg-card space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nova Expedição</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase">Quantidade</label>
                  <Input
                    type="number"
                    placeholder={String(done - shippedTotal)}
                    value={shipQty}
                    onChange={e => setShipQty(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase">Destino</label>
                  <Input
                    placeholder="Ex: Linha 3"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Solicitante</label>
                <Input
                  placeholder="Nome"
                  value={requester}
                  onChange={e => setRequester(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button onClick={handleAddShipment} disabled={saving} className="w-full" size="sm">
                <AppIcon name="Truck" size={14} className="mr-1" />
                Expedir
              </Button>
            </div>

            {/* Shipment history */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expedições</p>
              {shipments.filter(s => s.piece_id === piece.id).length === 0 && (
                <p className="text-xs text-muted-foreground/50 text-center py-4">Nenhuma expedição</p>
              )}
              {shipments.filter(s => s.piece_id === piece.id).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/5 border border-border/20">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <AppIcon name="Truck" size={14} className="text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">×{s.quantity}</span>
                      {s.destination && <span className="text-xs text-muted-foreground">→ {s.destination}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {s.requester && <span>Sol: {s.requester}</span>}
                      <span>{format(new Date(s.shipped_at), 'dd/MM HH:mm')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
