import { useState, useRef } from 'react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import type { ManagerTask } from '@/types/agenda';

interface TaskItemProps {
  task: ManagerTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: () => void;
  onInlineUpdate?: (id: string, title: string, notes: string) => void;
  onAddSubtask?: (parentId: string, title: string) => void;
  onUpdateSubtask?: (id: string, title: string) => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  key?: React.Key;
}

function formatDueDate(dateStr: string | null, timeStr: string | null): string | null {
  if (!dateStr) return null;
  const date = parseISO(dateStr);
  if (isToday(date)) return timeStr ? `Hoje ${timeStr}` : 'Hoje';
  if (isTomorrow(date)) return timeStr ? `Amanhã ${timeStr}` : 'Amanhã';
  const formatted = format(date, "d MMM", { locale: ptBR });
  return timeStr ? `${formatted} ${timeStr}` : formatted;
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return isPast(parseISO(dateStr)) && !isToday(parseISO(dateStr));
}

export function TaskItem({ task, onToggle, onDelete, onClick, onInlineUpdate, onAddSubtask, onUpdateSubtask, isDragging, dragHandleProps }: TaskItemProps) {
  const dueLabel = formatDueDate(task.due_date || null, task.due_time || null);
  const overdue = !task.is_completed && isOverdue(task.due_date || null);
  const clockUrgency = !task.is_completed && overdue
    ? { colorClass: 'text-destructive', pulse: true }
    : { colorClass: 'text-muted-foreground', pulse: false };
  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const completedSubtasks = subtasks.filter(s => s.is_completed).length;
  const categoryColor = task.category?.color;

  const [expanded, setExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubTitle, setEditingSubTitle] = useState('');
  const editSubRef = useRef<HTMLInputElement>(null);
  const [completing, setCompleting] = useState(false);

  const handleToggle = () => {
    if (!task.is_completed) {
      setCompleting(true);
      try { navigator.vibrate?.(10); } catch { }
      setTimeout(() => { onToggle(task.id); setCompleting(false); }, 300);
    } else {
      onToggle(task.id);
    }
  };

  const handleAddSubtask = () => {
    const title = newSubtaskTitle.trim();
    if (!title || !onAddSubtask) return;
    onAddSubtask(task.id, title);
    setNewSubtaskTitle('');
    subtaskInputRef.current?.focus();
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); }
    if (e.key === 'Escape') setNewSubtaskTitle('');
  };

  return (
    <div
      className={cn("relative rounded-xl group", completing && "animate-task-complete")}
      {...dragHandleProps}
    >
      <div
        className={cn(
          'rounded-xl transition-all duration-300 bg-card/80',
          task.is_completed ? 'opacity-40' : '',
          isDragging && 'shadow-glow-primary ring-1 ring-primary/40 scale-[1.02]',
        )}
      >
        {/* Parent task row */}
        <div className="flex items-center gap-3 px-3.5 py-3">
          {/* Left color indicator */}
          {categoryColor && !task.is_completed && (
            <div
              className="w-[3px] self-stretch rounded-full shrink-0"
              style={{ backgroundColor: categoryColor }}
            />
          )}

          <Checkbox
            checked={task.is_completed}
            onCheckedChange={handleToggle}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "w-[18px] h-[18px] rounded-full border-2 shrink-0 transition-all duration-300",
              "data-[state=checked]:bg-success data-[state=checked]:border-success",
              !task.is_completed && "border-muted-foreground/30",
              completing && "animate-check-pop"
            )}
          />

          <button
            className="flex-1 min-w-0 text-left"
            onClick={() => hasSubtasks ? setExpanded(!expanded) : onClick?.()}
          >
            <p className={cn(
              'text-sm leading-snug text-foreground',
              task.is_completed && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </p>

            {(dueLabel || (hasSubtasks && !expanded)) && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {hasSubtasks && !expanded && (
                  <span className="text-[10px] text-muted-foreground">
                    {completedSubtasks}/{subtasks.length} subtarefas
                  </span>
                )}
                {dueLabel && (
                  <span className={cn(
                    'text-[10px] flex items-center gap-1',
                    overdue ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    <AppIcon name="Clock" size={9} className={cn(clockUrgency.colorClass, clockUrgency.pulse && 'animate-pulse')} />
                    {dueLabel}
                  </span>
                )}
              </div>
            )}
          </button>

          {hasSubtasks && (
            <AppIcon name="ChevronRight" size={14} className={cn(
              'text-muted-foreground/30 transition-transform duration-200 shrink-0',
              expanded && 'rotate-90'
            )} />
          )}

          {/* Actions */}
          <div className="flex items-center shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onClick?.(); }}
              className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-primary transition-colors"
            >
              <AppIcon name="Edit" size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive transition-colors"
            >
              <AppIcon name="Trash2" size={14} />
            </button>
          </div>
        </div>

        {/* Expanded subtasks */}
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="border-t border-border/20 mx-3" />
          <div className="px-3 py-1">
            {subtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-2.5 py-2">
                <div className="w-2.5" />
                <Checkbox
                  checked={sub.is_completed}
                  onCheckedChange={() => onToggle(sub.id)}
                  className="w-4 h-4 rounded-full border-[1.5px] shrink-0 data-[state=checked]:bg-success data-[state=checked]:border-success"
                />
                {editingSubId === sub.id ? (
                  <input
                    ref={editSubRef}
                    value={editingSubTitle}
                    onChange={(e) => setEditingSubTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); const t = editingSubTitle.trim(); if (t && t !== sub.title) onUpdateSubtask?.(sub.id, t); setEditingSubId(null); }
                      if (e.key === 'Escape') setEditingSubId(null);
                    }}
                    onBlur={() => { const t = editingSubTitle.trim(); if (t && t !== sub.title) onUpdateSubtask?.(sub.id, t); setEditingSubId(null); }}
                    className="flex-1 text-[12px] bg-transparent border-none outline-none caret-primary"
                    autoFocus
                  />
                ) : (
                  <button
                    className="flex-1 text-left"
                    onClick={() => { if (sub.is_completed) return; setEditingSubId(sub.id); setEditingSubTitle(sub.title); setTimeout(() => editSubRef.current?.focus(), 50); }}
                  >
                    <span className={cn('text-[12px]', sub.is_completed && 'line-through text-muted-foreground')}>
                      {sub.title}
                    </span>
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(sub.id); }}
                  className="p-0.5 rounded text-muted-foreground/25 hover:text-destructive transition-colors"
                >
                  <AppIcon name="Trash2" size={12} />
                </button>
              </div>
            ))}

            {/* Add subtask inline */}
            <div className="flex items-center gap-2.5 py-2">
              <div className="w-2.5" />
              <AppIcon name="Plus" size={12} className="text-primary/50 shrink-0" />
              <input
                ref={subtaskInputRef}
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                onBlur={() => { if (newSubtaskTitle.trim()) handleAddSubtask(); }}
                placeholder="Nova subtarefa..."
                className="flex-1 text-[12px] bg-transparent border-none outline-none caret-primary placeholder:text-muted-foreground/35"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
