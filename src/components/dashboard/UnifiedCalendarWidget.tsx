import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isBefore, startOfDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDashboardCalendar } from '@/hooks/useDashboardCalendar';
import { calendarEventColors } from '@/types/calendar';
import type { CalendarDayEvents, CalendarEvent } from '@/types/calendar';
import { cn } from '@/lib/utils';

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function UnifiedCalendarWidget() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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

  const hasEvents = (dateKey: string) => {
    const ev = eventsMap.get(dateKey);
    if (!ev) return false;
    return ev.tasks.length > 0 || ev.finance.length > 0 || ev.marketing.length > 0 || ev.schedules.length > 0;
  };

  const todayStart = startOfDay(new Date());

  const getChips = (dateKey: string) => {
    const ev = eventsMap.get(dateKey);
    if (!ev) return [];
    const chips: { type: string; color: string }[] = [];
    // Only show marketing, schedules (folga), and finance peaks (datas importantes)
    if (ev.marketing.length > 0) chips.push({ type: 'marketing', color: calendarEventColors.marketing });
    if (ev.schedules.length > 0) chips.push({ type: 'schedule', color: calendarEventColors.schedule });
    const hasPeak = ev.finance.some(f => f.type === 'finance_peak' && f.subtitle === 'Acima da média');
    if (hasPeak) chips.push({ type: 'finance_peak', color: calendarEventColors.finance_peak });
    return chips;
  };

  return (
    <div className="col-span-2 animate-slide-up stagger-4">
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        {/* Header */}
        <button
          onClick={() => navigate('/calendar')}
          className="flex items-center justify-between px-4 py-3 border-b border-border/30 w-full hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AppIcon name="CalendarDays" size={16} className="text-primary" />
            <span className="text-xs font-bold text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>Calendário</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground mr-1">Ver completo</span>
            <AppIcon name="ChevronRight" size={14} className="text-muted-foreground" />
          </div>
        </button>
        {/* Month nav */}
        <div className="flex items-center justify-center gap-1 py-1.5 border-b border-border/20">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
            <AppIcon name="ChevronLeft" size={14} />
          </Button>
          <button
            className="text-xs font-medium text-foreground capitalize px-2 py-1 rounded-md hover:bg-secondary/50 transition-colors"
            onClick={() => setCurrentMonth(new Date())}
          >
            {format(currentMonth, 'MMM yyyy', { locale: ptBR })}
          </button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
            <AppIcon name="ChevronRight" size={14} />
          </Button>
        </div>

        {/* Week headers */}
        <div className="grid grid-cols-7 border-b border-border/20">
          {weekDays.map(d => (
            <div key={d} className="text-center py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {isLoading ? (
            Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[3.5rem] p-1 border-b border-r border-border/15">
                <Skeleton className="h-3 w-4 mb-1" />
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
            const chips = (inMonth && !isPast) ? getChips(dateKey) : [];

            return (
              <button
                key={i}
                onClick={() => !isPast && inMonth && setSelectedDate(selected ? null : dateKey)}
                disabled={isPast || !inMonth}
                className={cn(
                  'relative min-h-[3.5rem] p-1 border-b border-r border-border/15 text-left transition-colors',
                  !inMonth && 'opacity-15 pointer-events-none',
                  inMonth && isPast && 'opacity-30 pointer-events-none',
                  inMonth && !isPast && 'hover:bg-secondary/40',
                  today && 'bg-primary/5',
                  selected && 'bg-primary/10 ring-1 ring-primary/30'
                )}
              >
                <span className={cn(
                  'text-[11px] font-medium leading-none block mb-0.5',
                  today ? 'text-primary font-bold' : 'text-foreground'
                )}>
                  {format(day, 'd')}
                </span>
                {chips.length > 0 && (
                  <div className="flex flex-wrap gap-[2px]">
                    {chips.map((c, j) => (
                      <div key={j} className={cn('w-[6px] h-[6px] rounded-full', c.color)} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center px-3 py-2 border-t border-border/20">
          {[
            { label: 'Marketing', color: calendarEventColors.marketing },
            { label: 'Folga', color: calendarEventColors.schedule },
            { label: 'Data importante', color: calendarEventColors.finance_peak },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rounded-full', s.color)} />
              <span className="text-[9px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Inline detail panel */}
        {selectedDate && selectedEvents && (
          <div className="border-t border-border/30 p-3 space-y-3 bg-secondary/20 animate-slide-up">
            <p className="text-xs font-semibold text-foreground capitalize">
              {format(new Date(selectedDate + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>

            {/* Tasks */}
            {selectedEvents.tasks.length > 0 && (
              <EventSection icon={<AppIcon name="CheckCircle2" size={14} className="text-primary" />} title="Tarefas">
                {selectedEvents.tasks.map(ev => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </EventSection>
            )}

            {/* Finance */}
            {selectedEvents.finance.length > 0 && (
              <EventSection icon={<AppIcon name="DollarSign" size={14} className="text-orange-500" />} title="Financeiro">
                {selectedEvents.finance.map(ev => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </EventSection>
            )}

            {/* Marketing */}
            {selectedEvents.marketing.length > 0 && (
              <EventSection icon={<AppIcon name="Megaphone" size={14} className="text-accent" />} title="Marketing">
                {selectedEvents.marketing.map(ev => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </EventSection>
            )}

            {/* Schedules */}
            {selectedEvents.schedules.length > 0 && (
              <EventSection icon={<AppIcon name="Coffee" size={14} className="text-amber-500" />} title="Folgas">
                {selectedEvents.schedules.map(ev => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </EventSection>
            )}

            {selectedEvents.tasks.length === 0 && selectedEvents.finance.length === 0 && selectedEvents.marketing.length === 0 && selectedEvents.schedules.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhum evento neste dia</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EventSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
      </div>
      <div className="space-y-1 pl-5">{children}</div>
    </div>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', calendarEventColors[event.type])} />
        <span className="text-xs text-foreground truncate">{event.title}</span>
      </div>
      {event.subtitle && (
        <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">{event.subtitle}</span>
      )}
      {event.time && (
        <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">{event.time}</span>
      )}
    </div>
  );
}
