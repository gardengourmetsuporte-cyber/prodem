import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Switch } from '@/components/ui/switch';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChecklistSector, ChecklistSubcategory, ChecklistItem, ItemFrequency, ChecklistType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ListPicker, ListPickerItem } from '@/components/ui/list-picker';
import { cn } from '@/lib/utils';
import { getPointsColors, clampPoints, getBonusPointsColors } from '@/lib/points';

// Fallback icon based on sector name when icon field is null/Folder
const sectorNameIconMap: Record<string, string> = {
  'cozinha': 'restaurant',
  'salão': 'storefront',
  'salao': 'storefront',
  'caixa': 'payments',
  'banheiro': 'bathtub',
  'banheiros': 'bathtub',
  'geral': 'checklist',
  'produção': 'precision_manufacturing',
  'producao': 'precision_manufacturing',
  'estoque': 'inventory_2',
  'limpeza': 'cleaning_services',
  'atendimento': 'support_agent',
};

function getSectorIcon(sector: { icon?: string | null; name: string }): string {
  if (sector.icon && sector.icon !== 'Folder') return sector.icon;
  const key = sector.name.toLowerCase().trim();
  return sectorNameIconMap[key] || 'folder';
}

const colorOptions = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

const sectorIconOptions = [
  'Folder', 'Bath', 'Utensils', 'ChefHat', 'Coffee', 'Sofa',
  'Package', 'ClipboardCheck', 'Wrench', 'Droplets', 'Star',
  'Zap', 'Sparkles', 'Store', 'ShoppingCart', 'Briefcase',
  'Heart', 'Shield', 'Settings', 'Leaf',
];

const frequencyOptions: { value: ItemFrequency; label: string; iconName: string }[] = [
  { value: 'daily', label: 'Diária', iconName: 'calendar_today' },
  { value: 'weekly', label: 'Semanal', iconName: 'date_range' },
  { value: 'monthly', label: 'Mensal', iconName: 'calendar_month' },
];

const checklistTypeOptions: { value: ChecklistType; label: string; iconName: string }[] = [
  { value: 'abertura', label: 'Abertura', iconName: 'wb_sunny' },
  { value: 'fechamento', label: 'Fechamento', iconName: 'dark_mode' },
  { value: 'bonus', label: 'Bônus', iconName: 'bolt' },
];

const pointsOptions = [
  { value: 0, label: 'Sem pontos' },
  { value: 1, label: '1 ponto' },
  { value: 2, label: '2 pontos' },
  { value: 3, label: '3 pontos' },
  { value: 4, label: '4 pontos' },
];

const bonusPointsOptions = [
  { value: 1, label: '1 ponto' },
  { value: 2, label: '2 pontos' },
  { value: 3, label: '3 pontos' },
  { value: 4, label: '4 pontos' },
  { value: 5, label: '5 pontos' },
  { value: 10, label: '10 pontos' },
  { value: 15, label: '15 pontos' },
  { value: 20, label: '20 pontos' },
];

function getPointsToneStyle(points: number): React.CSSProperties {
  if (!points) return { color: 'hsl(var(--muted-foreground))' };
  const colors = getPointsColors(points);
  return { color: colors.color };
}

interface ChecklistSettingsProps {
  sectors: ChecklistSector[];
  selectedType: ChecklistType;
  onTypeChange: (type: ChecklistType) => void;
  onAddSector: (data: { name: string; color: string; icon?: string }) => Promise<void>;
  onUpdateSector: (id: string, data: { name?: string; color?: string; icon?: string }) => Promise<void>;
  onDeleteSector: (id: string) => Promise<void>;
  onReorderSectors?: (orderedIds: string[]) => Promise<void>;
  onAddSubcategory: (data: { sector_id: string; name: string }) => Promise<void>;
  onUpdateSubcategory: (id: string, data: { name?: string }) => Promise<void>;
  onDeleteSubcategory: (id: string) => Promise<void>;
  onReorderSubcategories?: (sectorId: string, orderedIds: string[]) => Promise<void>;
  onAddItem: (data: { subcategory_id: string; name: string; description?: string; frequency?: ItemFrequency; checklist_type?: ChecklistType; points?: number; requires_photo?: boolean }) => Promise<void>;
  onUpdateItem: (id: string, data: { name?: string; description?: string; is_active?: boolean; frequency?: ItemFrequency; checklist_type?: ChecklistType; points?: number; requires_photo?: boolean }) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onReorderItems?: (subcategoryId: string, orderedIds: string[]) => Promise<void>;
}

// Sortable Item Component - drag via long-press on entire item
function SortableItem({ 
  id, 
  children, 
  className 
}: { 
  id: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
    ...(isDragging && {
      scale: '1.02',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      borderRadius: '16px',
      opacity: 0.95,
    }),
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={className}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export function ChecklistSettings({
  sectors,
  selectedType,
  onTypeChange,
  onAddSector,
  onUpdateSector,
  onDeleteSector,
  onReorderSectors,
  onAddSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory,
  onReorderSubcategories,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
}: ChecklistSettingsProps) {
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  
  // Sheet states
  const [sectorSheetOpen, setSectorSheetOpen] = useState(false);
  const [subcategorySheetOpen, setSubcategorySheetOpen] = useState(false);
  const [itemSheetOpen, setItemSheetOpen] = useState(false);
  const [freqPickerOpen, setFreqPickerOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [pointsPickerOpen, setPointsPickerOpen] = useState(false);
  
  // Editing states
  const [editingSector, setEditingSector] = useState<ChecklistSector | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<ChecklistSubcategory | null>(null);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  
  // Form states
  const [sectorName, setSectorName] = useState('');
  const [sectorColor, setSectorColor] = useState('#3668b5');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [sectorIcon, setSectorIcon] = useState('Folder');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemFrequency, setItemFrequency] = useState<ItemFrequency>('daily');
  const [itemChecklistType, setItemChecklistType] = useState<ChecklistType>('abertura');
  const [itemPoints, setItemPoints] = useState<number>(1);
  const [itemRequiresPhoto, setItemRequiresPhoto] = useState(false);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getFrequencyLabel = (freq: ItemFrequency) => {
    return frequencyOptions.find(f => f.value === freq)?.label || 'Diária';
  };

  const getChecklistTypeLabel = (type: ChecklistType) => {
    return checklistTypeOptions.find(t => t.value === type)?.label || 'Abertura';
  };

  const getChecklistTypeIconName = (type: ChecklistType) => {
    switch (type) {
      case 'abertura': return 'wb_sunny';
      case 'fechamento': return 'dark_mode';
      default: return 'wb_sunny';
    }
  };

  const toggleSector = (sectorId: string) => {
    setExpandedSectors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectorId)) {
        newSet.delete(sectorId);
      } else {
        newSet.add(sectorId);
      }
      return newSet;
    });
  };

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subcategoryId)) {
        newSet.delete(subcategoryId);
      } else {
        newSet.add(subcategoryId);
      }
      return newSet;
    });
  };

  // Drag handlers
  const handleSectorDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorderSectors) {
      const oldIndex = sectors.findIndex(s => s.id === active.id);
      const newIndex = sectors.findIndex(s => s.id === over.id);
      const newOrder = arrayMove(sectors, oldIndex, newIndex);
      await onReorderSectors(newOrder.map(s => s.id));
    }
  };

  const handleSubcategoryDragEnd = async (sectorId: string, subcategories: ChecklistSubcategory[], event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorderSubcategories) {
      const oldIndex = subcategories.findIndex(s => s.id === active.id);
      const newIndex = subcategories.findIndex(s => s.id === over.id);
      const newOrder = arrayMove(subcategories, oldIndex, newIndex);
      await onReorderSubcategories(sectorId, newOrder.map(s => s.id));
    }
  };

  const handleItemDragEnd = async (subcategoryId: string, items: ChecklistItem[], event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorderItems) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);
      await onReorderItems(subcategoryId, newOrder.map(i => i.id));
    }
  };

  // Sector handlers
  const handleOpenSectorSheet = (sector?: ChecklistSector) => {
    if (sector) {
      setEditingSector(sector);
      setSectorName(sector.name);
      setSectorColor(sector.color);
      setSectorIcon(sector.icon || 'Folder');
    } else {
      setEditingSector(null);
      setSectorName('');
      setSectorColor('#3668b5');
      setSectorIcon('Folder');
    }
    setSectorSheetOpen(true);
  };

  const handleSaveSector = async () => {
    if (!sectorName.trim()) return;

    if (editingSector) {
      await onUpdateSector(editingSector.id, { name: sectorName.trim(), color: sectorColor, icon: sectorIcon });
    } else {
      await onAddSector({ name: sectorName.trim(), color: sectorColor, icon: sectorIcon });
    }
    setSectorSheetOpen(false);
  };

  // Subcategory handlers
  const handleOpenSubcategorySheet = (sectorId: string, subcategory?: ChecklistSubcategory) => {
    setSelectedSectorId(sectorId);
    if (subcategory) {
      setEditingSubcategory(subcategory);
      setSubcategoryName(subcategory.name);
    } else {
      setEditingSubcategory(null);
      setSubcategoryName('');
    }
    setSubcategorySheetOpen(true);
  };

  const handleSaveSubcategory = async () => {
    if (!subcategoryName.trim() || !selectedSectorId) return;

    if (editingSubcategory) {
      await onUpdateSubcategory(editingSubcategory.id, { name: subcategoryName.trim() });
    } else {
      await onAddSubcategory({ sector_id: selectedSectorId, name: subcategoryName.trim() });
    }
    setSubcategorySheetOpen(false);
  };

  // Item handlers
  const handleOpenItemSheet = (subcategoryId: string, item?: ChecklistItem) => {
    setSelectedSubcategoryId(subcategoryId);
    if (item) {
      setEditingItem(item);
      setItemName(item.name || '');
      setItemDescription(item.description || '');
      setItemFrequency(item.frequency || 'daily');
      setItemChecklistType(item.checklist_type || selectedType);
      setItemPoints(item.points ?? 1);
      setItemRequiresPhoto((item as any).requires_photo ?? false);
    } else {
      setEditingItem(null);
      setItemName('');
      setItemDescription('');
      setItemFrequency('daily');
      // Use selected type as default for new items
      setItemChecklistType(selectedType);
      setItemPoints(selectedType === 'bonus' ? 5 : 1);
      setItemRequiresPhoto(false);
    }
    setItemSheetOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemName.trim()) return;

    if (editingItem) {
      await onUpdateItem(editingItem.id, {
        name: itemName.trim(),
        description: itemDescription.trim() || undefined,
        frequency: itemFrequency,
        checklist_type: itemChecklistType,
        points: itemPoints,
        requires_photo: itemRequiresPhoto,
      });
    } else if (selectedSubcategoryId) {
      await onAddItem({
        subcategory_id: selectedSubcategoryId,
        name: itemName.trim(),
        description: itemDescription.trim() || undefined,
        frequency: itemFrequency,
        checklist_type: itemChecklistType,
        points: itemPoints,
        requires_photo: itemRequiresPhoto,
      });
    }
    setItemSheetOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Add Sector Button */}
      <Button
        onClick={() => handleOpenSectorSheet()}
        className="w-full gap-2"
        variant="outline"
      >
        <AppIcon name="add" size={16} />
        Novo Setor
      </Button>

      {/* Sectors List with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectorDragEnd}
      >
        <SortableContext items={sectors.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sectors.map(sector => {
            const isExpanded = expandedSectors.has(sector.id);
            const isBonusMode = selectedType === 'bonus';

            return (
              <SortableItem key={sector.id} id={sector.id} className="bg-card rounded-xl border overflow-hidden mb-4">
                <div className="flex-1">
                  {/* Sector Header */}
                  <div className="flex items-center gap-1 p-3 bg-secondary/30 overflow-hidden">
                    <button
                      onClick={() => toggleSector(sector.id)}
                      className="flex-1 flex items-center gap-2 min-w-0"
                    >
                      <div
                        className="w-[3px] self-stretch rounded-full shrink-0"
                        style={{ backgroundColor: sector.color }}
                      />
                      <AppIcon name={getSectorIcon(sector)} size={16} fill={0} className="text-muted-foreground shrink-0" />
                      <span className="font-semibold text-foreground truncate text-sm">{sector.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                        {!isBonusMode
                          ? `(${sector.subcategories?.length || 0})`
                          : `(${sector.subcategories?.flatMap(s => s.items || []).filter(i => i.checklist_type === 'bonus').length || 0})`
                        }
                      </span>
                    </button>
                    <div className="flex items-center shrink-0">
                      {!isBonusMode && (
                        <button
                          onClick={() => handleOpenSubcategorySheet(sector.id)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary"
                          title="Adicionar subcategoria"
                        >
                          <AppIcon name="add" size={14} />
                        </button>
                      )}
                      {isBonusMode && (
                        <button
                          onClick={() => {
                            const defaultSub = sector.subcategories?.[0];
                            if (defaultSub) {
                              handleOpenItemSheet(defaultSub.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary"
                          title="Adicionar tarefa"
                        >
                          <AppIcon name="add" size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenSectorSheet(sector)}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                      >
                        <AppIcon name="edit" size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteSector(sector.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <AppIcon name="delete" size={14} />
                      </button>
                      <button onClick={() => toggleSector(sector.id)} className="p-1">
                        {isExpanded ? (
                          <AppIcon name="expand_more" size={14} className="text-muted-foreground" />
                        ) : (
                          <AppIcon name="chevron_right" size={14} className="text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Content when expanded */}
                  {isExpanded && (
                    <div className="p-2 space-y-2">
                      {isBonusMode ? (
                        /* BONUS: Items directly under sector, no subcategory UI */
                        (() => {
                          const allBonusItems = sector.subcategories?.flatMap(sub => 
                            (sub.items || []).filter(i => i.checklist_type === 'bonus').map(item => ({ ...item, _subcategoryId: sub.id }))
                          ) || [];
                          
                          if (allBonusItems.length === 0) {
                            return (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhuma tarefa bônus. Clique em + para adicionar.
                              </p>
                            );
                          }

                          return (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
                              // All bonus items share the first subcategory for reorder purposes
                              const subcatId = sector.subcategories?.[0]?.id;
                              if (subcatId) handleItemDragEnd(subcatId, allBonusItems, e);
                            }}>
                              <SortableContext items={allBonusItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-1.5">
                                  {allBonusItems.map(item => {
                                    const pointsColors = getBonusPointsColors(item.points);
                                    return (
                                      <SortableItem key={item.id} id={item.id} className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                        item.is_active 
                                          ? "bg-card/80 border-border/50 hover:border-border" 
                                          : "bg-muted/30 border-border/30 opacity-60"
                                      )}>
                                        {/* Points badge */}
                                        <div 
                                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold border"
                                          style={{
                                            backgroundColor: item.points > 0 ? pointsColors.bg : undefined,
                                            color: item.points > 0 ? pointsColors.color : undefined,
                                            borderColor: item.points > 0 ? pointsColors.border : undefined,
                                          }}
                                        >
                                          {item.points > 0 ? (
                                            <span className="flex items-center gap-0.5"><AppIcon name="bolt" size={12} />{item.points}</span>
                                          ) : (
                                            <span className="text-muted-foreground">—</span>
                                          )}
                                        </div>

                                        {/* Name + freq */}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                                          <p className="text-[11px] text-muted-foreground">{getFrequencyLabel(item.frequency || 'daily')}</p>
                                        </div>

                                        {/* Compact actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={() => onUpdateItem(item.id, { is_active: !item.is_active })}
                                            className={cn(
                                              "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                                              item.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                                            )}
                                            title={item.is_active ? 'Desativar' : 'Ativar'}
                                          >
                                          {item.is_active ? <AppIcon name="check" size={14} /> : <AppIcon name="close" size={14} />}
                                          </button>
                                          <button
                                            onClick={() => handleOpenItemSheet((item as any)._subcategoryId, item)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                                            title="Editar"
                                          >
                                            <AppIcon name="edit" size={14} />
                                          </button>
                                          <button
                                            onClick={() => onDeleteItem(item.id)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                            title="Excluir"
                                          >
                                            <AppIcon name="delete" size={14} />
                                          </button>
                                        </div>
                                      </SortableItem>
                                    );
                                  })}
                                </div>
                              </SortableContext>
                            </DndContext>
                          );
                        })()
                      ) : (
                        /* STANDARD: Subcategories with items */
                        <>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleSubcategoryDragEnd(sector.id, sector.subcategories || [], e)}
                          >
                            <SortableContext 
                              items={(sector.subcategories || []).map(s => s.id)} 
                              strategy={verticalListSortingStrategy}
                            >
                              {sector.subcategories?.map(subcategory => {
                                const isSubExpanded = expandedSubcategories.has(subcategory.id);

                                return (
                                  <SortableItem 
                                    key={subcategory.id} 
                                    id={subcategory.id}
                                    className="bg-secondary/20 rounded-lg overflow-hidden"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-1 p-2 overflow-hidden">
                                        <button
                                          onClick={() => toggleSubcategory(subcategory.id)}
                                          className="flex-1 flex items-center gap-1.5 min-w-0"
                                        >
                                          <span className="font-medium text-foreground text-sm truncate">{subcategory.name}</span>
                                          <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                                            ({(subcategory.items || []).filter(i => i.checklist_type === selectedType).length})
                                          </span>
                                        </button>
                                        <div className="flex items-center shrink-0">
                                          <button onClick={() => handleOpenItemSheet(subcategory.id)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-primary" title="Adicionar item"><AppIcon name="add" size={12} /></button>
                                          <button onClick={() => handleOpenSubcategorySheet(sector.id, subcategory)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><AppIcon name="edit" size={12} /></button>
                                          <button onClick={() => onDeleteSubcategory(subcategory.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><AppIcon name="delete" size={12} /></button>
                                          <button onClick={() => toggleSubcategory(subcategory.id)} className="p-1">
                                            {isSubExpanded ? <AppIcon name="expand_more" size={12} className="text-muted-foreground" /> : <AppIcon name="chevron_right" size={12} className="text-muted-foreground" />}
                                          </button>
                                        </div>
                                      </div>

                                      {isSubExpanded && subcategory.items && (() => {
                                        const filteredItems = subcategory.items.filter(item => item.checklist_type === selectedType);
                                        if (filteredItems.length === 0) {
                                          return (
                                            <div className="px-2 pb-2">
                                              <p className="text-xs text-muted-foreground text-center py-2">
                                                Nenhum item de {selectedType === 'abertura' ? 'abertura' : 'fechamento'} nesta subcategoria
                                              </p>
                                            </div>
                                          );
                                        }
                                        return (
                                          <div className="px-2 pb-2 space-y-1.5">
                                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleItemDragEnd(subcategory.id, filteredItems, e)}>
                                              <SortableContext items={filteredItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                                {filteredItems.map(item => {
                                                  const pointsColors = getPointsColors(item.points);
                                                  return (
                                                    <SortableItem key={item.id} id={item.id} className={cn(
                                                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                                      item.is_active
                                                        ? "bg-card/80 border-border/50 hover:border-border"
                                                        : "bg-muted/30 border-border/30 opacity-60"
                                                    )}>
                                                      {/* Points badge */}
                                                      <div 
                                                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold border"
                                                        style={{
                                                          backgroundColor: item.points > 0 ? pointsColors.bg : undefined,
                                                          color: item.points > 0 ? pointsColors.color : undefined,
                                                          borderColor: item.points > 0 ? pointsColors.border : undefined,
                                                        }}
                                                      >
                                                        {item.points > 0 ? (
                                                          <span className="flex items-center gap-0.5"><AppIcon name="star" size={12} />{item.points}</span>
                                                        ) : (
                                                          <span className="text-muted-foreground">—</span>
                                                        )}
                                                      </div>

                                                      {/* Name + freq */}
                                                      <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                                                        <p className="text-[11px] text-muted-foreground">{getFrequencyLabel(item.frequency || 'daily')}</p>
                                                      </div>

                                                      {/* Compact actions */}
                                                      <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                          onClick={() => onUpdateItem(item.id, { is_active: !item.is_active })}
                                                          className={cn(
                                                            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                                                            item.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                                                          )}
                                                          title={item.is_active ? 'Desativar' : 'Ativar'}
                                                        >
                                                          {item.is_active ? <AppIcon name="check" size={14} /> : <AppIcon name="close" size={14} />}
                                                        </button>
                                                        <button
                                                          onClick={() => handleOpenItemSheet(subcategory.id, item)}
                                                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                                                          title="Editar"
                                                        >
                                                          <AppIcon name="edit" size={14} />
                                                        </button>
                                                        <button
                                                          onClick={() => onDeleteItem(item.id)}
                                                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                          title="Excluir"
                                                        >
                                                          <AppIcon name="delete" size={14} />
                                                        </button>
                                                      </div>
                                                    </SortableItem>
                                                  );
                                                })}
                                              </SortableContext>
                                            </DndContext>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </SortableItem>
                                );
                              })}
                            </SortableContext>
                          </DndContext>

                          {(!sector.subcategories || sector.subcategories.length === 0) && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhuma subcategoria. Clique em + para adicionar.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </SortableItem>
            );
          })}
        </SortableContext>
      </DndContext>

      {sectors.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <AppIcon name="folder" size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum setor configurado</p>
          <p className="text-sm mt-1">Clique em "Novo Setor" para começar</p>
        </div>
      )}

      {/* Sector Sheet */}
      <Sheet open={sectorSheetOpen} onOpenChange={setSectorSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle>
              {editingSector ? 'Editar Setor' : 'Novo Setor'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Nome do Setor</Label>
              <Input
                value={sectorName}
                onChange={(e) => setSectorName(e.target.value)}
                placeholder="Ex: Cozinha"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSectorColor(color)}
                    className={`w-full aspect-square rounded-xl transition-all ${
                      sectorColor === color
                        ? 'ring-2 ring-primary ring-offset-2'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-5 gap-2">
                {sectorIconOptions.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setSectorIcon(icon)}
                    className={cn(
                      "w-full aspect-square rounded-xl flex items-center justify-center transition-all border",
                      sectorIcon === icon
                        ? 'ring-2 ring-primary ring-offset-2 border-primary bg-primary/10'
                        : 'border-border/50 bg-secondary/30 hover:bg-secondary/60'
                    )}
                  >
                    <AppIcon name={icon} size={20} className="text-foreground" />
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSaveSector}
              disabled={!sectorName.trim()}
              className="w-full h-12"
            >
              {editingSector ? 'Salvar' : 'Criar Setor'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Subcategory Sheet */}
      <Sheet open={subcategorySheetOpen} onOpenChange={setSubcategorySheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle>
              {editingSubcategory ? 'Editar Subcategoria' : 'Nova Subcategoria'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Nome da Subcategoria</Label>
              <Input
                value={subcategoryName}
                onChange={(e) => setSubcategoryName(e.target.value)}
                placeholder="Ex: Pista Fria"
                className="h-12"
              />
            </div>

            <Button
              onClick={handleSaveSubcategory}
              disabled={!subcategoryName.trim()}
              className="w-full h-12"
            >
              {editingSubcategory ? 'Salvar' : 'Criar Subcategoria'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Item Sheet */}
      <Sheet open={itemSheetOpen} onOpenChange={setItemSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Nome do Item</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ex: Verificar temperatura"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Ex: Deve estar entre 2°C e 8°C"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Frequência</Label>
              <button
                type="button"
                onClick={() => setFreqPickerOpen(true)}
                className="flex items-center justify-between w-full h-12 px-3 rounded-xl border border-border/40 bg-secondary/30 text-sm"
              >
                <div className="flex items-center gap-2">
                  {(() => { const opt = frequencyOptions.find(f => f.value === itemFrequency); return opt ? <><AppIcon name={opt.iconName} size={16} />{opt.label}</> : 'Selecione'; })()}
                </div>
                <AppIcon name="ChevronDown" className="w-4 h-4 text-muted-foreground" />
              </button>
              <ListPicker
                open={freqPickerOpen}
                onOpenChange={setFreqPickerOpen}
                title="Frequência"
                items={frequencyOptions.map(o => ({ id: o.value, label: o.label }))}
                selectedId={itemFrequency}
                onSelect={(id) => { if (id) setItemFrequency(id as ItemFrequency); }}
              />
            </div>

            {selectedType !== 'bonus' && (
            <div className="space-y-2">
              <Label>Tipo de Checklist</Label>
              <button
                type="button"
                onClick={() => setTypePickerOpen(true)}
                className="flex items-center justify-between w-full h-12 px-3 rounded-xl border border-border/40 bg-secondary/30 text-sm"
              >
                <div className="flex items-center gap-2">
                  {(() => { const opt = checklistTypeOptions.find(t => t.value === itemChecklistType); return opt ? <><AppIcon name={opt.iconName} size={16} />{opt.label}</> : 'Selecione'; })()}
                </div>
                <AppIcon name="ChevronDown" className="w-4 h-4 text-muted-foreground" />
              </button>
              <ListPicker
                open={typePickerOpen}
                onOpenChange={setTypePickerOpen}
                title="Tipo de Checklist"
                items={checklistTypeOptions.map(o => ({ id: o.value, label: o.label }))}
                selectedId={itemChecklistType}
                onSelect={(id) => { if (id) setItemChecklistType(id as ChecklistType); }}
              />
            </div>
            )}

            <div className="space-y-2">
              <Label>Pontos</Label>
              {(() => {
                const isBonus = itemChecklistType === 'bonus';
                const currentOptions = isBonus ? bonusPointsOptions : pointsOptions;
                const style = isBonus 
                  ? { color: getBonusPointsColors(itemPoints).color }
                  : getPointsToneStyle(itemPoints);
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setPointsPickerOpen(true)}
                      className="flex items-center justify-between w-full h-12 px-3 rounded-xl border border-border/40 bg-secondary/30 text-sm"
                    >
                      <div className="flex items-center gap-2" style={style}>
                        <AppIcon name="star" size={16} style={{ ...style, fill: style.color as string }} />
                        {currentOptions.find(p => p.value === itemPoints)?.label || `${itemPoints} pontos`}
                      </div>
                      <AppIcon name="ChevronDown" className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <ListPicker
                      open={pointsPickerOpen}
                      onOpenChange={setPointsPickerOpen}
                      title="Pontos"
                      items={currentOptions.map(o => ({ id: o.value.toString(), label: o.label }))}
                      selectedId={itemPoints.toString()}
                      onSelect={(id) => { if (id) setItemPoints(parseInt(id)); }}
                    />
                  </>
                );
              })()}
            </div>

            {/* Requires Photo */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-secondary/30">
              <div className="flex items-center gap-2">
                <AppIcon name="photo_camera" size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Exige foto de confirmação</p>
                  <p className="text-[11px] text-muted-foreground">Funcionário precisa tirar foto ao concluir</p>
                </div>
              </div>
              <Switch checked={itemRequiresPhoto} onCheckedChange={setItemRequiresPhoto} />
            </div>

            <Button
              onClick={handleSaveItem}
              disabled={!itemName.trim()}
              className="w-full h-12"
            >
              {editingItem ? 'Salvar Item' : 'Criar Item'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
