import { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { IngredientRow } from './IngredientRow';
import { IngredientPicker } from './IngredientPicker';
import { formatCurrency, calculateIngredientCost, calculateSubRecipeCost, type Recipe, type RecipeCategory, type RecipeUnitType, type IngredientSourceType } from '@/types/recipe';
import { useRecipeCostSettings } from '@/hooks/useRecipeCostSettings';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';

interface LocalIngredient {
  id?: string;
  source_type: IngredientSourceType;
  item_id: string | null;
  item_name: string | null;
  item_unit: string | null;
  item_price: number | null;
  source_recipe_id: string | null;
  source_recipe_name: string | null;
  source_recipe_unit: string | null;
  source_recipe_cost: number | null;
  quantity: number;
  unit_type: RecipeUnitType;
  total_cost: number;
}

interface InventoryItem {
  id: string;
  name: string;
  unit_type: string;
  unit_price: number;
  recipe_unit_type?: string | null;
  recipe_unit_price?: number | null;
  category?: { id: string; name: string; color: string } | null;
}

interface SubRecipeItem {
  id: string;
  name: string;
  yield_unit: string;
  cost_per_portion: number;
  category?: { id: string; name: string; color: string } | null;
}

interface RecipeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe | null;
  categories: RecipeCategory[];
  inventoryItems: InventoryItem[];
  subRecipes: SubRecipeItem[];
  onSave: (data: any) => Promise<void>;
  isSaving: boolean;
  defaultCategoryId?: string | null;
  onUpdateItemPrice?: (itemId: string, newPrice: number) => Promise<void>;
  onUpdateItemUnit?: (itemId: string, unitType: string) => Promise<void>;
}

export function RecipeSheet({
  open,
  onOpenChange,
  recipe,
  categories,
  inventoryItems,
  subRecipes,
  onSave,
  isSaving,
  defaultCategoryId,
  onUpdateItemPrice,
  onUpdateItemUnit,
}: RecipeSheetProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [yieldQuantity, setYieldQuantity] = useState('1');
  const [yieldUnit, setYieldUnit] = useState('unidade');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<LocalIngredient[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [marginPercent, setMarginPercent] = useState(50);
  const [sellingPrice, setSellingPrice] = useState('');
  const [marginMode, setMarginMode] = useState<'margin' | 'price'>('margin');

  const { settings, calculateOperationalCosts } = useRecipeCostSettings();

  // Reset form when recipe changes
  useEffect(() => {
    if (recipe) {
      setName(recipe.name);
      setCategoryId(recipe.category_id || '');
      setYieldQuantity(String(recipe.yield_quantity));
      setYieldUnit(recipe.yield_unit);
      setNotes(recipe.preparation_notes || '');
      setIngredients(
        (recipe.ingredients || []).map((ing) => ({
          id: ing.id,
          source_type: (ing.source_type || 'inventory') as IngredientSourceType,
          item_id: ing.item_id || null,
          item_name: ing.item?.name || null,
          item_unit: ing.item?.recipe_unit_type || ing.item?.unit_type || null,
          item_price: ing.unit_cost || ing.item?.recipe_unit_price || ing.item?.unit_price || null,
          source_recipe_id: ing.source_recipe_id || null,
          source_recipe_name: ing.source_recipe?.name || null,
          source_recipe_unit: ing.source_recipe?.yield_unit || null,
          source_recipe_cost: ing.source_recipe?.cost_per_portion || null,
          quantity: ing.quantity,
          unit_type: ing.unit_type,
          total_cost: ing.total_cost,
        }))
      );
    } else {
      setName('');
      setCategoryId('');
      setYieldQuantity('1');
      setYieldUnit('unidade');
      setNotes('');
      setIngredients([]);
    }
  }, [recipe, open]);

  useEffect(() => {
    if (open && !recipe && defaultCategoryId) {
      setCategoryId(defaultCategoryId);
    }
  }, [open, recipe, defaultCategoryId]);

  // Cost calculations
  const ingredientsCost = ingredients.reduce((sum, ing) => sum + ing.total_cost, 0);
  const portions = parseFloat(yieldQuantity) || 1;
  const costPerPortion = ingredientsCost / portions;

  const operationalCosts = useMemo(
    () => calculateOperationalCosts(costPerPortion),
    [costPerPortion, settings]
  );

  const variableCost = costPerPortion + operationalCosts.packagingCost;
  const salesCost = operationalCosts.taxAmount + operationalCosts.cardFeeAmount;
  const fixedCost = operationalCosts.fixedCostPerProduct;
  const totalCostPerPortion = variableCost + salesCost + fixedCost;

  // Margin calculations
  const suggestedPrice = totalCostPerPortion > 0
    ? totalCostPerPortion / (1 - marginPercent / 100)
    : 0;

  const calculatedMarginFromPrice = useMemo(() => {
    const price = parseFloat(sellingPrice) || 0;
    if (price <= 0) return 0;
    return ((price - totalCostPerPortion) / price) * 100;
  }, [sellingPrice, totalCostPerPortion]);

  // Update selling price when margin changes
  useEffect(() => {
    if (marginMode === 'margin' && totalCostPerPortion > 0) {
      setSellingPrice(suggestedPrice.toFixed(2));
    }
  }, [marginPercent, totalCostPerPortion, marginMode]);

  const handleSellingPriceChange = (value: string) => {
    setMarginMode('price');
    setSellingPrice(value);
    const price = parseFloat(value) || 0;
    if (price > 0) {
      const margin = ((price - totalCostPerPortion) / price) * 100;
      setMarginPercent(Math.max(0, Math.min(99, Math.round(margin))));
    }
  };

  const handleMarginChange = (value: number[]) => {
    setMarginMode('margin');
    setMarginPercent(value[0]);
  };

  // Alerts
  const ingredientsWithoutPrice = ingredients.filter(
    i => i.source_type === 'inventory' && (i.item_price === null || i.item_price === 0)
  );
  const effectiveMargin = marginMode === 'price' ? calculatedMarginFromPrice : marginPercent;
  const isLowMargin = effectiveMargin > 0 && effectiveMargin < 30;
  const isNegativeMargin = effectiveMargin < 0;

  const handleAddInventoryItem = (item: InventoryItem) => {
    const effectiveUnit = (item.recipe_unit_type || item.unit_type) as RecipeUnitType;
    const effectivePrice = item.recipe_unit_price ?? item.unit_price ?? 0;
    const defaultQuantity = 1;
    const cost = calculateIngredientCost(effectivePrice, effectiveUnit, defaultQuantity, effectiveUnit);

    setIngredients((prev) => [
      ...prev,
      {
        source_type: 'inventory',
        item_id: item.id,
        item_name: item.name,
        item_unit: effectiveUnit,
        item_price: effectivePrice,
        source_recipe_id: null,
        source_recipe_name: null,
        source_recipe_unit: null,
        source_recipe_cost: null,
        quantity: defaultQuantity,
        unit_type: effectiveUnit,
        total_cost: cost,
      },
    ]);
  };

  const handleAddSubRecipe = (subRecipe: SubRecipeItem) => {
    const defaultUnit = subRecipe.yield_unit as RecipeUnitType;
    const defaultQuantity = 1;
    const cost = calculateSubRecipeCost(subRecipe.cost_per_portion, subRecipe.yield_unit, defaultQuantity, defaultUnit);

    setIngredients((prev) => [
      ...prev,
      {
        source_type: 'recipe',
        item_id: null,
        item_name: null,
        item_unit: null,
        item_price: null,
        source_recipe_id: subRecipe.id,
        source_recipe_name: subRecipe.name,
        source_recipe_unit: subRecipe.yield_unit,
        source_recipe_cost: subRecipe.cost_per_portion,
        quantity: defaultQuantity,
        unit_type: defaultUnit,
        total_cost: cost,
      },
    ]);
  };

  const handleIngredientChange = (index: number, updates: Partial<LocalIngredient>) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, ...updates } : ing))
    );
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const data = {
      ...(recipe?.id && { id: recipe.id }),
      name: name.trim(),
      category_id: categoryId || null,
      yield_quantity: parseFloat(yieldQuantity) || 1,
      yield_unit: yieldUnit,
      preparation_notes: notes.trim() || null,
      ingredients: ingredients.map((ing) => ({
        ...(ing.id && { id: ing.id }),
        item_id: ing.item_id,
        quantity: ing.quantity,
        unit_type: ing.unit_type,
        unit_cost: ing.source_type === 'recipe' ? ing.source_recipe_cost || 0 : ing.item_price || 0,
        total_cost: ing.total_cost,
        source_type: ing.source_type,
        source_recipe_id: ing.source_recipe_id,
      })),
    };

    await onSave(data);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col [&>button]:hidden">
          {/* Fixed Header */}
          <SheetHeader className="p-4 border-b shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => onOpenChange(false)}
                >
                  <AppIcon name="ArrowLeft" className="h-4 w-4" />
                </Button>
                <SheetTitle className="text-base">{recipe ? 'Editar Ficha' : 'Nova Ficha Técnica'}</SheetTitle>
              </div>
              <LoadingButton size="sm" onClick={handleSubmit} loading={isSaving} loadingText="Salvando...">
                Salvar
              </LoadingButton>
            </div>
          </SheetHeader>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6 pb-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Receita</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: X-Burguer Tradicional"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yield">Rendimento</Label>
                    <Input
                      id="yield"
                      type="number"
                      value={yieldQuantity}
                      onChange={(e) => setYieldQuantity(e.target.value)}
                      min="1"
                      step="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Select value={yieldUnit} onValueChange={setYieldUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidade">Unidades</SelectItem>
                        <SelectItem value="porção">Porções</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="litro">Litros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Ingredients */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Ingredientes</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerOpen(true)}
                  >
                    <AppIcon name="Plus" className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {ingredients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                    <p>Nenhum ingrediente adicionado</p>
                    <p className="text-sm">Clique em "Adicionar" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ingredients.map((ingredient, index) => (
                      <IngredientRow
                        key={ingredient.source_type === 'recipe'
                          ? `recipe-${ingredient.source_recipe_id}`
                          : `item-${ingredient.item_id}-${index}`}
                        ingredient={ingredient}
                        onChange={(updates) => handleIngredientChange(index, updates)}
                        onRemove={() => handleRemoveIngredient(index)}
                        onUpdateGlobalPrice={onUpdateItemPrice}
                        onUpdateItemUnit={onUpdateItemUnit}
                      />
                    ))}
                  </div>
                )}

                {/* Alerts */}
                {ingredientsWithoutPrice.length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-300">
                    <AppIcon name="AlertTriangle" className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      {ingredientsWithoutPrice.length} ingrediente(s) sem preço definido. O custo final pode estar incompleto.
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* ═══ COST BREAKDOWN ═══ */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Composição de Custos</Label>

                {/* A) Custos Variáveis */}
                <div className="rounded-xl border p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <AppIcon name="Package" className="h-4 w-4 text-primary" />
                    Custos Variáveis
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ingredientes ({ingredients.length})</span>
                    <span className="font-medium">{formatCurrency(costPerPortion)}</span>
                  </div>
                  {operationalCosts.packagingCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Embalagem</span>
                      <span className="font-medium">{formatCurrency(operationalCosts.packagingCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                    <span>Subtotal</span>
                    <span className="text-primary">{formatCurrency(variableCost)}</span>
                  </div>
                </div>

                {/* B) Custos de Venda */}
                {salesCost > 0 && (
                  <div className="rounded-xl border p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <AppIcon name="Percent" className="h-4 w-4 text-orange-500" />
                      Custos de Venda
                    </div>
                    {operationalCosts.taxAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Impostos ({settings.tax_percentage}%)</span>
                        <span className="font-medium">{formatCurrency(operationalCosts.taxAmount)}</span>
                      </div>
                    )}
                    {operationalCosts.cardFeeAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa Maquininha ({settings.card_fee_percentage}%)</span>
                        <span className="font-medium">{formatCurrency(operationalCosts.cardFeeAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                      <span>Subtotal</span>
                      <span className="text-orange-500">{formatCurrency(salesCost)}</span>
                    </div>
                  </div>
                )}

                {/* C) Custos Fixos */}
                {fixedCost > 0 && (
                  <div className="rounded-xl border p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <AppIcon name="Building2" className="h-4 w-4 text-primary" />
                      Custos Fixos
                      <span className="text-[10px] text-muted-foreground font-normal ml-auto">somente leitura</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Rateio ({formatCurrency(operationalCosts.monthlyFixedCost)}/mês)
                      </span>
                      <span className="font-medium">{formatCurrency(fixedCost)}</span>
                    </div>
                  </div>
                )}

                {/* Total Cost */}
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Custo Total por Porção</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(totalCostPerPortion)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Ingredientes + embalagem + vendas + fixos
                  </p>
                </div>
              </div>

              <Separator />

              {/* ═══ MARGIN SIMULATOR ═══ */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AppIcon name="TrendingUp" className="h-4 w-4 text-primary" />
                  <Label className="text-base font-semibold">Simulador de Preço</Label>
                </div>

                <div className="rounded-xl border p-4 space-y-4">
                  {/* Margin Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Margem desejada</Label>
                      <span className={cn(
                        "text-lg font-bold",
                        isNegativeMargin ? "text-destructive" : isLowMargin ? "text-amber-500" : "text-primary"
                      )}>
                        {Math.round(effectiveMargin)}%
                      </span>
                    </div>
                    <Slider
                      value={[marginPercent]}
                      onValueChange={handleMarginChange}
                      min={0}
                      max={90}
                      step={1}
                      className="py-2"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0%</span>
                      <span>30%</span>
                      <span>50%</span>
                      <span>70%</span>
                      <span>90%</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Selling Price Input */}
                  <div className="space-y-2">
                    <Label className="text-sm">Preço de venda</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-sm">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={sellingPrice}
                        onChange={(e) => handleSellingPriceChange(e.target.value)}
                        className="h-10"
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  {/* Margin Alerts */}
                  {isNegativeMargin && (
                    <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg text-xs text-destructive">
                      <AppIcon name="AlertTriangle" className="h-3.5 w-3.5 shrink-0" />
                      Preço abaixo do custo! Você terá prejuízo neste produto.
                    </div>
                  )}
                  {isLowMargin && !isNegativeMargin && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-xs text-amber-600 dark:text-amber-400">
                      <AppIcon name="AlertTriangle" className="h-3.5 w-3.5 shrink-0" />
                      Margem baixa. Considere revisar custos ou ajustar o preço.
                    </div>
                  )}

                  {/* Profit Summary */}
                  {totalCostPerPortion > 0 && (parseFloat(sellingPrice) || 0) > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lucro por porção</span>
                        <span className={cn(
                          "font-semibold",
                          (parseFloat(sellingPrice) || 0) - totalCostPerPortion < 0 ? "text-destructive" : "text-primary"
                        )}>
                          {formatCurrency((parseFloat(sellingPrice) || 0) - totalCostPerPortion)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Modo de preparo, dicas..."
                  rows={4}
                />
              </div>
            </div>
          </ScrollArea>

          {/* Sticky Footer */}
          {ingredients.length > 0 && (
            <div className="border-t bg-background p-4 shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Custo/porção</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(totalCostPerPortion)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Preço sugerido ({marginPercent}%)</p>
                  <p className={cn(
                    "text-lg font-bold",
                    suggestedPrice > 0 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {suggestedPrice > 0 ? formatCurrency(suggestedPrice) : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <IngredientPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        items={inventoryItems}
        subRecipes={subRecipes}
        excludeIds={ingredients.filter(i => i.source_type === 'inventory' && i.item_id).map((i) => i.item_id!)}
        excludeRecipeIds={[...(recipe?.id ? [recipe.id] : []), ...ingredients.filter(i => i.source_type === 'recipe' && i.source_recipe_id).map((i) => i.source_recipe_id!)]}
        onSelectItem={handleAddInventoryItem}
        onSelectSubRecipe={handleAddSubRecipe}
      />
    </>
  );
}
