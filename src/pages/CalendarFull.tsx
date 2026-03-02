import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isToday, isBefore, startOfDay, addMonths, subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDashboardCalendar } from '@/hooks/useDashboardCalendar';
import { calendarEventColors } from '@/types/calendar';
import type { CalendarEvent } from '@/types/calendar';
import { cn } from '@/lib/utils';

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarFull() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));
  const { eventsMap, isLoading } = useDashboardCalendar(currentMonth);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const selectedEvents = selectedDate ? eventsMap.get(selectedDate) : null;
  const todayStart = startOfDay(new Date());

  const getChips = (dateKey: string) => {
    const ev = eventsMap.get(dateKey);
    if (!ev) return [];
    const chips: { type: string; color: string }[] = [];
    if (ev.tasks.length > 0) chips.push({ type: 'task_pending', color: calendarEventColors.task_pending });
    if (ev.marketing.length > 0) chips.push({ type: 'marketing', color: calendarEventColors.marketing });
    if (ev.schedules.length > 0) chips.push({ type: 'schedule', color: calendarEventColors.schedule });
    if (ev.finance.length > 0) chips.push({ type: 'finance', color: calendarEventColors.finance_income });
    const hasPeak = ev.finance.some(f => f.type === 'finance_peak' && f.subtitle === 'Acima da média');
    if (hasPeak) chips.push({ type: 'finance_peak', color: calendarEventColors.finance_peak });
    return chips;
  };

  const allEvents = selectedEvents
    ? [
        ...selectedEvents.tasks,
        ...selectedEvents.finance,
        ...selectedEvents.marketing,
        ...selectedEvents.schedules,
      ]
    : [];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
                <AppIcon name="ChevronLeft" size={18} />
              </Button>
              <h1 className="text-lg font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>
                Calendário
              </h1>
            </div>
            <button
              className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
              }}
            >
              Hoje
            </button>
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
              <AppIcon name="ChevronLeft" size={16} />
            </Button>
            <span className="text-sm font-bold text-foreground capitalize min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
              <AppIcon name="ChevronRight" size={16} />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
            {/* Week headers */}
            <div className="grid grid-cols-7 border-b border-border/20">
              {weekDays.map(d => (
                <div key={d} className="text-center py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {isLoading ? (
                Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="min-h-[4.5rem] p-1.5 border-b border-r border-border/15">
                    <Skeleton className="h-4 w-5 mb-1" />
                    <div className="flex gap-[2px]">
                      <Skeleton className="w-[6px] h-[6px] rounded-full" />
                    </div>
                  </div>
                ))
              ) : calendarDays.map((day, i) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const isPast = isBefore(day, todayStart) && !today;
                const selected = selectedDate === dateKey;
                const chips = inMonth ? getChips(dateKey) : [];

                return (
                  <button
                    key={i}
                    onClick={() => inMonth && setSelectedDate(selected ? null : dateKey)}
                    disabled={!inMonth}
                    className={cn(
                      'relative min-h-[4.5rem] p-1.5 border-b border-r border-border/15 text-left transition-all',
                      !inMonth && 'opacity-15 pointer-events-none',
                      inMonth && isPast && 'opacity-50',
                      inMonth && 'hover:bg-secondary/40',
                      today && 'bg-primary/5',
                      selected && 'bg-primary/10 ring-1 ring-primary/30'
                    )}
                  >
                    <span className={cn(
                      'text-xs font-medium leading-none block mb-1',
                      today && 'text-primary font-bold',
                      selected && !today && 'text-primary font-bold',
                      !today && !selected && 'text-foreground'
                    )}>
                      {format(day, 'd')}
                    </span>
                    {chips.length > 0 && (
                      <div className="flex flex-wrap gap-[3px]">
                        {chips.map((c, j) => (
                          <div key={j} className={cn('w-[7px] h-[7px] rounded-full', c.color)} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center px-4 py-2.5 border-t border-border/20">
              {[
                { label: 'Tarefas', color: calendarEventColors.task_pending },
                { label: 'Marketing', color: calendarEventColors.marketing },
                { label: 'Folga', color: calendarEventColors.schedule },
                { label: 'Financeiro', color: calendarEventColors.finance_income },
                { label: 'Data importante', color: calendarEventColors.finance_peak },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className={cn('w-2.5 h-2.5 rounded-full', s.color)} />
                  <span className="text-[10px] text-muted-foreground font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {selectedDate && (
            <div className="rounded-2xl border border-border/40 bg-card p-4 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground capitalize">
                  {format(new Date(selectedDate + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                <button onClick={() => setSelectedDate(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <AppIcon name="X" size={16} />
                </button>
              </div>

              {allEvents.length === 0 ? (
                <div className="py-8 text-center">
                  <AppIcon name="CalendarDays" size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum evento neste dia</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Tasks */}
                  {selectedEvents!.tasks.length > 0 && (
                    <EventSection icon="CheckCircle2" iconColor="text-success" title="Tarefas">
                      {selectedEvents!.tasks.map(ev => <EventRow key={ev.id} event={ev} />)}
                    </EventSection>
                  )}

                  {/* Finance */}
                  {selectedEvents!.finance.length > 0 && (
                    <EventSection icon="DollarSign" iconColor="text-orange-500" title="Financeiro">
                      {selectedEvents!.finance.map(ev => <EventRow key={ev.id} event={ev} />)}
                    </EventSection>
                  )}

                  {/* Marketing */}
                  {selectedEvents!.marketing.length > 0 && (
                    <EventSection icon="Megaphone" iconColor="text-accent" title="Marketing">
                      {selectedEvents!.marketing.map(ev => <EventRow key={ev.id} event={ev} />)}
                    </EventSection>
                  )}

                  {/* Schedules */}
                  {selectedEvents!.schedules.length > 0 && (
                    <EventSection icon="Coffee" iconColor="text-amber-500" title="Folgas">
                      {selectedEvents!.schedules.map(ev => <EventRow key={ev.id} event={ev} />)}
                    </EventSection>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function EventSection({ icon, iconColor, title, children }: { icon: string; iconColor: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <AppIcon name={icon} size={16} className={iconColor} />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{title}</span>
      </div>
      <div className="space-y-1.5 pl-6">{children}</div>
    </div>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-secondary/30 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', calendarEventColors[event.type])} />
        <span className="text-sm text-foreground truncate">{event.title}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {event.subtitle && (
          <span className="text-xs text-muted-foreground">{event.subtitle}</span>
        )}
        {event.time && (
          <span className="text-xs text-muted-foreground">{event.time}</span>
        )}
      </div>
    </div>
  );
}
