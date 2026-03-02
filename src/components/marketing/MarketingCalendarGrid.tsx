import { useState, useMemo } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayPostsSheet } from './DayPostsSheet';
import { getDateForDay } from '@/lib/marketingDates';
import type { MarketingPost } from '@/types/marketing';

const statusColors: Record<string, string> = {
  draft: 'bg-muted-foreground/40',
  scheduled: 'bg-primary',
  published: 'bg-success',
  failed: 'bg-destructive',
};

interface Props {
  posts: MarketingPost[];
  onEdit: (p: MarketingPost) => void;
  onDelete: (id: string) => void;
  onPublish: (p: MarketingPost) => void;
  onNewPost: (date: Date) => void;
}

export function MarketingCalendarGrid({ posts, onEdit, onDelete, onPublish, onNewPost }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const postsByDate = useMemo(() => {
    const map = new Map<string, MarketingPost[]>();
    posts.forEach(p => {
      const d = p.scheduled_at || p.created_at;
      const key = format(new Date(d), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [posts]);

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

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setSheetOpen(true);
  };

  const selectedPosts = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return postsByDate.get(key) || [];
  }, [selectedDate, postsByDate]);

  return (
    <div className="space-y-3">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
          <AppIcon name="ChevronLeft" size={16} />
        </Button>
        <div className="text-center">
          <h2 className="text-sm font-semibold text-foreground capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 px-2"
            onClick={() => setCurrentMonth(new Date())}
          >
            Hoje
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
            <AppIcon name="ChevronRight" size={16} />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
        {/* Week headers */}
        <div className="grid grid-cols-7 border-b border-border/30">
          {weekDays.map(d => (
            <div key={d} className="text-center py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayPosts = postsByDate.get(key) || [];
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const specialDate = getDateForDay(day.getMonth() + 1, day.getDate());
            const maxChips = 3;

            return (
              <button
                key={i}
                onClick={() => handleDayClick(day)}
                className={`
                  relative min-h-[4.5rem] p-1 border-b border-r border-border/20 text-left transition-colors
                  ${inMonth ? 'hover:bg-secondary/50' : 'opacity-30'}
                  ${today ? 'bg-primary/5' : ''}
                `}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[11px] font-medium leading-none ${today ? 'text-primary font-bold' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  {specialDate && inMonth && (
                    <span className="text-[10px]" title={specialDate.title}>{specialDate.emoji}</span>
                  )}
                </div>

                {/* Post chips */}
                <div className="space-y-0.5">
                  {dayPosts.slice(0, maxChips).map(p => (
                    <div
                      key={p.id}
                      className={`w-full h-[14px] rounded-sm px-1 flex items-center ${statusColors[p.status] || statusColors.draft}`}
                    >
                      <span className="text-[8px] text-white truncate font-medium leading-none">
                        {p.title}
                      </span>
                    </div>
                  ))}
                  {dayPosts.length > maxChips && (
                    <span className="text-[9px] text-muted-foreground pl-0.5">
                      +{dayPosts.length - maxChips}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex gap-3 justify-center">
        {[
          { label: 'Rascunho', color: 'bg-muted-foreground/40' },
          { label: 'Agendado', color: 'bg-primary' },
          { label: 'Publicado', color: 'bg-success' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Day Posts Sheet */}
      <DayPostsSheet
        date={selectedDate}
        posts={selectedPosts}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onEdit={onEdit}
        onDelete={onDelete}
        onPublish={onPublish}
        onNewPost={onNewPost}
      />
    </div>
  );
}
