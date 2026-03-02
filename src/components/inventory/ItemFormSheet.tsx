import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItem, UnitType } from '@/types/inventory';
import { AppIcon } from '@/components/ui/app-icon';

interface ItemFormSheetProps {
  item?: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDelete?: (id: string) => void;
}

const categories = [
  'Chapas de Aço',
  'Barras e Perfis',
  'Parafusos e Fixadores',
  'Tintas e Acabamento',
  'Rodízios e Componentes',
  'Consumíveis',
  'Ferramentas',
  'EPI',
  'Outros',
];

export function ItemFormSheet({ item, open, onOpenChange, onSave, onDelete }: ItemFormSheetProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unitType, setUnitType] = useState<UnitType>('unidade');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category);
      setUnitType(item.unitType);
      setCurrentStock(item.currentStock.toString());
      setMinStock(item.minStock.toString());
    } else {
      setName('');
      setCategory('');
      setUnitType('unidade');
      setCurrentStock('');
      setMinStock('');
    }
  }, [item, open]);

  const handleSave = () => {
    if (!name.trim() || !category) return;
    
    onSave({
      name: name.trim(),
      category,
      unitType,
      currentStock: parseFloat(currentStock) || 0,
      minStock: parseFloat(minStock) || 0,
    });
    
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (item && onDelete) {
      onDelete(item.id);
      onOpenChange(false);
    }
  };

  const isValid = name.trim() && category;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">
            {item ? 'Editar Item' : 'Novo Item'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium">Nome do Item *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Chapa 3mm (1200x3000)"
              className="input-large"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-14 text-lg rounded-xl">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-base py-3">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unit Type */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Tipo de Controle *</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'unidade', label: 'Unidades' },
                { value: 'kg', label: 'Quilos (kg)' },
                { value: 'litro', label: 'Litros (L)' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUnitType(option.value as UnitType)}
                  className={`h-14 rounded-xl font-medium transition-all ${
                    unitType === option.value
                      ? 'gradient-primary text-white'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stock fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock" className="text-base font-medium">
                Estoque Atual
              </Label>
              <Input
                id="currentStock"
                type="number"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                placeholder="0"
                className="input-large"
                step={unitType === 'unidade' ? 1 : 0.1}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock" className="text-base font-medium">
                Estoque Mínimo
              </Label>
              <Input
                id="minStock"
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="0"
                className="input-large"
                step={unitType === 'unidade' ? 1 : 0.1}
                min={0}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={!isValid}
              className="w-full h-14 text-lg font-semibold rounded-xl"
            >
              {item ? 'Salvar Alterações' : 'Adicionar Item'}
            </Button>

            {item && onDelete && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <AppIcon name="Delete" size={20} className="mr-2" />
                Excluir Item
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
