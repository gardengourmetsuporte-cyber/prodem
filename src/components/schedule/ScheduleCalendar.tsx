import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { WorkSchedule } from '@/types/database';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';

interface ScheduleCalendarProps {
  schedules: WorkSchedule[];
  currentUserId?: string;
  onDayClick?: (day: number, month: number, year: number) => void;
  selectedDay?: number;
}

export function ScheduleCalendar({ 
  schedules, 
  currentUserId,
  onDayClick, 
  selectedDay 
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get first day of week (0 = Sunday)
  const startDay = monthStart.getDay();
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const getScheduleForDay = (day: number): WorkSchedule | undefined => {
    return schedules.find(s => s.day_off === day && s.month === month && s.year === year);
  };

  const getUserScheduleForDay = (day: number): WorkSchedule | undefined => {
    return schedules.find(
      s => s.day_off === day && s.month === month && s.year === year && s.user_id === currentUserId
    );
  };

  const getDayClasses = (day: number, date: Date) => {
    const schedule = getScheduleForDay(day);
    const userSchedule = getUserScheduleForDay(day);
    
    let classes = 'w-full aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all cursor-pointer hover:bg-secondary';
    
    if (isToday(date)) {
      classes += ' ring-2 ring-primary ring-offset-1';
    }
    
    if (selectedDay === day) {
      classes += ' bg-primary text-primary-foreground hover:bg-primary';
    } else if (userSchedule) {
      // Current user's schedule
      if (userSchedule.status === 'approved') {
        classes += ' bg-success/20 text-success';
      } else if (userSchedule.status === 'pending') {
        classes += ' bg-amber-500/20 text-amber-700 dark:text-amber-400';
      } else if (userSchedule.status === 'rejected') {
        classes += ' bg-red-500/20 text-red-700 dark:text-red-400';
      }
    } else if (schedule) {
      // Other user's schedule (for admin view)
      classes += ' bg-secondary/50';
    }
    
    return classes;
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <AppIcon name="ChevronLeft" className="w-5 h-5" />
        </Button>
        <h3 className="font-semibold text-lg capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <AppIcon name="ChevronRight" className="w-5 h-5" />
        </Button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((day) => (
          <div key={day} className="text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month start */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Days of the month */}
        {days.map((date) => {
          const day = date.getDate();
          const schedule = getScheduleForDay(day);
          
          return (
            <button
              key={day}
              onClick={() => onDayClick?.(day, month, year)}
              className={getDayClasses(day, date)}
            >
              <span className="font-medium">{day}</span>
              {schedule && (
                <div className="w-1.5 h-1.5 rounded-full mt-0.5" 
                  style={{
                    backgroundColor: schedule.status === 'approved' 
                      ? '#22c55e' 
                      : schedule.status === 'pending' 
                        ? '#f59e0b' 
                        : '#ef4444'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span>Aprovado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span>Pendente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span>Recusado</span>
        </div>
      </div>
    </div>
  );
}
