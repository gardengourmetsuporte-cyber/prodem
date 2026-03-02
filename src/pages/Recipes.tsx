import { useState, useMemo } from 'react';
import { useScrollToTopOnChange } from '@/components/ScrollToTop';
import { createPortal } from 'react-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { useFabAction } from '@/contexts/FabActionContext';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeSheet } from '@/components/recipes/RecipeSheet';
import { useRecipes } from '@/hooks/useRecipes';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, type Recipe } from '@/types/recipe';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Recipes() {
  const { isAdmin } = useAuth();
  const {
    recipes, categories, inventoryItems, isLoading,
    addRecipe, updateRecipe, toggleActive, duplicateRecipe, deleteRecipe,
    isAddingRecipe, isUpdatingRecipe, getAvailableSubRecipes,
    reorderCategories, updateItemPrice, updateItemUnit,
  } = useRecipes();

  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('produtos');
  useScrollToTopOnChange(activeTab);
  const [preSelectedCategoryId, setPreSelectedCategoryId] = useState<string | null>(null);

  const basesCategory = useMemo(() => {
    return categories.find(c => c.name.toLowerCase().includes('bases') || c.name.toLowerCase().includes('preparo'));
  }, [categories]);

  const { productRecipes, baseRecipes, groupedRecipes } = useMemo(() => {
    const basesCategoryId = basesCategory?.id;
    const products = recipes.filter(r => r.category_id !== basesCategoryId && r.name.toLowerCase().includes(search.toLowerCase()));
    const bases = recipes.filter(r => r.category_id === basesCategoryId && r.name.toLowerCase().includes(search.toLowerCase()));
    const recipesToGroup = activeTab === 'produtos' ? products : bases;

    const groups: Record<string, { category: typeof categories[0] | null; recipes: Recipe[] }> = {};
    recipesToGroup.forEach((recipe) => {
      const catId = recipe.category_id || 'sem-categoria';
      if (!groups[catId]) groups[catId] = { category: recipe.category || null, recipes: [] };
      groups[catId].recipes.push(recipe);
    });

    const grouped = Object.entries(groups).sort((a, b) => (a[1].category?.sort_order ?? 999) - (b[1].category?.sort_order ?? 999));
    return { productRecipes: products, baseRecipes: bases, groupedRecipes: grouped };
  }, [recipes, search, basesCategory, activeTab]);

  const stats = useMemo(() => {
    const active = recipes.filter(r => r.is_active);
    const inactive = recipes.filter(r => !r.is_active);
    const avgCost = active.length > 0 ? active.reduce((sum, r) => sum + r.cost_per_portion, 0) / active.length : 0;
    return { total: recipes.length, avgCost, inactive: inactive.length };
  }, [recipes]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleEdit = (recipe: Recipe) => { setSelectedRecipe(recipe); setSheetOpen(true); };
  const handleCreate = () => {
    setSelectedRecipe(null);
    setPreSelectedCategoryId(activeTab === 'bases' && basesCategory ? basesCategory.id : null);
    setSheetOpen(true);
  };

  useFabAction({ icon: 'Plus', label: 'Nova Ficha', onClick: () => { setSelectedRecipe(null); setPreSelectedCategoryId(null); setSheetOpen(true); } }, []);

  const handleSave = async (data: any) => {
    if (data.id) await updateRecipe(data);
    else await addRecipe(data);
  };

  const handleDeleteConfirm = () => {
    if (recipeToDelete) {
      deleteRecipe(recipeToDelete);
      setRecipeToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Acesso restrito a gestores.</p>
        </div>
      </AppLayout>
    );
  }

  const RecipeListContent = () => (
    <>
      <div className="relative mb-4">
        <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={activeTab === 'bases' ? 'Buscar bases e preparos...' : 'Buscar receitas...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : groupedRecipes.length === 0 ? (
        <EmptyState
          icon="ChefHat"
          title={activeTab === 'bases' ? 'Nenhuma base cadastrada' : 'Nenhuma ficha técnica ainda'}
          subtitle={activeTab === 'bases' ? 'Bases são preparos reutilizáveis em outras receitas.' : 'Crie fichas técnicas para controlar o custo dos seus pratos.'}
          actionLabel={activeTab === 'bases' ? 'Criar primeira base' : 'Criar ficha técnica'}
          actionIcon="Plus"
          onAction={handleCreate}
          accent="primary"
        />
      ) : (
        <div className="space-y-3">
          {groupedRecipes.map(([catId, group], index) => (
            <Collapsible
              key={catId}
              open={expandedCategories.has(catId) || search.length > 0}
              onOpenChange={() => toggleCategory(catId)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <AppIcon
                  name="ChevronDown"
                  size={16}
                  className={cn(
                    "text-muted-foreground transition-transform duration-200",
                    (expandedCategories.has(catId) || search.length > 0) && "rotate-180"
                  )}
                />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.category?.color || '#6b7280' }} />
                <span className="font-semibold font-display">{group.category?.name || 'Sem categoria'}</span>
                <span className="text-sm text-muted-foreground ml-auto">({group.recipes.length})</span>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="space-y-2 mt-2 ml-2">
                  {group.recipes.map((recipe, idx) => (
                    <div key={recipe.id} className="animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                      <RecipeCard
                        recipe={recipe}
                        onEdit={handleEdit}
                        onDuplicate={duplicateRecipe}
                        onToggleActive={(id, active) => toggleActive({ id, is_active: active })}
                        onDelete={(id) => { setRecipeToDelete(id); setDeleteDialogOpen(true); }}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
    </>
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border bg-card p-3">
              <div className="flex flex-col items-center text-center gap-1">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AppIcon name="ChefHat" size={18} className="text-primary" />
                </div>
                <p className="text-xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>{stats.total}</p>
                <p className="text-[10px] text-muted-foreground">Receitas</p>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-3">
              <div className="flex flex-col items-center text-center gap-1">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AppIcon name="DollarSign" size={18} className="text-primary" />
                </div>
                <p className="text-lg font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>{formatCurrency(stats.avgCost)}</p>
                <p className="text-[10px] text-muted-foreground">Custo Médio</p>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-3">
              <div className="flex flex-col items-center text-center gap-1">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                  <AppIcon name="Archive" size={18} className="text-muted-foreground" />
                </div>
                <p className="text-xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>{stats.inactive}</p>
                <p className="text-[10px] text-muted-foreground">Inativas</p>
              </div>
            </div>
          </div>

          {/* Animated Tabs */}
          <AnimatedTabs
            tabs={[
              { key: 'produtos', label: 'Produtos', icon: <AppIcon name="ChefHat" size={16} />, badge: productRecipes.length },
              { key: 'bases', label: 'Bases', icon: <span>🍲</span>, badge: baseRecipes.length },
            ]}
            activeTab={activeTab}
            onTabChange={(key) => setActiveTab(key)}
          />

          <div className="animate-fade-in" key={activeTab}>
            <RecipeListContent />
          </div>
        </div>

      </div>

      <RecipeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        recipe={selectedRecipe}
        categories={categories}
        inventoryItems={inventoryItems}
        defaultCategoryId={preSelectedCategoryId}
        subRecipes={getAvailableSubRecipes(selectedRecipe?.id).map(r => ({
          id: r.id, name: r.name, yield_unit: r.yield_unit, cost_per_portion: r.cost_per_portion,
          category: r.category ? { id: r.category.id, name: r.category.name, color: r.category.color } : null,
        }))}
        onSave={handleSave}
        isSaving={isAddingRecipe || isUpdatingRecipe}
        onUpdateItemPrice={async (itemId, price) => { await updateItemPrice({ itemId, price }); }}
        onUpdateItemUnit={async (itemId, unitType) => { await updateItemUnit({ itemId, unitType }); }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ficha técnica?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
