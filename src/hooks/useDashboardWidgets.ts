import { useState, useCallback } from 'react';

export interface DashboardWidget {
  key: string;
  label: string;
  icon: string;
  visible: boolean;
  defaultOpen?: boolean;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { key: 'finance', label: 'Saldo financeiro', icon: 'Wallet', visible: true },
  { key: 'checklist', label: 'Produção', icon: 'Factory', visible: true },
  { key: 'quote-requests', label: 'Orçamentos recebidos', icon: 'FileText', visible: true },
  { key: 'finance-chart', label: 'Gráfico financeiro', icon: 'BarChart3', visible: true },
  { key: 'bills-due', label: 'Contas a vencer', icon: 'AlertTriangle', visible: true },
  { key: 'weekly-summary', label: 'Resumo semanal', icon: 'Calendar', visible: true },
  { key: 'pending-orders', label: 'Pedidos pendentes', icon: 'ShoppingCart', visible: true },
  { key: 'auto-order', label: 'Sugestão de compras', icon: 'TrendingUp', visible: true },
  { key: 'calendar', label: 'Calendário', icon: 'CalendarDays', visible: true },
  { key: 'agenda', label: 'Agenda', icon: 'ListTodo', visible: true },
  { key: 'pending-actions', label: 'Ações pendentes', icon: 'Bell', visible: true },
  { key: 'leaderboard', label: 'Ranking', icon: 'Trophy', visible: true },
  { key: 'ai-insights', label: 'Insights da IA', icon: 'Sparkles', visible: true },
  { key: 'cash-flow', label: 'Fluxo de caixa projetado', icon: 'TrendingUp', visible: false },
];

const STORAGE_KEY = 'dashboard-widgets-config';

function loadWidgets(): DashboardWidget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const saved: DashboardWidget[] = JSON.parse(raw);
    // Merge with defaults to handle new widgets added later
    const savedKeys = new Set(saved.map(w => w.key));
    const merged = [
      ...saved.filter(w => DEFAULT_WIDGETS.some(d => d.key === w.key)),
      ...DEFAULT_WIDGETS.filter(d => !savedKeys.has(d.key)),
    ];
    return merged;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export function useDashboardWidgets() {
  const [widgets, setWidgetsState] = useState<DashboardWidget[]>(loadWidgets);

  const setWidgets = useCallback((next: DashboardWidget[]) => {
    setWidgetsState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const resetDefaults = useCallback(() => {
    setWidgetsState(DEFAULT_WIDGETS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const isVisible = useCallback((key: string) => {
    return widgets.find(w => w.key === key)?.visible ?? true;
  }, [widgets]);

  return { widgets, setWidgets, resetDefaults, isVisible };
}
