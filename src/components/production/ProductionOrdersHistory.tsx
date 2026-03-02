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
  // Fetch all orders with item counts
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

  // Group by project
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

  // Also include active projects without orders
  const activeWithoutOrders = useMemo(() => {
    return projects.filter(p => p.status === 'active' && !projectMap.has(p.id));
  }, [projects, projectMap]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'closed': return { label: 'Fechado', color: 'text-success', bg: 'bg-success/10', icon: 'CheckCircle' as const };
      case 'active': return { label: 'Ativo', color: 'text-warning', bg: 'bg-warning/10', icon: 'Play' as const };
      default: return { label: 'Rascunho', color: 'text-muted-foreground', bg: 'bg-muted/20', icon: 'FileText' as const };
    }
  };

  const getProjectStatus = (projectOrders: OrderSummary[]) => {
    const allClosed = projectOrders.every(o => o.status === 'closed');
    const anyActive = projectOrders.some(o => o.status === 'active');
    const dates = [...new Set(projectOrders.map(o => o.date))].sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    return { allClosed, anyActive, firstDate, lastDate, totalDays: dates.length };
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl flex flex-col p-0">
        <div className="px-6 pt-5 pb-3">
          <SheetHeader className="p-0">
            <SheetTitle className="flex items-center gap-2">
              <AppIcon name="ClipboardList" size={20} className="text-warning" />
              <span>Histórico de Ordens</span>
            </SheetTitle>
          </SheetHeader>
          <p className="text-xs text-muted-foreground mt-1">Todas as OS com datas de produção e status</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-2xl bg-muted/15 animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && projectMap.size === 0 && activeWithoutOrders.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/10 flex items-center justify-center mx-auto">
                <AppIcon name="Briefcase" size={28} className="text-muted-foreground/30" />
              </div>
              <p className="font-semibold text-muted-foreground">Nenhuma ordem registrada</p>
            </div>
          )}

          {/* Projects with orders */}
          {[...projectMap.values()].map(({ project, orders: projectOrders }) => {
            const { allClosed, firstDate, lastDate, totalDays } = getProjectStatus(projectOrders);
            const projectStatus = project.status === 'archived' ? 'archived' : allClosed ? 'completed' : 'in_progress';

            return (
              <div
                key={project.id}
                className={cn(
                  "rounded-2xl ring-1 overflow-hidden transition-all",
                  projectStatus === 'completed'
                    ? "ring-success/20 bg-success/5"
                    : projectStatus === 'archived'
                      ? "ring-border/10 bg-muted/5 opacity-60"
                      : "ring-warning/20 bg-card"
                )}
              >
                {/* Project header */}
                <div className="p-4 pb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      projectStatus === 'completed' ? "bg-success/15" : "bg-warning/15"
                    )}>
                      <span className={cn(
                        "text-sm font-black",
                        projectStatus === 'completed' ? "text-success" : "text-warning"
                      )}>
                        #{project.project_number}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{project.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {project.client && (
                          <span className="text-[10px] text-muted-foreground">{project.client}</span>
                        )}
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                          projectStatus === 'completed'
                            ? "bg-success/15 text-success"
                            : projectStatus === 'archived'
                              ? "bg-muted/30 text-muted-foreground"
                              : "bg-warning/15 text-warning"
                        )}>
                          {projectStatus === 'completed' ? '✓ Concluído' : projectStatus === 'archived' ? 'Arquivado' : '● Em produção'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Period info */}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <AppIcon name="Calendar" size={10} />
                      <span>{format(new Date(firstDate + 'T12:00:00'), "dd/MM", { locale: ptBR })}</span>
                      {firstDate !== lastDate && (
                        <>
                          <span>→</span>
                          <span>{format(new Date(lastDate + 'T12:00:00'), "dd/MM", { locale: ptBR })}</span>
                        </>
                      )}
                    </div>
                    <span className="opacity-50">·</span>
                    <span>{totalDays} {totalDays === 1 ? 'dia' : 'dias'}</span>
                    <span className="opacity-50">·</span>
                    <span>{projectOrders.length} {projectOrders.length === 1 ? 'turno' : 'turnos'}</span>
                  </div>
                </div>

                {/* Order dates */}
                <div className="px-3 pb-3">
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-1">
                    {/* Group by date */}
                    {[...new Set(projectOrders.map(o => o.date))].map(date => {
                      const dayOrders = projectOrders.filter(o => o.date === date);
                      const allDayClosed = dayOrders.every(o => o.status === 'closed');
                      const anyDayActive = dayOrders.some(o => o.status === 'active');

                      return (
                        <button
                          key={date}
                          onClick={() => onNavigateToDate(new Date(date + 'T12:00:00'), project.id)}
                          className={cn(
                            "flex flex-col items-center px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ring-1 min-w-[60px]",
                            allDayClosed
                              ? "bg-success/10 text-success ring-success/20"
                              : anyDayActive
                                ? "bg-warning/10 text-warning ring-warning/20"
                                : "bg-muted/10 text-muted-foreground ring-border/10"
                          )}
                        >
                          <span className="text-[11px] font-black">
                            {format(new Date(date + 'T12:00:00'), "dd/MM", { locale: ptBR })}
                          </span>
                          <div className="flex gap-0.5 mt-0.5">
                            {dayOrders.map(o => (
                              <div
                                key={`${o.date}-${o.shift}`}
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
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
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Sem produção registrada</p>
              {activeWithoutOrders.map(project => (
                <div key={project.id} className="rounded-xl p-3 bg-muted/5 ring-1 ring-border/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center">
                    <span className="text-xs font-black text-muted-foreground">#{project.project_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">{project.description}</p>
                    {project.client && <p className="text-[10px] text-muted-foreground/60">{project.client}</p>}
                  </div>
                  <span className="text-[9px] text-muted-foreground/50 uppercase">Nova</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
