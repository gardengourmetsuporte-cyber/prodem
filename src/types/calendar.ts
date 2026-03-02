export type CalendarEventType = 'task_pending' | 'task_done' | 'finance_peak' | 'finance_income' | 'marketing' | 'schedule';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  subtitle?: string;
  time?: string;
  amount?: number;
}

export interface CalendarDayEvents {
  tasks: CalendarEvent[];
  finance: CalendarEvent[];
  marketing: CalendarEvent[];
  schedules: CalendarEvent[];
}

export const calendarEventColors: Record<CalendarEventType, string> = {
  task_pending: 'bg-primary',
  task_done: 'bg-primary',
  finance_peak: 'bg-orange-500',
  finance_income: 'bg-green-500',
  marketing: 'bg-violet-500',
  schedule: 'bg-amber-400',
};

export const calendarEventLabels: Record<CalendarEventType, string> = {
  task_pending: 'Tarefas pendentes',
  task_done: 'Tarefas concluídas',
  finance_peak: 'Pico de despesas',
  finance_income: 'Receitas',
  marketing: 'Marketing',
  schedule: 'Folgas',
};
