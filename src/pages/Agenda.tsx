import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useAgenda } from '@/hooks/useAgenda';
import { useCountUp } from '@/hooks/useCountUp';
import { TaskSheet } from '@/components/agenda/TaskSheet';
import { TaskItem } from '@/components/agenda/TaskItem';
import { AgendaCalendarView } from '@/components/agenda/AgendaCalendarView';
import { TimeBlocksView } from '@/components/agenda/TimeBlocksView';

import { useFabAction } from '@/contexts/FabActionContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ManagerTask, TaskCategory } from '@/types/agenda';

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

function SortableTaskItem({ id, children }: { id: string; children: React.ReactNode; key?: React.Key }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative',
    willChange: 'transform',
    ...(isDragging && {
      scale: '1.03',
      opacity: 0.95,
    }),
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function Agenda() {
  const { isAdmin } = useAuth();
  const { hasAccess } = useUserModules();
  const canAccessAgenda = isAdmin || hasAccess('agenda');
  const navigate = useNavigate();
  const [agendaSearchParams, setAgendaSearchParams] = useSearchParams();
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ManagerTask | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'blocks'>('list');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showCompleted, setShowCompleted] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Handle ?action=new from quick actions
  useEffect(() => {
    if (agendaSearchParams.get('action') === 'new') {
      setEditingTask(null);
      setTaskSheetOpen(true);
      setAgendaSearchParams({}, { replace: true });
    }
  }, [agendaSearchParams, setAgendaSearchParams]);

  // Optimistic local state for reorder
  const [tempTasks, setTempTasks] = useState<ManagerTask[] | null>(null);

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(MouseSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const {
    tasks,
    categories,
    isLoading,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderTasks,
    reorderCategories,
    isAddingTask,
    isUpdatingTask,
  } = useAgenda();

  // Use tempTasks if available (during reorder), else server data
  const displayTasks = useMemo(() => tempTasks || tasks, [tempTasks, tasks]);

  // Clear temp after server catches up
  useEffect(() => {
    if (tempTasks && tasks) {
      const timer = setTimeout(() => setTempTasks(null), 600);
      return () => clearTimeout(timer);
    }
  }, [tasks, tempTasks]);

  useEffect(() => {
    if (!canAccessAgenda) navigate('/');
  }, [canAccessAgenda, navigate]);

  useFabAction({ icon: 'Plus', label: 'Novo Lembrete', onClick: () => { setEditingTask(null); setTaskSheetOpen(true); } }, []);

  // Stats
  const pendingCount = useCountUp(displayTasks.filter(t => !t.is_completed).length);
  const completedCount = useCountUp(displayTasks.filter(t => t.is_completed).length);

  const handleEditTask = (task: ManagerTask) => {
    setEditingTask(task);
    setTaskSheetOpen(true);
  };

  const handleInlineUpdate = (id: string, title: string, notes: string) => {
    updateTask({ id, title, notes: notes || undefined });
  };

  const handleAddSubtask = (parentId: string, title: string) => {
    addTask({ title, parent_id: parentId });
  };

  const handleUpdateSubtask = (id: string, title: string) => {
    updateTask({ id, title });
  };

  const handleCloseSheet = (open: boolean) => {
    setTaskSheetOpen(open);
    if (!open) setEditingTask(null);
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!selectedCategoryId) return displayTasks;
    return displayTasks.filter(t => t.category_id === selectedCategoryId);
  }, [displayTasks, selectedCategoryId]);

  const pendingTasks = filteredTasks.filter(t => !t.is_completed);
  const completedTasks = filteredTasks.filter(t => t.is_completed);

  // Group pending tasks by category
  const uncategorizedTasks = pendingTasks.filter(t => !t.category_id);
  const tasksByCategory = categories
    .filter(cat => !selectedCategoryId || cat.id === selectedCategoryId)
    .map(cat => ({
      category: cat,
      tasks: pendingTasks.filter(t => t.category_id === cat.id),
    })).filter(g => g.tasks.length > 0);

  const toggleCategoryExpanded = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  if (!canAccessAgenda) return null;

  const handleDragStart = (_event: DragStartEvent) => {
    try { navigator.vibrate?.(10); } catch { }
  };

  const handleDragEnd = (event: DragEndEvent, taskList: ManagerTask[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = taskList.findIndex(t => t.id === active.id);
    const newIndex = taskList.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(taskList, oldIndex, newIndex);

    // Optimistic local state
    setTempTasks(prev => {
      const base = prev || tasks;
      const taskIds = new Set(reordered.map(t => t.id));
      const orderMap = new Map(reordered.map((t, i) => [t.id, i]));
      return base.map(t => taskIds.has(t.id) ? { ...t, sort_order: orderMap.get(t.id)! } : t)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    });

    reorderTasks(reordered.map((t, i) => ({ id: t.id, sort_order: i })));
  };

  const renderTaskItem = (task: ManagerTask) => (
    <SortableTaskItem key={task.id} id={task.id}>
      <TaskItem
        task={task}
        onToggle={toggleTask}
        onDelete={deleteTask}
        onClick={() => handleEditTask(task)}
        onInlineUpdate={handleInlineUpdate}
        onAddSubtask={handleAddSubtask}
        onUpdateSubtask={handleUpdateSubtask}
      />
    </SortableTaskItem>
  );

  const ListContent = () => (
    <div className="space-y-1.5">
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : pendingTasks.length === 0 && !showCompleted ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-4 finance-hero-card checklist-gradient-slow shadow-glow-primary border border-primary/20">
            <AppIcon name="Sparkles" size={32} className="text-primary drop-shadow-md" />
          </div>
          <p className="text-foreground text-base font-semibold">Tudo em dia! 🎉</p>
          <Button variant="link" className="mt-2 text-primary font-medium hover:text-primary/80" onClick={() => setTaskSheetOpen(true)}>
            Criar novo lembrete
          </Button>
        </div>
      ) : (
        <>
          {/* Category sections */}
          {tasksByCategory.map(({ category, tasks: catTasks }) => {
            const isExpanded = expandedCategories[category.id] === true;
            return (
              <Collapsible key={category.id} open={isExpanded} onOpenChange={() => toggleCategoryExpanded(category.id)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl bg-card border border-border/30 hover:border-primary/25 transition-all duration-300 group">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 border shadow-inner"
                      style={{ backgroundColor: category.color + '15', border: `1px solid ${category.color}30` }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 20, color: category.color, filter: `drop-shadow(0 0 4px ${category.color}60)` }}>{category.icon || 'folder'}</span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-[15px] leading-tight text-foreground">{category.name}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">{catTasks.length} {catTasks.length === 1 ? 'lembrete' : 'lembretes'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: category.color, boxShadow: `0 0 6px ${category.color}60` }}
                    />
                    <AppIcon name="ChevronDown" size={18} className={cn("text-muted-foreground/60 transition-transform duration-300 ease-out", isExpanded && "rotate-180")} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-1 pl-1">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={(e) => handleDragEnd(e, catTasks)}>
                    <SortableContext items={catTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      {catTasks.map(task => renderTaskItem(task))}
                    </SortableContext>
                  </DndContext>
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {/* Uncategorized tasks */}
          {uncategorizedTasks.length > 0 && (
            <div className="space-y-1">
              {tasksByCategory.length > 0 && (
                <p className="text-xs font-medium text-muted-foreground px-1">Sem categoria</p>
              )}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={(e) => handleDragEnd(e, uncategorizedTasks)}>
                <SortableContext items={uncategorizedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {uncategorizedTasks.map(task => renderTaskItem(task))}
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Completed tasks */}
          {showCompleted && completedTasks.length > 0 && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 px-1 py-2 w-full">
                <AppIcon name="CheckCircle2" size={16} className="text-success" />
                <span className="text-sm font-semibold text-muted-foreground">Concluídos ({completedTasks.length})</span>
                <AppIcon name="ChevronDown" size={14} className="text-muted-foreground ml-auto" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {completedTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    onClick={() => handleEditTask(task)}
                    onInlineUpdate={handleInlineUpdate}
                    onAddSubtask={handleAddSubtask}
                    onUpdateSubtask={handleUpdateSubtask}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      )}
    </div>
  );

  const CalendarContent = () => (
    <AgendaCalendarView
      tasks={displayTasks}
      onTaskClick={handleEditTask}
      onToggleTask={toggleTask}
    />
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-4">
          {/* Stats + actions row */}
          <div className="flex items-center justify-between">
            {!isLoading && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{pendingCount}</span> pendentes
                </span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-bold text-success">{completedCount}</span> concluídos
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="rounded-xl w-10 h-10">
                    <AppIcon name="MoreHorizontal" size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => setShowCompleted(!showCompleted)}>
                    <AppIcon name="CheckCircle2" size={16} className="mr-2" />
                    {showCompleted ? 'Ocultar concluídos' : 'Ver concluídos'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCategorySheetOpen(true)}>
                    <AppIcon name="Folder" size={16} className="mr-2" />
                    Gerenciar categorias
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* View mode tabs with animated indicator */}
          <div className="relative flex bg-muted/50 rounded-2xl p-1 border border-border shadow-inner">
            <div
              className="absolute top-1 bottom-1 rounded-xl bg-primary/10 shadow-sm shadow-primary/10 border border-primary/20 transition-all duration-300 ease-out"
              style={{
                width: 'calc(33.333% - 4px)',
                left: viewMode === 'list' ? '4px' : viewMode === 'calendar' ? 'calc(33.333% + 0px)' : 'calc(66.666% + 0px)',
              }}
            />
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium z-10 transition-colors duration-200",
                viewMode === 'list' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <AppIcon name="ListChecks" size={16} />
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium z-10 transition-colors duration-200",
                viewMode === 'calendar' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <AppIcon name="Calendar" size={16} />
              Calendário
            </button>
            <button
              onClick={() => setViewMode('blocks')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium z-10 transition-colors duration-200",
                viewMode === 'blocks' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <AppIcon name="LayoutGrid" size={16} />
              Blocos
            </button>
          </div>

          {/* Category filter removed — filtering via collapsible groups */}

          {/* Content with fade transition */}
          <div className="animate-fade-in" key={viewMode}>
            {viewMode === 'list' && <ListContent />}
            {viewMode === 'calendar' && <CalendarContent />}
            {viewMode === 'blocks' && (
              <TimeBlocksView
                tasks={displayTasks}
                onToggleTask={toggleTask}
                onTaskClick={handleEditTask}
              />
            )}
          </div>
        </div>

      </div>

      <TaskSheet
        open={taskSheetOpen}
        onOpenChange={handleCloseSheet}
        onSubmit={addTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
        isSubmitting={isAddingTask || isUpdatingTask}
        editingTask={editingTask}
        categories={categories}
        onAddCategory={addCategory}
      />

      {/* Category Management Sheet */}
      <CategoryManagerSheet
        open={categorySheetOpen}
        onOpenChange={setCategorySheetOpen}
        categories={categories}
        onAdd={addCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />
    </AppLayout>
  );
}

// ─── Task Category Icons ─────────────────────────────────────
const TASK_CATEGORY_ICONS = [
  'work', 'person', 'group', 'home', 'storefront',
  'local_shipping', 'payments', 'receipt_long', 'shopping_cart', 'campaign',
  'call', 'mail', 'forum', 'event', 'schedule',
  'task_alt', 'checklist', 'edit_note', 'description', 'folder',
  'bookmark', 'label', 'star', 'favorite', 'flag',
  'lightbulb', 'school', 'fitness_center', 'restaurant', 'local_hospital',
  'directions_car', 'flight', 'build', 'handyman', 'brush',
  'code', 'laptop_mac', 'smartphone', 'headphones', 'photo_camera',
  'music_note', 'movie', 'pets', 'eco', 'park',
  'celebration', 'emoji_events', 'savings', 'account_balance', 'gavel',
];

// ─── Category Manager Sheet ─────────────────────────────────────

interface CategoryManagerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TaskCategory[];
  onAdd: (cat: { name: string; color: string; icon?: string }) => void;
  onUpdate: (cat: { id: string; name: string; color: string; icon?: string }) => void;
  onDelete: (id: string) => void;
}

function CategoryManagerSheet({ open, onOpenChange, categories, onAdd, onUpdate, onDelete }: CategoryManagerSheetProps) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[4]);
  const [newIcon, setNewIcon] = useState('folder');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [iconSearch, setIconSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!iconSearch) return TASK_CATEGORY_ICONS;
    return TASK_CATEGORY_ICONS.filter(i => i.includes(iconSearch.toLowerCase()));
  }, [iconSearch]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd({ name: newName.trim(), color: newColor, icon: newIcon });
    setNewName('');
    setNewIcon('folder');
  };

  const startEdit = (cat: TaskCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditIcon(cat.icon || 'folder');
    setIconSearch('');
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    onUpdate({ id: editingId, name: editName.trim(), color: editColor, icon: editIcon });
    setEditingId(null);
  };

  const renderIconGrid = (selectedIcon: string, onSelect: (icon: string) => void) => (
    <div className="space-y-2">
      <Input
        placeholder="Buscar ícone..."
        value={iconSearch}
        onChange={e => setIconSearch(e.target.value)}
        className="h-9 text-xs"
      />
      <div className="grid grid-cols-7 gap-1 max-h-32 overflow-y-auto rounded-xl border border-border/30 p-1.5 bg-card">
        {filteredIcons.map(icon => (
          <button
            key={icon}
            type="button"
            onClick={() => onSelect(icon)}
            className={cn(
              "flex items-center justify-center p-1.5 rounded-lg transition-colors",
               selectedIcon === icon
                 ? "bg-primary/15 text-primary"
                 : "hover:bg-primary/5 text-muted-foreground"
            )}
            title={icon.replace(/_/g, ' ')}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{icon}</span>
          </button>
        ))}
        {filteredIcons.length === 0 && (
          <p className="col-span-7 text-xs text-muted-foreground text-center py-2">Nenhum ícone encontrado</p>
        )}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle>Categorias</SheetTitle>
          <SheetDescription>Crie, edite ou exclua categorias dos seus lembretes</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-4">
          {/* Add new */}
          <div className="bg-card rounded-2xl p-4 border border-border/30 space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border border-border"
                style={{ backgroundColor: newColor + '20' }}
                onClick={() => { }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: newColor }}>{newIcon}</span>
              </button>
              <Input
                placeholder="Nova categoria"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 h-10"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Button size="sm" onClick={handleAdd} disabled={!newName.trim()} className="h-10 px-4 rounded-xl">
                <AppIcon name="Plus" size={16} />
              </Button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-6 h-6 rounded-full transition-all",
                    newColor === color && "ring-2 ring-offset-2 ring-foreground"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewColor(color)}
                />
              ))}
            </div>
            {renderIconGrid(newIcon, setNewIcon)}
          </div>

          {/* List */}
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">Nenhuma categoria criada</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-card rounded-2xl border border-border/30 p-4">
                  {editingId === cat.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border border-border"
                          style={{ backgroundColor: editColor + '20' }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 20, color: editColor }}>{editIcon}</span>
                        </button>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 h-10"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        />
                        <Button size="sm" onClick={saveEdit} className="h-10 rounded-xl">Salvar</Button>
                        <Button size="icon" variant="ghost" className="h-10 w-10" onClick={() => setEditingId(null)}>
                          <AppIcon name="X" size={16} />
                        </Button>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {CATEGORY_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={cn(
                              "w-6 h-6 rounded-full transition-all",
                              editColor === color && "ring-2 ring-offset-2 ring-foreground"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => setEditColor(color)}
                          />
                        ))}
                      </div>
                      {renderIconGrid(editIcon, setEditIcon)}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-rounded shrink-0" style={{ fontSize: 20, color: cat.color }}>{cat.icon || 'folder'}</span>
                        <span className="font-medium text-sm">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <AppIcon name="Pencil" size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(cat.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <AppIcon name="Trash2" size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
