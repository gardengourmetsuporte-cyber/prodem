import * as React from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addMonths, subMonths, setMonth, setYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const handlePrev = () => onMonthChange(subMonths(selectedMonth, 1));
  const handleNext = () => onMonthChange(addMonths(selectedMonth, 1));

  const [viewYear, setViewYear] = React.useState(selectedMonth.getFullYear());

  // Update viewYear when selectedMonth changes externally
  React.useEffect(() => {
    if (open) {
      setViewYear(selectedMonth.getFullYear());
    }
  }, [open, selectedMonth]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(viewYear, i, 1);
    return {
      label: format(d, 'MMM', { locale: ptBR }).replace('.', ''),
      value: i,
    };
  });

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(setYear(selectedMonth, viewYear), monthIndex);
    onMonthChange(newDate);
    setOpen(false);
  };

  return (
    <div className="flex items-center justify-center gap-1 py-1.5">
      <Button variant="ghost" size="icon" onClick={handlePrev} className="w-8 h-8 text-foreground hover:bg-muted">
        <AppIcon name="ChevronLeft" size={16} />
      </Button>

      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "text-sm font-semibold min-w-[150px] text-center capitalize gap-1.5 h-9 px-4 rounded-full",
              "bg-gradient-to-r from-[hsl(156_40%_8%)] via-[hsl(156_50%_16%)] to-[hsl(156_40%_8%)] text-white/90 hover:text-white",
              "dark:from-white dark:via-[hsl(156_30%_96%)] dark:to-white dark:text-[hsl(156_30%_20%)] dark:hover:text-[hsl(156_30%_10%)]"
            )}
          >
            <AppIcon name="Calendar" size={16} className="shrink-0" />
            {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-3 rounded-2xl border-white/10 card-surface shadow-2xl" align="center" avoidCollisions={false}>
          {/* Year Navigation */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewYear(y => y - 1)}>
              <AppIcon name="ChevronLeft" size={16} className="text-muted-foreground" />
            </Button>
            <span className="text-sm font-bold text-foreground">{viewYear}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewYear(y => y + 1)}>
              <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
            </Button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((m) => {
              const isSelected = selectedMonth.getMonth() === m.value && selectedMonth.getFullYear() === viewYear;
              const isCurrentMonth = new Date().getMonth() === m.value && new Date().getFullYear() === viewYear;

              return (
                <button
                  key={m.value}
                  onClick={() => handleMonthSelect(m.value)}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-xl text-xs font-medium capitalize transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-glow-primary"
                      : isCurrentMonth
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-secondary/40 text-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon" onClick={handleNext} className="w-8 h-8 text-foreground hover:bg-muted">
        <AppIcon name="ChevronRight" size={16} />
      </Button>
    </div>
  );
}
