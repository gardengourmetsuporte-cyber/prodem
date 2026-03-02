import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductionProject } from '@/hooks/useProductionProjects';

interface ProductionOrdersHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProductionProject[];
  unitId: string | null;
  onNavigateToDate: (date: Date, projectId: string) => void;
}

interface OrderSummary {
  project_id: string;
  date: string;
  shift: number;
  status: string;
  total_items: number;
}

export function ProductionOrdersHistory({
  open, onOpenChange, projects, unitId, onNavigateToDate,
}: ProductionOrdersHistoryProps) {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['production-orders-history', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_orders')
        .select('id, project_id, date, shift, status, production_order_items(id)')
        .eq('unit_id', unitId!)
        .not('project_id', 'is', null)
        .order('date', { ascending: false })
        .order('shift', { ascending: true });
      if (error) throw error;
      return (data || []).map(o => ({
        project_id: o.project_id as string,
        date: o.date,
        shift: o.shift,
        status: o.status,
        total_items: (o.production_order_items as any[])?.length || 0,
      })) as OrderSummary[];
    },
    enabled: !!unitId && open,
  });

  const projectMap = useMemo(() => {
    const map = new Map<string, { project: ProductionProject; orders: OrderSummary[] }>();
    projects.forEach(p => {
      const projectOrders = orders.filter(o => o.project_id === p.id);
      if (projectOrders.length > 0) {
        map.set(p.id, { project: p, orders: projectOrders });
      }
    });
    return map;
  }, [projects, orders]);

  const activeWithoutOrders = useMemo(() => {
    return projects.filter(p => p.status === 'active' && !projectMap.has(p.id));
  }, [projects, projectMap]);

  const getProjectStatus = (projectOrders: OrderSummary[], project: ProductionProject) => {
    const allClosed = projectOrders.every(o => o.status === 'closed');
    const dates = [...new Set(projectOrders.map(o => o.date))].sort();
    return {
      status: project.status === 'archived' ? 'archived' as const : allClosed ? 'completed' as const : 'in_progress' as const,
      firstDate: dates[0],
      lastDate: dates[dates.length - 1],
      totalDays: dates.length,
      totalShifts: projectOrders.length,
    };
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl flex flex-col p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/10">
          <SheetHeader className="p-0">
            <SheetTitle className="flex items-center gap-2.5 text-lg">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <AppIcon name="ClipboardList" size={16} className="text-warning" />
              </div>
              Histórico de Ordens
            </SheetTitle>
          </SheetHeader>
          <p className="text-xs text-muted-foreground/70 mt-1.5 ml-[42px]">
            {projectMap.size} {projectMap.size === 1 ? 'projeto com produção' : 'projetos com produção'}
            {activeWithoutOrders.length > 0 && ` · ${activeWithoutOrders.length} sem registros`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4 space-y-3">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 rounded-2xl bg-muted/10 animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && projectMap.size === 0 && activeWithoutOrders.length === 0 && (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center mx-auto ring-1 ring-border/10">
                <AppIcon name="Briefcase" size={28} className="text-muted-foreground/30" />
              </div>
              <div>
                <p className="font-bold text-muted-foreground">Nenhuma ordem registrada</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Crie um projeto e planeje o primeiro turno</p>
              </div>
            </div>
          )}

          {/* Projects with orders */}
          {[...projectMap.values()].map(({ project, orders: projectOrders }) => {
            const info = getProjectStatus(projectOrders, project);
            const dates = [...new Set(projectOrders.map(o => o.date))].sort();
            const totalItems = projectOrders.reduce((s, o) => s + o.total_items, 0);

            return (
              <div
                key={project.id}
                className={cn(
                  "rounded-2xl overflow-hidden transition-all",
                  info.status === 'completed'
                    ? "bg-success/[0.03] ring-1 ring-success/15"
                    : info.status === 'archived'
                      ? "bg-muted/[0.03] ring-1 ring-border/10 opacity-50"
                      : "bg-card ring-1 ring-warning/20"
                )}
              >
                {/* Project header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* OS badge */}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ring-1",
                      info.status === 'completed'
                        ? "bg-success/10 ring-success/20"
                        : info.status === 'archived'
                          ? "bg-muted/15 ring-border/10"
                          : "bg-warning/10 ring-warning/20"
                    )}>
                      <span className={cn(
                        "text-xs font-black",
                        info.status === 'completed' ? "text-success" : info.status === 'archived' ? "text-muted-foreground" : "text-warning"
                      )}>
                        #{project.project_number}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground truncate">{project.description}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {project.client && (
                          <span className="text-[11px] text-muted-foreground/70">{project.client}</span>
                        )}
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                          info.status === 'completed'
                            ? "bg-success/10 text-success ring-1 ring-success/20"
                            : info.status === 'archived'
                              ? "bg-muted/20 text-muted-foreground"
                              : "bg-warning/10 text-warning ring-1 ring-warning/20"
                        )}>
                          {info.status === 'completed' ? '✓ Concluído' : info.status === 'archived' ? 'Arquivado' : '● Em produção'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-3 ml-[60px]">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                      <AppIcon name="Calendar" size={11} className="opacity-60" />
                      <span className="font-medium">
                        {format(new Date(info.firstDate + 'T12:00:00'), "dd/MM", { locale: ptBR })}
                        {info.firstDate !== info.lastDate && (
                          <> → {format(new Date(info.lastDate + 'T12:00:00'), "dd/MM", { locale: ptBR })}</>
                        )}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-border/20" />
                    <span className="text-[10px] text-muted-foreground/60 font-medium">
                      {info.totalDays}d · {info.totalShifts}t · {totalItems} itens
                    </span>
                  </div>
                </div>

                {/* Timeline dates */}
                <div className="px-3 pb-3 -mt-1">
                  <div className="flex gap-2 overflow-x-auto scrollbar-none py-1 px-1">
                    {dates.map(date => {
                      const dayOrders = projectOrders.filter(o => o.date === date);
                      const allDayClosed = dayOrders.every(o => o.status === 'closed');
                      const anyDayActive = dayOrders.some(o => o.status === 'active');

                      return (
                        <button
                          key={date}
                          onClick={() => onNavigateToDate(new Date(date + 'T12:00:00'), project.id)}
                          className={cn(
                            "flex flex-col items-center gap-1 px-3.5 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all min-w-[56px]",
                            "active:scale-95",
                            allDayClosed
                              ? "bg-success/8 text-success/90 ring-1 ring-success/15 hover:ring-success/30"
                              : anyDayActive
                                ? "bg-warning/8 text-warning ring-1 ring-warning/20 hover:ring-warning/40"
                                : "bg-muted/8 text-muted-foreground/60 ring-1 ring-border/10 hover:ring-border/20"
                          )}
                        >
                          <span className="text-[11px] font-black">
                            {format(new Date(date + 'T12:00:00'), "dd/MM", { locale: ptBR })}
                          </span>
                          <div className="flex gap-1">
                            {dayOrders.map(o => (
                              <div
                                key={`${o.date}-${o.shift}`}
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full transition-colors",
                                  o.status === 'closed' ? "bg-success" : o.status === 'active' ? "bg-warning" : "bg-muted-foreground/30"
                                )}
                                title={`T${o.shift}: ${o.status}`}
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Active projects without orders */}
          {activeWithoutOrders.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 px-1">
                <div className="h-px flex-1 bg-border/10" />
                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]">Sem produção</span>
                <div className="h-px flex-1 bg-border/10" />
              </div>
              {activeWithoutOrders.map(project => (
                <div key={project.id} className="rounded-xl p-3.5 bg-muted/[0.03] ring-1 ring-border/8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/10 flex items-center justify-center ring-1 ring-border/10">
                    <span className="text-[10px] font-black text-muted-foreground/50">#{project.project_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground/70 truncate">{project.description}</p>
                    {project.client && <p className="text-[10px] text-muted-foreground/40 mt-0.5">{project.client}</p>}
                  </div>
                  <span className="text-[8px] font-bold text-muted-foreground/30 uppercase tracking-wider bg-muted/10 px-2 py-1 rounded-md">Nova</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
