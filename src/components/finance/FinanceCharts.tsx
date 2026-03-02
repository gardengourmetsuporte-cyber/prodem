import { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  LineChart, Line, CartesianGrid, Area, AreaChart
} from 'recharts';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { MonthSelector } from './MonthSelector';
import { CategoryStats, FinanceCategory, FinanceTransaction } from '@/types/finance';
import { DREReport } from './DREReport';
import { EntityStats } from '@/hooks/useFinanceStats';
import { cn } from '@/lib/utils';

interface FinanceChartsProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  expensesByCategory: CategoryStats[];
  incomeByCategory: CategoryStats[];
  dailyExpenses: { date: string; amount: number }[];
  dailyIncome: { date: string; amount: number }[];
  getSubcategoryStats: (parentId: string, type?: 'expense' | 'income') => CategoryStats[];
  getSupplierStats: (categoryId: string) => EntityStats[];
  getEmployeeStats: (categoryId: string) => EntityStats[];
  transactions: FinanceTransaction[];
  categories?: FinanceCategory[];
}

import { formatCurrency } from '@/lib/format';

const formatCompact = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toFixed(0);
};

// Custom tooltip component
function CustomTooltip({ active, payload, label, labelFormatter }: any) {
  if (!active || !payload?.length) return null;
  const displayLabel = labelFormatter ? labelFormatter(label, payload) : label;
  return (
    <div className="rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground mb-0.5">{displayLabel}</p>
      <p className="text-sm font-bold text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function FinanceCharts({
  selectedMonth,
  onMonthChange,
  expensesByCategory,
  incomeByCategory,
  dailyExpenses,
  dailyIncome,
  getSubcategoryStats,
  getSupplierStats,
  getEmployeeStats,
  transactions,
  categories: categoriesProp = [],
}: FinanceChartsProps) {
  const [viewType, setViewType] = useState<'categories' | 'timeline' | 'bars'>('categories');
  const [dataType, setDataType] = useState<'expense' | 'income'>('expense');
  const [drillDownCategory, setDrillDownCategory] = useState<FinanceCategory | null>(null);
  const [entityView, setEntityView] = useState<'employees' | 'suppliers' | null>(null);
  const [entityData, setEntityData] = useState<EntityStats[]>([]);

  const categoryData = dataType === 'expense' ? expensesByCategory : incomeByCategory;
  const subcategoryData = drillDownCategory ? getSubcategoryStats(drillDownCategory.id, dataType) : [];
  const displayData = drillDownCategory ? subcategoryData : categoryData;
  const displayTotal = displayData.reduce((sum, c) => sum + c.amount, 0);

  const detectEntityData = useCallback((categoryId: string): { type: 'employees' | 'suppliers' | null; data: EntityStats[] } => {
    const relevantTxs = transactions.filter(t => {
      if (!t.is_paid) return false;
      if (t.type !== 'expense' && t.type !== 'credit_card') return false;
      if (!t.category) return false;
      return t.category.id === categoryId || t.category.parent_id === categoryId;
    });
    const hasEmployees = relevantTxs.some(t => t.employee_id);
    const hasSuppliers = relevantTxs.some(t => t.supplier_id);
    if (hasEmployees) return { type: 'employees', data: getEmployeeStats(categoryId) };
    if (hasSuppliers) return { type: 'suppliers', data: getSupplierStats(categoryId) };
    return { type: null, data: [] };
  }, [transactions, getEmployeeStats, getSupplierStats]);

  const handleCategoryClick = (category: FinanceCategory) => {
    if (!drillDownCategory) {
      setDrillDownCategory(category);
      setEntityView(null);
      setEntityData([]);
    } else if (!entityView) {
      const detected = detectEntityData(category.id);
      if (detected.type) {
        setEntityView(detected.type);
        setEntityData(detected.data);
      }
    }
  };

  const handleBack = () => {
    if (entityView) {
      setEntityView(null);
      setEntityData([]);
    } else {
      setDrillDownCategory(null);
    }
  };

  useEffect(() => {
    setDrillDownCategory(null);
    setEntityView(null);
    setEntityData([]);
  }, [dataType]);

  const entityTotal = entityData.reduce((sum, e) => sum + e.amount, 0);

  // Prepare bar chart data with proper names
  const barData = (entityView ? entityData : displayData).map((entry: any) => ({
    name: entityView ? entry.name : entry.category?.name || '',
    amount: entry.amount,
    color: entityView ? entry.color : entry.category?.color || '#6366f1',
  }));

  // Prepare area chart data with cumulative
  const timelineData = (dataType === 'expense' ? dailyExpenses : dailyIncome).map(d => ({
    ...d,
    day: new Date(d.date + 'T12:00:00').getDate(),
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  }));

  const strokeColor = dataType === 'expense' ? '#ef4444' : 'hsl(142, 71%, 45%)';
  const gradientId = dataType === 'expense' ? 'expenseGradient' : 'incomeGradient';

  return (
    <div className="space-y-4">
      <div className="px-4 pt-3 lg:px-6">
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
      </div>

      {/* Data Type Toggle */}
      <div className="px-4">
        <div className="tab-command">
          {['expense', 'income'].map(type => (
            <button
              key={type}
              onClick={() => setDataType(type as 'expense' | 'income')}
              className={cn("tab-command-item", dataType === type && "tab-command-item-active")}
            >
              {type === 'expense' ? 'Despesas' : 'Receitas'}
            </button>
          ))}
        </div>
      </div>

      {/* View Type Toggle */}
      <div className="px-4">
        <div className="tab-command">
          {[
            { value: 'categories', label: 'Categorias' },
            { value: 'timeline', label: 'Linha' },
            { value: 'bars', label: 'Barras' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setViewType(tab.value as 'categories' | 'timeline' | 'bars')}
              className={cn("tab-command-item", viewType === tab.value && "tab-command-item-active")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drill-down header */}
      {(drillDownCategory || entityView) && (
        <div className="px-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
            <AppIcon name="ChevronLeft" size={16} />
            Voltar
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {entityView
              ? `${drillDownCategory?.name} › ${entityView === 'employees' ? 'Funcionários' : 'Fornecedores'}`
              : drillDownCategory?.name
            }
          </span>
        </div>
      )}

      {/* Charts */}
      <div className="px-4 pb-32 overflow-hidden">

        {/* ═══ PIE / DONUT — Categories ═══ */}
        {viewType === 'categories' && !entityView && (
          <div className="space-y-5">
            {displayData.length > 0 ? (
              <>
                <div className="relative overflow-hidden" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        dataKey="amount"
                        nameKey="category.name"
                        paddingAngle={2}
                        cornerRadius={4}
                        stroke="none"
                      >
                        {displayData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.category.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip labelFormatter={(_: any, p: any) => p[0]?.payload?.category?.name || ''} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-bold text-foreground">{formatCurrency(displayTotal)}</p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </div>
                </div>

                {/* Category List */}
                <div className="card-surface rounded-2xl overflow-hidden divide-y divide-border/40">
                  {displayData.map((item) => (
                    <button
                      key={item.category.id}
                      onClick={() => handleCategoryClick(item.category)}
                      disabled={!!entityView}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 active:bg-secondary/50 transition-colors text-left"
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card"
                        style={{ backgroundColor: item.category.color, '--tw-ring-color': item.category.color } as React.CSSProperties}
                      />
                      <span className="flex-1 text-left font-medium text-sm truncate text-foreground">{item.category.name}</span>
                      <span className="text-muted-foreground text-xs tabular-nums mr-2">{item.percentage.toFixed(1)}%</span>
                      <span className="font-semibold text-sm tabular-nums text-foreground">{formatCurrency(item.amount)}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>Sem dados para exibir</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ PIE / DONUT — Entity View ═══ */}
        {viewType === 'categories' && entityView && (
          <div className="space-y-5">
            {entityData.length > 0 ? (
              <>
                <div className="relative overflow-hidden" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={entityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        dataKey="amount"
                        nameKey="name"
                        paddingAngle={2}
                        cornerRadius={4}
                        stroke="none"
                      >
                        {entityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip labelFormatter={(_: any, p: any) => p[0]?.payload?.name || ''} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-bold text-foreground">{formatCurrency(entityTotal)}</p>
                    <p className="text-xs text-muted-foreground">
                      {entityView === 'employees' ? 'funcionários' : 'fornecedores'}
                    </p>
                  </div>
                </div>

                <div className="card-surface rounded-2xl overflow-hidden divide-y divide-border/40">
                  {entityData.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 w-full px-4 py-3.5"
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card"
                        style={{ backgroundColor: item.color, '--tw-ring-color': item.color } as React.CSSProperties}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.count} lançamento{item.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="text-muted-foreground text-xs tabular-nums mr-2">{item.percentage.toFixed(1)}%</span>
                      <span className="font-semibold text-sm tabular-nums text-foreground">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>Sem {entityView === 'employees' ? 'funcionários' : 'fornecedores'} vinculados</p>
                <p className="text-xs mt-1">
                  {entityView === 'employees'
                    ? 'Os pagamentos precisam estar vinculados ao cadastro de funcionários'
                    : 'As transações precisam ter um fornecedor vinculado'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══ AREA / LINE CHART ═══ */}
        {viewType === 'timeline' && (
          <div className="space-y-3">
            {timelineData.length > 0 ? (
              <div className="card-base p-3" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={strokeColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tickFormatter={formatCompact}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      width={45}
                    />
                    <RechartsTooltip
                      content={<CustomTooltip labelFormatter={(d: any) => `Dia ${d}`} />}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke={strokeColor}
                      strokeWidth={2.5}
                      fill={`url(#${gradientId})`}
                      dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: strokeColor, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>Sem dados para exibir</p>
              </div>
            )}

            {/* Summary stats below chart */}
            {timelineData.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="card-base p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                  <p className="text-sm font-bold tabular-nums">
                    {formatCurrency(timelineData.reduce((s, d) => s + d.amount, 0))}
                  </p>
                </div>
                <div className="card-base p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Média/dia</p>
                  <p className="text-sm font-bold tabular-nums">
                    {formatCurrency(timelineData.reduce((s, d) => s + d.amount, 0) / (timelineData.length || 1))}
                  </p>
                </div>
                <div className="card-base p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Maior</p>
                  <p className="text-sm font-bold tabular-nums">
                    {formatCurrency(Math.max(...timelineData.map(d => d.amount)))}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ BAR CHART ═══ */}
        {viewType === 'bars' && (
          <div className="space-y-3">
            {barData.length > 0 ? (
              <>
                <div className="card-base p-3" style={{ height: Math.max(300, barData.length * 50) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.3}
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tickFormatter={formatCompact}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <RechartsTooltip
                        content={<CustomTooltip labelFormatter={(_: any, p: any) => p[0]?.payload?.name || ''} />}
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                      />
                      <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={28}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend below */}
                <div className="space-y-1.5">
                  {barData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="text-xs font-medium tabular-nums">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>Sem dados para exibir</p>
              </div>
            )}
          </div>
        )}

        {/* DRE Report */}
        <div className="mt-8">
          <DREReport transactions={transactions} categories={categoriesProp} monthLabel={`${selectedMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`} />
        </div>
      </div>
    </div>
  );
}
