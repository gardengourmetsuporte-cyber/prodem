import { useEffect, useRef } from 'react';
import { format, isSameDay, isToday as isDateToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProductionDateStripProps {
  days: Date[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}

export function ProductionDateStrip({ days, selectedDate, onSelectDate }: ProductionDateStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const selectedIdx = days.findIndex(d => isSameDay(d, selectedDate));
    if (selectedIdx < 0) return;
    const btnCenter = 16 + selectedIdx * 48 + 22;
    const scrollLeft = btnCenter - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
  }, [selectedDate, days]);

  return (
    <div className="space-y-1.5">
      <div className="-mx-4 overflow-x-auto scrollbar-hide" ref={containerRef}>
        <div className="flex gap-1 px-4 py-1">
          {days.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isDayToday = isDateToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className="flex flex-col items-center gap-1 shrink-0 w-[44px]"
              >
                <span className={cn(
                  "text-[10px] font-medium uppercase leading-none",
                  isSelected ? "text-foreground" : isDayToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                </span>
                <div className={cn(
                  "w-[38px] h-[38px] rounded-full flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-primary shadow-lg shadow-primary/30 ring-2 ring-primary/50"
                    : isDayToday
                      ? "bg-primary/8"
                      : "hover:bg-secondary/60"
                )}>
                  <span className={cn(
                    "text-sm font-bold leading-none",
                    isSelected ? "text-primary-foreground" : isDayToday ? "text-primary" : "text-foreground"
                  )}>
                    {format(day, 'dd')}
                  </span>
                </div>
                {isDayToday && !isSelected && (
                  <div className="w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground capitalize">
        {isDateToday(selectedDate) ? '📍 ' : ''}{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
      </p>
    </div>
  );
}
