import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListPicker } from '@/components/ui/list-picker';
import { InventoryItem, Category, Supplier, UnitType } from '@/types/database';
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
    unit_type: UnitType;
    current_stock: number;
    min_stock: number;
    unit_price: number | null;
    recipe_unit_type: string | null;
    recipe_unit_price: number | null;
    material_type: string | null;
    dimensions: string | null;
    thickness: string | null;
    technical_spec: string | null;
    internal_code: string | null;
    location: string | null;
    weight_per_unit: number | null;
  }) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

const MATERIAL_OPTIONS = [
  'Aço carbono',
  'Aço galvanizado',
  'Inox 304',
  'Inox 316',
  'Alumínio',
  'Latão',
  'Cobre',
  'Polímero',
];

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
  const [unitType, setUnitType] = useState<UnitType>('unidade');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [showTechSection, setShowTechSection] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false);

  // Industrial fields
  const [internalCode, setInternalCode] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');
  const [thickness, setThickness] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [technicalSpec, setTechnicalSpec] = useState('');
  const [weightPerUnit, setWeightPerUnit] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategoryId(item.category_id || '');
      setSupplierId(item.supplier_id || '');
      setUnitType(item.unit_type);
      setCurrentStock(item.current_stock.toString());
      setMinStock(item.min_stock.toString());
      setUnitPrice(item.unit_price?.toString() || '');
      setInternalCode(item.internal_code || '');
      const mat = item.material_type || '';
      if (mat && !MATERIAL_OPTIONS.includes(mat)) {
        setMaterialType('__custom__');
        setCustomMaterial(mat);
      } else {
        setMaterialType(mat);
        setCustomMaterial('');
      }
      setThickness(item.thickness || '');
      setDimensions(item.dimensions || '');
      setTechnicalSpec(item.technical_spec || '');
      setWeightPerUnit(item.weight_per_unit?.toString() || '');
      setLocation(item.location || '');
      setShowTechSection(!!(item.internal_code || item.material_type || item.thickness || item.dimensions || item.technical_spec || item.weight_per_unit || item.location));
    } else {
      setName('');
      setCategoryId('');
      setSupplierId('');
      setUnitType('unidade');
      setCurrentStock('');
      setMinStock('');
      setUnitPrice('');
      setInternalCode('');
      setMaterialType('');
      setCustomMaterial('');
      setThickness('');
      setDimensions('');
      setTechnicalSpec('');
      setWeightPerUnit('');
      setLocation('');
      setShowTechSection(false);
    }
  }, [item, open]);

  const resolvedMaterial = materialType === '__custom__' ? customMaterial : materialType;

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
      recipe_unit_type: null,
      recipe_unit_price: null,
      internal_code: internalCode.trim() || null,
      material_type: resolvedMaterial.trim() || null,
      thickness: thickness.trim() || null,
      dimensions: dimensions.trim() || null,
      technical_spec: technicalSpec.trim() || null,
      weight_per_unit: weightPerUnit ? parseFloat(weightPerUnit) : null,
      location: location.trim() || null,
    });
    
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (item && onDelete) {
      onDelete(item.id);
      onOpenChange(false);
    }
  };

  const getUnitLabel = () => {
    switch (unitType) {
      case 'kg': return 'kg';
      case 'litro': return 'litro';
      case 'metro': return 'metro';
      case 'metro_quadrado': return 'm²';
      default: return 'unidade';
    }
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
              {([
                { value: 'unidade', label: 'Unidades' },
                { value: 'kg', label: 'Quilos (kg)' },
                { value: 'litro', label: 'Litros (L)' },
              ] as { value: UnitType; label: string }[]).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUnitType(option.value)}
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
            <div className="grid grid-cols-2 gap-2 mt-2">
              {([
                { value: 'metro', label: 'Metros (m)' },
                { value: 'metro_quadrado', label: 'Metros² (m²)' },
              ] as { value: UnitType; label: string }[]).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUnitType(option.value)}
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
              <Label htmlFor="currentStock" className="text-base font-medium">Estoque Atual</Label>
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
              <Label htmlFor="minStock" className="text-base font-medium">Estoque Mínimo</Label>
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
              Preço por {getUnitLabel()}
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

          {/* Industrial Technical Sheet */}
          <Collapsible open={showTechSection} onOpenChange={setShowTechSection}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 justify-between text-base font-medium"
              >
                <span>🔩 Ficha Técnica</span>
                {showTechSection ? <AppIcon name="ExpandLess" size={20} /> : <AppIcon name="ExpandMore" size={20} />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Informações técnicas do material: código, tipo, dimensões, norma e localização no galpão.
              </p>

              {/* Internal Code */}
              <div className="space-y-2">
                <Label htmlFor="internalCode" className="text-base font-medium">Código Interno</Label>
                <Input
                  id="internalCode"
                  value={internalCode}
                  onChange={(e) => setInternalCode(e.target.value)}
                  placeholder="Ex: CHP-001, TUB-045"
                  className="input-large font-mono"
                />
              </div>

              {/* Material Type */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Material</Label>
                <Select value={materialType} onValueChange={(v) => { setMaterialType(v); if (v !== '__custom__') setCustomMaterial(''); }}>
                  <SelectTrigger className="h-14 text-lg rounded-xl">
                    <SelectValue placeholder="Selecione o material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" className="text-base py-3">Não informado</SelectItem>
                    {MATERIAL_OPTIONS.map((mat) => (
                      <SelectItem key={mat} value={mat} className="text-base py-3">{mat}</SelectItem>
                    ))}
                    <SelectItem value="__custom__" className="text-base py-3">Outro (digitar)</SelectItem>
                  </SelectContent>
                </Select>
                {materialType === '__custom__' && (
                  <Input
                    value={customMaterial}
                    onChange={(e) => setCustomMaterial(e.target.value)}
                    placeholder="Digite o tipo do material"
                    className="input-large mt-2"
                  />
                )}
              </div>

              {/* Thickness */}
              <div className="space-y-2">
                <Label htmlFor="thickness" className="text-base font-medium">Espessura</Label>
                <Input
                  id="thickness"
                  value={thickness}
                  onChange={(e) => setThickness(e.target.value)}
                  placeholder='Ex: 3mm, 1/4", #12'
                  className="input-large"
                />
              </div>

              {/* Dimensions */}
              <div className="space-y-2">
                <Label htmlFor="dimensions" className="text-base font-medium">Dimensões</Label>
                <Input
                  id="dimensions"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder='Ex: 1200x3000mm, Ø 2"'
                  className="input-large"
                />
              </div>

              {/* Technical Spec */}
              <div className="space-y-2">
                <Label htmlFor="technicalSpec" className="text-base font-medium">Especificação Técnica</Label>
                <Input
                  id="technicalSpec"
                  value={technicalSpec}
                  onChange={(e) => setTechnicalSpec(e.target.value)}
                  placeholder="Ex: ASTM A36, NBR 8800"
                  className="input-large"
                />
              </div>

              {/* Weight per unit */}
              <div className="space-y-2">
                <Label htmlFor="weightPerUnit" className="text-base font-medium">Peso por unidade (kg)</Label>
                <Input
                  id="weightPerUnit"
                  type="number"
                  value={weightPerUnit}
                  onChange={(e) => setWeightPerUnit(e.target.value)}
                  placeholder="Ex: 85.2"
                  className="input-large"
                  step={0.1}
                  min={0}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-base font-medium">Localização</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Prateleira A3, Galpão 2"
                  className="input-large"
                />
              </div>
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
