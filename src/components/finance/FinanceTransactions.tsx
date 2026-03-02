import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthSelector } from './MonthSelector';
import { TransactionItem } from './TransactionItem';
import { FinanceTransaction, MonthlyStats } from '@/types/finance';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TransactionFilters, TransactionFiltersState } from './TransactionFilters';
import { FinanceCategory, FinanceAccount } from '@/types/finance';
import { cn } from '@/lib/utils';
import { exportTransactionsCsv } from '@/lib/exportPdf';
import {
  DndContext,
  DragEndEvent,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { formatCurrency } from '@/lib/format';

function SortableTransaction({ id, children }: { id: string; children: (isDragging: boolean) => React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
    ...(isDragging && {
      scale: '1.02',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px hsl(var(--neon-cyan) / 0.2)',
      borderRadius: '16px',
      opacity: 0.95,
    }),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children(isDragging)}
    </div>
  );
}

interface FinanceTransactionsProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  transactionsByDate: Record<string, FinanceTransaction[]>;
  monthStats: MonthlyStats;
  onTransactionClick: (transaction: FinanceTransaction) => void;
  onTogglePaid: (id: string, isPaid: boolean) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onReorderTransactions?: (dateStr: string, orderedIds: string[]) => Promise<void>;
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  initialFilters?: Partial<TransactionFiltersState>;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function FinanceTransactions({
  selectedMonth,
  onMonthChange,
  transactionsByDate,
  monthStats,
  onTransactionClick,
  onTogglePaid,
  onDeleteTransaction,
  onReorderTransactions,
  categories,
  accounts,
  initialFilters,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: FinanceTransactionsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TransactionFiltersState>({
    status: 'all',
    type: 'all',
    categoryId: null,
    accountId: null,
    ...initialFilters
  });


  // Apply initialFilters when they change from parent (reset to defaults when empty)
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    } else {
      setFilters({ status: 'all', type: 'all', categoryId: null, accountId: null });
    }
  }, [initialFilters]);
  const todayRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 8 },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );



  const filteredTransactionsByDate = useMemo(() => {
    const result: Record<string, FinanceTransaction[]> = {};

    Object.entries(transactionsByDate).forEach(([date, transactions]) => {
      const filtered = transactions.filter(t => {
        if (filters.status === 'paid' && !t.is_paid) return false;
        if (filters.status === 'pending' && t.is_paid) return false;
        if (filters.type === 'income' && t.type !== 'income') return false;
        if (filters.type === 'expense' && t.type !== 'expense') return false;
        if (filters.categoryId && t.category_id !== filters.categoryId) return false;
        if (filters.accountId && t.account_id !== filters.accountId && t.to_account_id !== filters.accountId) return false;
        return true;
      });

      if (filtered.length > 0) {
        result[date] = filtered;
      }
    });

    return result;
  }, [transactionsByDate, filters]);

  const sortedDates = useMemo(() => {
    return Object.keys(filteredTransactionsByDate).sort((a, b) => b.localeCompare(a));
  }, [filteredTransactionsByDate]);

  const hasTransactions = sortedDates.length > 0;
  const hasActiveFilters = filters.status !== 'all' || filters.type !== 'all' || filters.categoryId || filters.accountId;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = format(yesterdayDate, 'yyyy-MM-dd');
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = format(tomorrowDate, 'yyyy-MM-dd');

  const getDateLabel = useCallback((dateStr: string) => {
    if (dateStr === todayStr) return 'Hoje';
    if (dateStr === yesterdayStr) return 'Ontem';
    if (dateStr === tomorrowStr) return 'Amanhã';
    return format(parseISO(dateStr), "EEEE, dd 'de' MMMM", { locale: ptBR });
  }, [todayStr, yesterdayStr, tomorrowStr]);

  // Reset scroll tracking when month changes
  useEffect(() => {
    hasScrolledRef.current = false;
  }, [selectedMonth]);

  // No auto-scroll — always open at the top of the list

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const txnId = String(active.id);
    const overId = String(over.id);

    // Find which date both belong to — only allow same-day reorder
    let sharedDate: string | null = null;
    for (const [date, txns] of Object.entries(filteredTransactionsByDate)) {
      const hasActive = txns.some(t => t.id === txnId);
      const hasOver = txns.some(t => t.id === overId);
      if (hasActive && hasOver) {
        sharedDate = date;
        break;
      }
    }

    if (!sharedDate || !onReorderTransactions) return;

    const dayTxns = filteredTransactionsByDate[sharedDate];
    const oldIndex = dayTxns.findIndex(t => t.id === txnId);
    const newIndex = dayTxns.findIndex(t => t.id === overId);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const reordered = arrayMove(dayTxns, oldIndex, newIndex);
      await onReorderTransactions(sharedDate, reordered.map(t => t.id));
    }
  }, [filteredTransactionsByDate, onReorderTransactions]);

  return (
    <>
      <div className="space-y-4">
        {/* Month Selector */}
        <div className="px-4 pt-3 lg:px-6 flex flex-col items-center gap-2">
          <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
          <div className="flex items-center gap-1 self-end">
            {(canUndo || canRedo) && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canUndo} onClick={onUndo}>
                  <AppIcon name="Undo" size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canRedo} onClick={onRedo}>
                  <AppIcon name="Redo" size={16} />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allTxns = Object.entries(transactionsByDate).flatMap(([, txns]) =>
                  txns.map(t => ({
                    date: t.date,
                    description: t.description,
                    category: (t as any).category?.name || '',
                    amount: Number(t.amount),
                    type: t.type,
                    is_paid: t.is_paid,
                    account: (t as any).account?.name || '',
                  }))
                );
                const label = format(selectedMonth, "MMMM yyyy", { locale: ptBR });
                exportTransactionsCsv(allTxns, label);
              }}
              className="gap-1"
            >
              <AppIcon name="Download" size={16} />
            </Button>
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(true)}
              className="gap-1"
            >
              <AppIcon name="Filter" size={16} />
              {hasActiveFilters && <span className="text-xs">•</span>}
            </Button>
          </div>
        </div>

        {/* Summary Header */}
        <div className="mx-4 card-command p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Saldo do mês</span>
            <span className={monthStats.balance >= 0 ? 'text-success font-bold font-display' : 'text-destructive font-bold font-display'} style={{ letterSpacing: '-0.02em' }}>
              {formatCurrency(monthStats.balance)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-success font-semibold font-display">+{formatCurrency(monthStats.totalIncome)}</span>
            <span className="text-destructive font-semibold font-display">-{formatCurrency(monthStats.totalExpense)}</span>
          </div>
        </div>

        {/* Transactions List with DnD */}
        {hasTransactions ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={() => { try { navigator.vibrate?.(50); } catch { } }}
            onDragEnd={handleDragEnd}
          >
            <div className="px-4 pb-32 space-y-4">
              {sortedDates.map(dateStr => {
                const transactions = filteredTransactionsByDate[dateStr];
                const dayTotal = transactions.reduce((sum, t) => {
                  if (t.type === 'income') return sum + Number(t.amount);
                  if (t.type === 'expense' || t.type === 'credit_card') return sum - Number(t.amount);
                  return sum;
                }, 0);

                return (
                  <div key={dateStr} ref={dateStr === todayStr ? todayRef : undefined}>
                    {/* Date Header */}
                    <div className={cn(
                      "flex items-center justify-between py-2.5 px-3 rounded-lg sticky top-[52px] lg:top-[64px] z-20 backdrop-blur-xl transition-all duration-300 shadow-sm border",
                      dateStr === todayStr ? 'bg-primary border-primary/30' : 'bg-background/80 border-border/10'
                    )}>
                      <div className="flex items-center gap-2">
                        {dateStr === todayStr && (
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                        )}
                        <span className={cn("text-xs uppercase tracking-wider font-semibold", dateStr === todayStr ? 'text-white' : 'text-muted-foreground')}>
                          {getDateLabel(dateStr)}
                        </span>
                      </div>
                      <span className={cn("text-sm font-bold font-display", dateStr === todayStr ? 'text-white' : dayTotal >= 0 ? 'text-success' : 'text-destructive')}>
                        {formatCurrency(dayTotal)}
                      </span>
                    </div>

                    {/* Sortable transactions for this date */}
                    <SortableContext items={transactions.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {transactions.map(transaction => (
                          <SortableTransaction key={transaction.id} id={transaction.id}>
                            {(isDragging) => (
                              <div
                                className="relative"
                              >
                                {transaction.is_recurring && transaction.installment_group_id && (
                                  <Badge variant="outline" className="absolute -top-2 right-2 text-[10px] px-1.5 py-0 z-10 bg-background">
                                    <AppIcon name="Repeat" size={10} className="mr-0.5" />
                                    {transaction.installment_number}/{transaction.total_installments}
                                  </Badge>
                                )}
                                <TransactionItem
                                  transaction={transaction}
                                  onClick={() => onTransactionClick(transaction)}
                                  onTogglePaid={onTogglePaid}
                                  onDelete={onDeleteTransaction}
                                  disableSwipe={isDragging}
                                />
                              </div>
                            )}
                          </SortableTransaction>
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          </DndContext>
        ) : (
          <div className="px-4">
            <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-primary/8 border border-primary/15">
                  <AppIcon name="FileText" size={36} className="text-primary/60" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.2))' }} />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-primary/15 animate-pulse" style={{ animationDelay: '0.8s' }} />
              </div>
              <p className="font-bold text-foreground text-center">Nenhuma transação</p>
              <p className="text-sm text-muted-foreground mt-1.5 text-center max-w-[280px] leading-relaxed">
                {hasActiveFilters ? 'Nenhuma transação encontrada com os filtros selecionados' : 'Adicione sua primeira transação para começar a controlar suas finanças'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filters Sheet */}
      <TransactionFilters
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        accounts={accounts}
      />
    </>
  );
}
