import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryItem } from '@/types/database';
import { AppIcon } from '@/components/ui/app-icon';

type MovementMode = 'entrada' | 'saida' | 'transferencia';

interface QuickMovementSheetProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (itemId: string, type: 'entrada' | 'saida' | 'transferencia', quantity: number, notes?: string, location?: string) => void;
}

const quickValues = [1, 5, 10, 25];

export function QuickMovementSheetNew({ item, open, onOpenChange, onConfirm }: QuickMovementSheetProps) {
  const [type, setType] = useState<MovementMode>('entrada');
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [entradaLocation, setEntradaLocation] = useState<'almoxarifado' | 'producao'>('almoxarifado');
  const [saidaLocation, setSaidaLocation] = useState<'almoxarifado' | 'producao'>('almoxarifado');
  const [transferDirection, setTransferDirection] = useState<'almoxarifado_to_producao' | 'producao_to_almoxarifado'>('almoxarifado_to_producao');

  const handleConfirm = () => {
    if (!item || quantity <= 0) return;
    
    let location = 'almoxarifado';
    if (type === 'entrada') location = entradaLocation;
    else if (type === 'saida') location = saidaLocation;
    else if (type === 'transferencia') location = transferDirection;

    onConfirm(item.id, type, quantity, notes || undefined, location);
    setQuantity(0);
    setNotes('');
    onOpenChange(false);
  };

  const incrementQuantity = (value: number) => {
    setQuantity(prev => Math.max(0, prev + value));
  };

  if (!item) return null;

  const unitLabel = item.unit_type === 'unidade' ? 'un' : item.unit_type === 'kg' ? 'kg' : 'L';
  const warehouseStock = (item as any).warehouse_stock ?? item.current_stock;
  const productionStock = (item as any).production_stock ?? 0;

  const maxTransfer = transferDirection === 'almoxarifado_to_producao' ? warehouseStock : productionStock;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl text-center">{item.name}</SheetTitle>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <AppIcon name="Warehouse" size={14} className="text-blue-400" />
              Almox: <span className="font-semibold text-foreground">{warehouseStock.toFixed(item.unit_type === 'unidade' ? 0 : 2)}</span>
            </span>
            <span className="flex items-center gap-1">
              <AppIcon name="Factory" size={14} className="text-amber-400" />
              Prod: <span className="font-semibold text-foreground">{productionStock.toFixed(item.unit_type === 'unidade' ? 0 : 2)}</span>
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-5">
          {/* Type Selection */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setType('entrada')}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl font-semibold transition-all text-sm ${
                type === 'entrada'
                  ? 'bg-success text-white shadow-lg'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <AppIcon name="ArrowDownCircle" size={20} />
              Entrada
            </button>
            <button
              onClick={() => setType('saida')}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl font-semibold transition-all text-sm ${
                type === 'saida'
                  ? 'bg-destructive text-white shadow-lg'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <AppIcon name="ArrowUpCircle" size={20} />
              Saída
            </button>
            <button
              onClick={() => setType('transferencia')}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl font-semibold transition-all text-sm ${
                type === 'transferencia'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <AppIcon name="ArrowRightLeft" size={20} />
              Transfer
            </button>
          </div>

          {/* Location selector for entrada/saida */}
          {type === 'entrada' && (
            <div className="flex gap-2">
              <button
                onClick={() => setEntradaLocation('almoxarifado')}
                className={`flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-sm font-medium transition-all ${
                  entradaLocation === 'almoxarifado'
                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                <AppIcon name="Warehouse" size={16} />
                Almoxarifado
              </button>
              <button
                onClick={() => setEntradaLocation('producao')}
                className={`flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-sm font-medium transition-all ${
                  entradaLocation === 'producao'
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                <AppIcon name="Factory" size={16} />
                Produção
              </button>
            </div>
          )}

          {type === 'saida' && (
            <div className="flex gap-2">
              <button
                onClick={() => setSaidaLocation('almoxarifado')}
                className={`flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-sm font-medium transition-all ${
                  saidaLocation === 'almoxarifado'
                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                <AppIcon name="Warehouse" size={16} />
                Almoxarifado
              </button>
              <button
                onClick={() => setSaidaLocation('producao')}
                className={`flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-sm font-medium transition-all ${
                  saidaLocation === 'producao'
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                <AppIcon name="Factory" size={16} />
                Produção
              </button>
            </div>
          )}

          {/* Transfer direction */}
          {type === 'transferencia' && (
            <div className="space-y-2">
              <button
                onClick={() => setTransferDirection('almoxarifado_to_producao')}
                className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${
                  transferDirection === 'almoxarifado_to_producao'
                    ? 'bg-primary/20 border border-primary/40 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                <AppIcon name="Warehouse" size={16} />
                Almoxarifado
                <AppIcon name="ArrowRight" size={16} />
                <AppIcon name="Factory" size={16} />
                Produção
              </button>
              <button
                onClick={() => setTransferDirection('producao_to_almoxarifado')}
                className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${
                  transferDirection === 'producao_to_almoxarifado'
                    ? 'bg-primary/20 border border-primary/40 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                <AppIcon name="Factory" size={16} />
                Produção
                <AppIcon name="ArrowRight" size={16} />
                <AppIcon name="Warehouse" size={16} />
                Almoxarifado
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Disponível: {maxTransfer.toFixed(item.unit_type === 'unidade' ? 0 : 2)} {unitLabel}
              </p>
            </div>
          )}

          {/* Quick Values */}
          <div className="grid grid-cols-4 gap-2">
            {quickValues.map((value) => (
              <button
                key={value}
                onClick={() => incrementQuantity(value)}
                className="h-14 rounded-xl bg-secondary font-bold text-lg hover:bg-secondary/80 transition-colors"
              >
                +{value}
              </button>
            ))}
          </div>

          {/* Quantity Input */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => incrementQuantity(-1)}
              className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80"
            >
              <AppIcon name="Minus" size={24} />
            </button>
            <div className="flex-1 relative">
              <Input
                type="number"
                value={quantity || ''}
                onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                className="h-16 text-center text-2xl font-bold rounded-xl"
                placeholder="0"
                step={item.unit_type === 'unidade' ? 1 : 0.1}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {unitLabel}
              </span>
            </div>
            <button
              onClick={() => incrementQuantity(1)}
              className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80"
            >
              <AppIcon name="Plus" size={24} />
            </button>
          </div>

          {/* Notes */}
          <Input
            placeholder="Observação (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-12 rounded-xl"
          />

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={quantity <= 0 || (type === 'transferencia' && quantity > maxTransfer)}
            className={`w-full h-14 text-lg font-semibold rounded-xl ${
              type === 'entrada' 
                ? 'bg-success hover:bg-success/90' 
                : type === 'saida'
                ? 'bg-destructive hover:bg-destructive/90'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {type === 'entrada' ? 'Confirmar Entrada' : type === 'saida' ? 'Confirmar Saída' : 'Confirmar Transferência'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
