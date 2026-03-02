import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { ManagerTask } from '@/types/agenda';

interface AgendaCalendarViewProps {
  tasks: ManagerTask[];
  onTaskClick: (task: ManagerTask) => void;
  onToggleTask?: (id: string) => void;
}

export function AgendaCalendarView({ tasks, onTaskClick, onToggleTask }: AgendaCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Group tasks by date — only pending tasks (for past days = overdue indicators)
  const tasksByDate = useMemo(() => {
    const today = startOfDay(new Date());
    const map = new Map<string, ManagerTask[]>();
    tasks.forEach(task => {
      if (!task.due_date) return;
      const taskDate = new Date(task.due_date + 'T12:00:00');
      const isPast = isBefore(taskDate, today) && !isToday(taskDate);
      // Past days: only show pending (overdue). Today/future: show pending only.
      if (task.is_completed && isPast) return;
      if (task.is_completed) return;
      const key = task.due_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return map;
  }, [tasks]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Get the first day of the month to calculate padding
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <AppIcon name="ChevronLeft" size={20} />
        </Button>
        <h2 className="text-lg font-semibold capitalize">
          {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <AppIcon name="ChevronRight" size={20} />
        </Button>
      </div>

      {/* Week Headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first of the month */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate.get(dateKey) || [];
          const today = startOfDay(new Date());
          const dayDate = new Date(dateKey + 'T12:00:00');
          const isOverdue = isBefore(dayDate, today) && !isToday(dayDate) && dayTasks.length > 0;

          return (
            <button
              key={day.toISOString()}
              className={cn(
                'aspect-square flex flex-col items-center justify-start p-1 rounded-xl transition-all',
                'hover:bg-primary/5 hover:border hover:border-primary/20',
                isToday(day) && 'card-surface shadow-[0_0_12px_rgba(16,185,129,0.3)] border border-primary/30',
                isOverdue && 'bg-rose-500/10 border border-rose-500/20',
                !isSameMonth(day, currentMonth) && 'opacity-40'
              )}
              onClick={() => {
                setSelectedDate(dateKey);
              }}
            >
              <span className={cn(
                'text-sm font-medium',
                isToday(day) && 'text-primary font-bold drop-shadow-md',
                isOverdue && 'text-rose-400 font-bold drop-shadow-md',
                !isToday(day) && !isOverdue && 'text-foreground'
              )}>
                {format(day, 'd')}
              </span>

              {/* Task indicators — only pending */}
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 flex-wrap justify-center mt-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="w-1.5 h-1.5 rounded-full shadow-sm"
                      style={{
                        backgroundColor: isOverdue ? 'hsl(348, 83%, 65%)' : (task.category?.color || 'transparent'),
                        boxShadow: `0 0 4px ${isOverdue ? 'rgba(251,113,133,0.8)' : task.category?.color ? task.category.color + '80' : 'rgba(16,185,129,0.6)'}`
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Tasks */}
      {selectedDate && (
        <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {format(new Date(selectedDate + 'T12:00:00'), "d 'de' MMMM", { locale: ptBR })}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 rounded-lg"
              onClick={() => setSelectedDate(null)}
            >
              <AppIcon name="X" size={16} />
            </Button>
          </div>

          {(tasksByDate.get(selectedDate) || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma tarefa neste dia
            </p>
          ) : (
            <div className="space-y-2">
              {(tasksByDate.get(selectedDate) || []).map(task => (
                <div
                  key={task.id}
                  className={cn(
                    'p-3 rounded-xl card-surface hover:shadow-card-hover border-white/5 transition-all',
                    task.is_completed && 'opacity-60'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {onToggleTask && (
                      <Checkbox
                        checked={task.is_completed}
                        onCheckedChange={() => onToggleTask(task.id)}
                        className="w-5 h-5 mt-0.5 rounded-full border-2 data-[state=checked]:bg-success data-[state=checked]:border-success"
                      />
                    )}
                    <button
                      onClick={() => onTaskClick(task)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        {task.category && (
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: task.category.color }}
                          />
                        )}
                        <span className={cn(
                          'text-sm font-medium truncate',
                          task.is_completed && 'line-through text-muted-foreground'
                        )}>
                          {task.title}
                        </span>
                      </div>
                      {task.due_time && (
                        <span className="text-xs text-muted-foreground">
                          às {task.due_time}
                        </span>
                      )}
                      {task.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {task.notes}
                        </p>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
