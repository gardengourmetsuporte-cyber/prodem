import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListPicker } from '@/components/ui/list-picker';
import { InventoryItem, Category, Supplier } from '@/types/database';
import { AppIcon } from '@/components/ui/app-icon';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ItemFormSheetProps {
  item?: InventoryItem | null;
  categories: Category[];
  suppliers?: Supplier[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    category_id: string | null;
    supplier_id: string | null;
    unit_type: 'unidade' | 'kg' | 'litro';
    current_stock: number;
    min_stock: number;
    unit_price: number | null;
    recipe_unit_type: string | null;
    recipe_unit_price: number | null;
  }) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export function ItemFormSheetNew({ 
  item, 
  categories, 
  suppliers = [],
  open, 
  onOpenChange, 
  onSave, 
  onDelete,
  isAdmin 
}: ItemFormSheetProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [unitType, setUnitType] = useState<'unidade' | 'kg' | 'litro'>('unidade');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [recipeUnitType, setRecipeUnitType] = useState<string>('');
  const [recipeUnitPrice, setRecipeUnitPrice] = useState('');
  const [showRecipeSection, setShowRecipeSection] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategoryId(item.category_id || '');
      setSupplierId(item.supplier_id || '');
      setUnitType(item.unit_type);
      setCurrentStock(item.current_stock.toString());
      setMinStock(item.min_stock.toString());
      setUnitPrice(item.unit_price?.toString() || '');
      setRecipeUnitType(item.recipe_unit_type || '');
      setRecipeUnitPrice(item.recipe_unit_price?.toString() || '');
      setShowRecipeSection(!!item.recipe_unit_type || !!item.recipe_unit_price);
    } else {
      setName('');
      setCategoryId('');
      setSupplierId('');
      setUnitType('unidade');
      setCurrentStock('');
      setMinStock('');
      setUnitPrice('');
      setRecipeUnitType('');
      setRecipeUnitPrice('');
      setShowRecipeSection(false);
    }
  }, [item, open]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      category_id: categoryId || null,
      supplier_id: supplierId || null,
      unit_type: unitType,
      current_stock: parseFloat(currentStock) || 0,
      min_stock: parseFloat(minStock) || 0,
      unit_price: unitPrice ? parseFloat(unitPrice) : null,
      recipe_unit_type: recipeUnitType && recipeUnitType !== '__same__' ? recipeUnitType : null,
      recipe_unit_price: recipeUnitPrice ? parseFloat(recipeUnitPrice) : null,
    });
    
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (item && onDelete) {
      onDelete(item.id);
      onOpenChange(false);
    }
  };

  // Get recipe unit options based on stock unit type
  const getRecipeUnitOptions = () => {
    if (unitType === 'kg') return [
      { value: 'kg', label: 'Quilos (kg)' },
      { value: 'g', label: 'Gramas (g)' },
    ];
    if (unitType === 'litro') return [
      { value: 'litro', label: 'Litros (L)' },
      { value: 'ml', label: 'Mililitros (ml)' },
    ];
    return [
      { value: 'unidade', label: 'Unidade' },
      { value: 'kg', label: 'Quilos (kg)' },
      { value: 'g', label: 'Gramas (g)' },
    ];
  };

  const isValid = name.trim();

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
            <Label className="text-base font-medium">Categoria</Label>
            <button
              type="button"
              onClick={() => setCategoryPickerOpen(true)}
              className="flex items-center justify-between w-full h-14 px-4 text-lg rounded-xl border border-input bg-background hover:bg-accent/50 transition-colors"
            >
              <span className={categoryId ? 'text-foreground' : 'text-muted-foreground'}>
                {categoryId
                  ? categories.find(c => c.id === categoryId)?.name || 'Selecione a categoria'
                  : 'Selecione a categoria'}
              </span>
              <AppIcon name="ExpandMore" size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Supplier */}
          {suppliers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Fornecedor</Label>
              <button
                type="button"
                onClick={() => setSupplierPickerOpen(true)}
                className="flex items-center justify-between w-full h-14 px-4 text-lg rounded-xl border border-input bg-background hover:bg-accent/50 transition-colors"
              >
                <span className={supplierId ? 'text-foreground' : 'text-muted-foreground'}>
                  {supplierId
                    ? suppliers.find(s => s.id === supplierId)?.name || 'Selecione o fornecedor'
                    : 'Selecione o fornecedor'}
                </span>
                <AppIcon name="ExpandMore" size={20} className="text-muted-foreground" />
              </button>
            </div>
          )}

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
                  onClick={() => setUnitType(option.value as 'unidade' | 'kg' | 'litro')}
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

          {/* Unit Price */}
          <div className="space-y-2">
            <Label htmlFor="unitPrice" className="text-base font-medium">
              Preço por {unitType === 'kg' ? 'kg' : unitType === 'litro' ? 'litro' : 'unidade'}
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="unitPrice"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0,00"
                className="input-large pl-12"
                step={0.01}
                min={0}
              />
            </div>
          </div>

          {/* Recipe-specific pricing section */}
          <Collapsible open={showRecipeSection} onOpenChange={setShowRecipeSection}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 justify-between text-base font-medium"
              >
                <span>⚙️ Configurar para Fichas Técnicas</span>
                {showRecipeSection ? <AppIcon name="ExpandLess" size={20} /> : <AppIcon name="ExpandMore" size={20} />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure uma unidade e preço diferente para usar nas fichas técnicas. 
                Ex: Estoque conta "pacotes", mas ficha usa "kg".
              </p>
              
              <div className="space-y-2">
                <Label className="text-base font-medium">Unidade para Fichas</Label>
                <Select value={recipeUnitType} onValueChange={setRecipeUnitType}>
                  <SelectTrigger className="h-14 text-lg rounded-xl">
                    <SelectValue placeholder="Mesma do estoque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__same__" className="text-base py-3">Mesma do estoque</SelectItem>
                    {getRecipeUnitOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-base py-3">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {recipeUnitType && recipeUnitType !== '__same__' && (
                <div className="space-y-2">
                  <Label htmlFor="recipeUnitPrice" className="text-base font-medium">
                    Preço por {recipeUnitType === 'kg' ? 'kg' : recipeUnitType === 'g' ? 'g' : recipeUnitType === 'litro' ? 'L' : recipeUnitType === 'ml' ? 'ml' : 'un'}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input
                      id="recipeUnitPrice"
                      type="number"
                      value={recipeUnitPrice}
                      onChange={(e) => setRecipeUnitPrice(e.target.value)}
                      placeholder="0,00"
                      className="input-large pl-12"
                      step={0.01}
                      min={0}
                    />
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <LoadingButton
              onClick={handleSave}
              disabled={!isValid}
              className="w-full h-14 text-lg font-semibold rounded-xl"
            >
              {item ? 'Salvar Alterações' : 'Adicionar Item'}
            </LoadingButton>

            {item && onDelete && isAdmin && (
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

      <ListPicker
        open={categoryPickerOpen}
        onOpenChange={setCategoryPickerOpen}
        title="Selecionar Categoria"
        items={categories.map(c => ({ id: c.id, label: c.name }))}
        selectedId={categoryId || null}
        onSelect={(id) => setCategoryId(id || '')}
        allowNone
        noneLabel="Sem categoria"
      />

      <ListPicker
        open={supplierPickerOpen}
        onOpenChange={setSupplierPickerOpen}
        title="Selecionar Fornecedor"
        items={suppliers.map(s => ({ id: s.id, label: s.name }))}
        selectedId={supplierId || null}
        onSelect={(id) => setSupplierId(id || '')}
        allowNone
        noneLabel="Sem fornecedor"
      />
    </Sheet>
  );
}
