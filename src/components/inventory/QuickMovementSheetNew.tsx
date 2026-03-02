import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryItem } from '@/types/database';
import { AppIcon } from '@/components/ui/app-icon';

type MovementMode = 'entrada' | 'saida';

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

  const handleConfirm = () => {
    if (!item || quantity <= 0) return;
    onConfirm(item.id, type, quantity, notes || undefined, 'almoxarifado');
    setQuantity(0);
    setNotes('');
    onOpenChange(false);
  };

  const incrementQuantity = (value: number) => {
    setQuantity(prev => Math.max(0, prev + value));
  };

  if (!item) return null;

  const unitLabel = item.unit_type === 'unidade' ? 'un' : item.unit_type === 'kg' ? 'kg' : 'L';
  const currentStock = item.current_stock;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl text-center">{item.name}</SheetTitle>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <AppIcon name="Package" size={14} className="text-primary" />
              Estoque: <span className="font-semibold text-foreground">{currentStock.toFixed(item.unit_type === 'unidade' ? 0 : 2)}</span>
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-5">
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-2">
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
          </div>

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
            disabled={quantity <= 0}
            className={`w-full h-14 text-lg font-semibold rounded-xl ${
              type === 'entrada' 
                ? 'bg-success hover:bg-success/90' 
                : 'bg-destructive hover:bg-destructive/90'
            }`}
          >
            {type === 'entrada' ? 'Confirmar Entrada' : 'Confirmar Saída'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
