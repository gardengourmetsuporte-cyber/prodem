import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { ManagerTask } from '@/types/agenda';

interface TimeBlocksViewProps {
  tasks: ManagerTask[];
  onToggleTask: (id: string) => void;
  onTaskClick: (task: ManagerTask) => void;
}

// ── localStorage helpers ──
const getStorageKey = (date: string) => `timeblocks-${date}`;

function loadAllocations(dateStr: string): Record<number, string> {
  try {
    const raw = localStorage.getItem(getStorageKey(dateStr));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAllocations(dateStr: string, allocs: Record<number, string>) {
  try { localStorage.setItem(getStorageKey(dateStr), JSON.stringify(allocs)); } catch { }
}

// Working hours only (6h - 23h)
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

function formatDateLabel(date: Date): string {
  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  if (isYesterday(date)) return 'Ontem';
  return format(date, "EEEE, d 'de' MMM", { locale: ptBR });
}

export function TimeBlocksView({ tasks, onToggleTask, onTaskClick }: TimeBlocksViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const [allocations, setAllocations] = useState<Record<number, string>>(() => loadAllocations(dateStr));
  const [pickerHour, setPickerHour] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentHour = new Date().getHours();

  // Reload allocations when date changes
  useEffect(() => {
    setAllocations(loadAllocations(dateStr));
  }, [dateStr]);

  // Save allocations on change
  useEffect(() => { saveAllocations(dateStr, allocations); }, [allocations, dateStr]);

  // Auto-scroll to current hour on mount
  const hasScrolled = useRef(false);
  useEffect(() => {
    if (hasScrolled.current || !isToday(currentDate)) return;
    hasScrolled.current = true;
    const el = document.getElementById(`block-${currentHour}`);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  }, [currentDate, currentHour]);

  // Task map
  const taskMap = useMemo(() => {
    const m = new Map<string, ManagerTask>();
    tasks.forEach(t => m.set(t.id, t));
    return m;
  }, [tasks]);

  // Allocated task IDs
  const allocatedIds = useMemo(() => new Set(Object.values(allocations)), [allocations]);

  // Available tasks for this day
  const availableTasks = useMemo(() => {
    return tasks
      .filter(t => !t.is_completed && !allocatedIds.has(t.id))
      .filter(t => !t.due_date || t.due_date === dateStr);
  }, [tasks, allocatedIds, dateStr]);

  const allocateTask = useCallback((hour: number, taskId: string) => {
    setAllocations(prev => ({ ...prev, [hour]: taskId }));
    setPickerHour(null);
    try { navigator.vibrate?.(10); } catch { }
  }, []);

  const removeAllocation = useCallback((hour: number) => {
    setAllocations(prev => {
      const next = { ...prev };
      delete next[hour];
      return next;
    });
  }, []);

  const filledCount = Object.keys(allocations).length;
  const totalWorking = HOURS.length;

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setCurrentDate(d => subDays(d, 1))}>
          <AppIcon name="ChevronLeft" size={20} />
        </Button>
        <div className="text-center">
          <h2 className="text-base font-semibold capitalize">{formatDateLabel(currentDate)}</h2>
          {!isToday(currentDate) && (
            <button onClick={() => setCurrentDate(new Date())} className="text-[11px] text-primary font-medium mt-0.5">
              Ir para hoje
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setCurrentDate(d => addDays(d, 1))}>
          <AppIcon name="ChevronRight" size={20} />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(filledCount / totalWorking) * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{filledCount}/{totalWorking}</span>
        {filledCount > 0 && (
          <button
            onClick={() => setAllocations({})}
            className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className="relative flex flex-col-reverse gap-1">
        {HOURS.map((hour) => {
          const taskId = allocations[hour];
          const task = taskId ? taskMap.get(taskId) ?? null : null;
          const isNow = isToday(currentDate) && currentHour === hour;
          const isPast = isToday(currentDate) && hour < currentHour;
          const endHour = hour + 1;

          return (
            <div
              key={hour}
              id={`block-${hour}`}
              onClick={() => !task && availableTasks.length > 0 && setPickerHour(hour)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-300 min-h-[52px]",
                !task && "cursor-pointer",
                // Base
                "card-surface border-white/5",
                // Now
                isNow && "border-primary/50 shadow-glow-primary ring-1 ring-primary/20",
                // Past empty
                isPast && !task && "opacity-40",
                // Filled
                task && "shadow-sm border-white/10",
                // Hover empty
                !task && !isPast && "hover:border-primary/20 hover:bg-white/5 hover:shadow-card-hover"
              )}
            >
              {/* Now indicator */}
              {isNow && (
                <span className="absolute left-0 w-1 h-8 rounded-r-full bg-primary animate-pulse" />
              )}

              {/* Time */}
              <div className="shrink-0 w-[52px] text-center">
                <span className={cn(
                  "text-xs font-mono font-medium",
                  isNow ? "text-primary font-bold drop-shadow-md" : isPast ? "text-muted-foreground/40" : "text-muted-foreground"
                )}>
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>

              {/* Divider line */}
              <div className={cn("w-px h-8 shrink-0", isNow ? "bg-primary/30" : "bg-border/60")} />

              {/* Content */}
              {task ? (
                <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                    className="flex items-center gap-2.5 min-w-0 flex-1"
                  >
                    {task.category && (
                      <span
                        className="w-2.5 h-8 rounded-full shrink-0"
                        style={{ backgroundColor: task.category.color }}
                      />
                    )}
                    <div className="min-w-0">
                      <span className={cn(
                        "text-sm font-medium truncate block",
                        task.is_completed && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {String(hour).padStart(2, '0')}:00 – {String(endHour).padStart(2, '0')}:00
                      </span>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                        task.is_completed
                          ? "bg-success/20 text-success"
                          : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      <AppIcon name="Check" size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeAllocation(hour); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-destructive transition-colors"
                    >
                      <AppIcon name="X" size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <span className={cn(
                  "text-xs italic",
                  isPast ? "text-muted-foreground/30" : "text-muted-foreground/50"
                )}>
                  {availableTasks.length > 0 ? 'toque para agendar' : 'livre'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Task Picker Sheet */}
      <Sheet open={pickerHour !== null} onOpenChange={(open) => !open && setPickerHour(null)}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader className="text-left pb-2">
            <SheetTitle>
              Agendar às {pickerHour !== null ? `${String(pickerHour).padStart(2, '0')}:00` : ''}
            </SheetTitle>
            <SheetDescription>Selecione uma tarefa para este horário</SheetDescription>
          </SheetHeader>
          <div className="space-y-2 mt-3 pb-4">
            {availableTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Todas as tarefas já foram alocadas</p>
            ) : (
              (() => {
                // Group by category
                const grouped = new Map<string, { category: ManagerTask['category']; tasks: ManagerTask[] }>();
                const uncategorized: ManagerTask[] = [];
                availableTasks.forEach(task => {
                  if (task.category) {
                    const key = task.category.id || task.category.name;
                    if (!grouped.has(key)) grouped.set(key, { category: task.category, tasks: [] });
                    grouped.get(key)!.tasks.push(task);
                  } else {
                    uncategorized.push(task);
                  }
                });
                return (
                  <>
                    {[...grouped.values()].map(({ category, tasks: catTasks }) => (
                      <div key={category!.id || category!.name}>
                        <div className="flex items-center gap-2 px-1 mb-1.5 mt-2 first:mt-0">
                          <span className="material-symbols-rounded" style={{ fontSize: 16, color: category!.color }}>{(category as any)?.icon || 'folder'}</span>
                          <span className="text-xs font-semibold text-muted-foreground">{category!.name}</span>
                        </div>
                        {catTasks.map(task => (
                          <button
                            key={task.id}
                            onClick={() => pickerHour !== null && allocateTask(pickerHour, task.id)}
                             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/25 transition-all text-left mb-1.5"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium truncate block">{task.title}</span>
                              {task.notes && <span className="text-[11px] text-muted-foreground truncate block">{task.notes}</span>}
                            </div>
                            <AppIcon name="Plus" size={16} className="text-primary shrink-0" />
                          </button>
                        ))}
                      </div>
                    ))}
                    {uncategorized.length > 0 && (
                      <div>
                        {grouped.size > 0 && (
                          <div className="flex items-center gap-2 px-1 mb-1.5 mt-2">
                            <AppIcon name="Folder" size={14} className="text-muted-foreground" />
                            <span className="text-xs font-semibold text-muted-foreground">Sem categoria</span>
                          </div>
                        )}
                        {uncategorized.map(task => (
                          <button
                            key={task.id}
                            onClick={() => pickerHour !== null && allocateTask(pickerHour, task.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/25 transition-all text-left mb-1.5"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium truncate block">{task.title}</span>
                              {task.notes && <span className="text-[11px] text-muted-foreground truncate block">{task.notes}</span>}
                            </div>
                            <AppIcon name="Plus" size={16} className="text-primary shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
