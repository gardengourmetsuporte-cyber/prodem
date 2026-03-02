import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';

interface ProductionFinishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  quantityOrdered?: number;
  quantityDone?: number;
  onFinish: (quantity: number, machineRef?: string) => Promise<void>;
}

export function ProductionFinishDialog({ open, onOpenChange, itemName, quantityOrdered, quantityDone, onFinish }: ProductionFinishDialogProps) {
  const [quantity, setQuantity] = useState('');
  const [machineRef, setMachineRef] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      toast.error('Informe a quantidade produzida');
      return;
    }
    setLoading(true);
    try {
      await onFinish(qty, machineRef.trim() || undefined);
      toast.success('Produção finalizada!');
      setQuantity('');
      setMachineRef('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="Square" size={18} className="text-warning" />
            Finalizar Produção
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Peça: <span className="font-semibold text-foreground">{itemName}</span>
            </p>
            {quantityOrdered != null && (
              <p className="text-xs text-muted-foreground">
                Pedido: <span className="font-bold text-foreground">{quantityOrdered}</span>
                {quantityDone != null && quantityDone > 0 && (
                  <> · Já feito: <span className="font-bold text-warning">{quantityDone}</span></>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Quantidade produzida *</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Ex: 50"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="text-lg font-bold"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Ref. Máquina (opcional)</Label>
            <Input
              placeholder="Ex: Serra 01"
              value={machineRef}
              onChange={e => setMachineRef(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleFinish}
            disabled={loading || !quantity}
          >
            {loading ? 'Salvando...' : 'Confirmar'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
