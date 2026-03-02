import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import type { MenuCategory, MenuGroup } from '@/hooks/useMenuAdmin';

const MENU_ICONS = [
  'restaurant', 'lunch_dining', 'local_pizza', 'ramen_dining', 'bakery_dining',
  'icecream', 'cake', 'coffee', 'local_bar', 'sports_bar',
  'emoji_food_beverage', 'set_meal', 'kebab_dining', 'rice_bowl', 'tapas',
  'brunch_dining', 'dinner_dining', 'liquor', 'fastfood', 'local_cafe',
  'cookie', 'egg_alt', 'skillet', 'soup_kitchen', 'takeout_dining',
  'grocery', 'nutrition', 'water_drop', 'wine_bar', 'nightlife',
  'local_fire_department', 'outdoor_grill', 'blender', 'oven',
  'kitchen', 'flatware', 'no_food', 'shopping_basket', 'storefront',
  'delivery_dining', 'ac_unit', 'favorite', 'star', 'category',
];

function CategoryIconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search) return MENU_ICONS;
    return MENU_ICONS.filter(i => i.includes(search.toLowerCase()));
  }, [search]);

  return (
    <div className="space-y-2">
      <Label>Ícone</Label>
      <Input
        placeholder="Buscar ícone..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-2"
      />
      <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto rounded-xl border border-border/40 p-2 bg-secondary/20">
        {filtered.map(icon => (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            className={cn(
              "flex items-center justify-center p-2 rounded-lg transition-colors",
              value === icon
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary/60 text-muted-foreground"
            )}
            title={icon}
          >
            <AppIcon name={icon} size={22} />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-6 text-xs text-muted-foreground text-center py-2">Nenhum ícone encontrado</p>
        )}
      </div>
    </div>
  );
}

interface Props {
  categories: MenuCategory[];
  groups: MenuGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onSaveCategory: (cat: Partial<MenuCategory> & { name: string }) => void;
  onDeleteCategory: (id: string) => void;
  onSaveGroup: (grp: Partial<MenuGroup> & { name: string; category_id: string }) => void;
  onDeleteGroup: (id: string) => void;
  getProductCount: (groupId: string) => number;
  renderGroupContent?: (groupId: string) => React.ReactNode;
}

export function MenuCategoryTree({
  categories, groups, selectedGroupId,
  onSelectGroup, onSaveCategory, onDeleteCategory,
  onSaveGroup, onDeleteGroup, getProductCount, renderGroupContent,
}: Props) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<MenuCategory>>({});
  const [grpDialog, setGrpDialog] = useState(false);
  const [editingGrp, setEditingGrp] = useState<Partial<MenuGroup> & { category_id?: string }>({});

  const toggleCat = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openNewCategory = () => {
    setEditingCat({ name: '', icon: 'UtensilsCrossed', color: 'hsl(var(--primary))', is_active: true });
    setCatDialog(true);
  };

  const openEditCategory = (cat: MenuCategory) => {
    setEditingCat(cat);
    setCatDialog(true);
  };

  const handleSaveCat = () => {
    if (!editingCat.name) return;
    onSaveCategory(editingCat as any);
    setCatDialog(false);
  };

  const openNewGroup = (categoryId: string) => {
    setEditingGrp({ name: '', category_id: categoryId, is_active: true, availability: { tablet: true, delivery: true } });
    setGrpDialog(true);
  };

  const openEditGroup = (grp: MenuGroup) => {
    setEditingGrp(grp);
    setGrpDialog(true);
  };

  const handleSaveGrp = () => {
    if (!editingGrp.name || !editingGrp.category_id) return;
    onSaveGroup(editingGrp as any);
    setGrpDialog(false);
  };

  if (categories.length === 0) {
    return (
      <div className="card-base p-5">
        <div className="empty-state py-6">
          <div className="icon-glow icon-glow-lg icon-glow-muted mx-auto mb-3">
            <AppIcon name="Package" size={24} />
          </div>
          <p className="empty-state-title">Nenhuma categoria</p>
          <p className="empty-state-text mb-4">Comece criando sua primeira categoria de produtos</p>
          <Button size="sm" onClick={openNewCategory}>
            <AppIcon name="Plus" size={16} className="mr-1.5" /> Nova Categoria
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Add category button */}
      <button
        onClick={openNewCategory}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-primary transition-all active:scale-[0.97] bg-primary/[0.06] border border-dashed border-primary/20 hover:bg-primary/[0.1]"
      >
        <AppIcon name="Plus" size={16} /> Nova Categoria
      </button>

      {categories.map(cat => {
        const expanded = expandedCats.has(cat.id);
        const catGroups = groups.filter(g => g.category_id === cat.id);

        return (
          <div key={cat.id} className="card-base overflow-hidden">
            {/* Category header */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleCat(cat.id)}
                className="flex-1 flex items-center gap-2.5 px-3.5 py-3 text-sm font-semibold transition-all"
              >
                <div className="icon-glow icon-glow-sm icon-glow-primary">
                  <AppIcon name={cat.icon || 'Package'} size={16} />
                </div>
                <span className="flex-1 text-left text-foreground">{cat.name}</span>
                <span className="text-[10px] text-muted-foreground mr-1">{catGroups.length} grupos</span>
                <AppIcon
                  name="ChevronDown"
                  size={14}
                  className={cn(
                    "text-muted-foreground transition-transform duration-200",
                    !expanded && "-rotate-90"
                  )}
                />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-lg hover:bg-secondary/60 mr-1">
                    <AppIcon name="MoreVertical" size={14} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openNewGroup(cat.id)}>
                    <AppIcon name="Plus" size={14} className="mr-2" /> Novo Grupo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEditCategory(cat)}>
                    <AppIcon name="Pencil" size={14} className="mr-2" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteCategory(cat.id)} className="text-destructive">
                    <AppIcon name="Trash2" size={14} className="mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {expanded && (
              <div className="px-3 pb-3 space-y-1">
                <div className="h-px bg-border/30 mb-2" />
                {catGroups.map(grp => {
                  const count = getProductCount(grp.id);
                  const isSelected = selectedGroupId === grp.id;
                  const avail = grp.availability as any;
                  const isAvailable = grp.is_active !== false && (avail?.tablet || avail?.delivery);
                  return (
                    <div key={grp.id}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onSelectGroup(grp.id)}
                          className={cn(
                            "flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98]",
                            isSelected
                              ? "finance-hero-card text-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent"
                          )}
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: isAvailable ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}
                          />
                          <span className="flex-1 text-left truncate">{grp.name}</span>
                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSaveGroup({ ...grp, availability: { ...avail, tablet: !avail?.tablet } });
                              }}
                              className={cn(
                                "text-[8px] px-1.5 py-0.5 rounded-full font-semibold transition-colors",
                                avail?.tablet ? "bg-success/15 text-success" : "bg-muted text-muted-foreground/50 line-through"
                              )}
                            >Mesa</button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSaveGroup({ ...grp, availability: { ...avail, delivery: !avail?.delivery } });
                              }}
                              className={cn(
                                "text-[8px] px-1.5 py-0.5 rounded-full font-semibold transition-colors",
                                avail?.delivery ? "bg-success/15 text-success" : "bg-muted text-muted-foreground/50 line-through"
                              )}
                            >Delivery</button>
                            <span className="text-[10px] text-muted-foreground font-medium">{count}</span>
                          </div>
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-lg hover:bg-secondary/60">
                              <AppIcon name="MoreVertical" size={12} className="text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditGroup(grp)}>
                              <AppIcon name="Pencil" size={14} className="mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteGroup(grp.id)} className="text-destructive">
                              <AppIcon name="Trash2" size={14} className="mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {isSelected && renderGroupContent && (
                        <div className="mt-2 mb-1">
                          {renderGroupContent(grp.id)}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={() => openNewGroup(cat.id)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-primary hover:bg-primary/5 rounded-xl transition-all w-full active:scale-[0.98]"
                >
                  <AppIcon name="Plus" size={12} /> Adicionar grupo
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Category Sheet */}
      <Sheet open={catDialog} onOpenChange={setCatDialog}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{editingCat.id ? 'Editar Categoria' : 'Nova Categoria'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome</Label>
              <Input value={editingCat.name || ''} onChange={e => setEditingCat({ ...editingCat, name: e.target.value })} />
            </div>
            <CategoryIconPicker
              value={editingCat.icon || ''}
              onChange={(icon) => setEditingCat({ ...editingCat, icon })}
            />
          </div>
          <SheetFooter className="flex-row gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setCatDialog(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSaveCat} disabled={!editingCat.name}>Salvar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Group Sheet */}
      <Sheet open={grpDialog} onOpenChange={setGrpDialog}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{editingGrp.id ? 'Editar Grupo' : 'Novo Grupo'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome</Label>
              <Input value={editingGrp.name || ''} onChange={e => setEditingGrp({ ...editingGrp, name: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={editingGrp.description || ''} onChange={e => setEditingGrp({ ...editingGrp, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Disponível no Tablet (Mesa)</Label>
              <Switch
                checked={(editingGrp.availability as any)?.tablet ?? true}
                onCheckedChange={v => setEditingGrp({ ...editingGrp, availability: { ...(editingGrp.availability as any), tablet: v } })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Disponível no Delivery</Label>
              <Switch
                checked={(editingGrp.availability as any)?.delivery ?? true}
                onCheckedChange={v => setEditingGrp({ ...editingGrp, availability: { ...(editingGrp.availability as any), delivery: v } })}
              />
            </div>
          </div>
          <SheetFooter className="flex-row gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setGrpDialog(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSaveGrp} disabled={!editingGrp.name}>Salvar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}