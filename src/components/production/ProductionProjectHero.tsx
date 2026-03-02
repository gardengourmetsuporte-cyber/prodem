import { useMemo, useState, useRef, useEffect } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { ProductionProject } from '@/hooks/useProductionProjects';
import { GroupingWithItems } from '@/hooks/useProductionGroupings';
import { cn } from '@/lib/utils';

interface ProductionProjectHeroProps {
  project: ProductionProject | null;
  progress: { ordered: number; done: number; pending: number; percent: number };
  isAdmin: boolean;
  onManageProjects: () => void;
  onViewHistory?: () => void;
  activeProjects?: ProductionProject[];
  selectedProjectId?: string | null;
  onSelectProject?: (id: string) => void;
  groupings?: GroupingWithItems[];
  onManageGroupings?: () => void;
}

export function ProductionProjectHero({ project, progress, isAdmin, onManageProjects, onViewHistory, activeProjects = [], selectedProjectId, onSelectProject, groupings = [], onManageGroupings }: ProductionProjectHeroProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Group projects by client
  const groupedByClient = useMemo(() => {
    const map = new Map<string, ProductionProject[]>();
    activeProjects.forEach(p => {
      const client = p.client || 'Sem cliente';
      if (!map.has(client)) map.set(client, []);
      map.get(client)!.push(p);
    });
    return map;
  }, [activeProjects]);

  if (!project) {
    if (!isAdmin) return null;
    return (
      <button
        onClick={onManageProjects}
        className="w-full rounded-2xl p-5 text-left transition-all industrial-card hover:ring-warning/40 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0 ring-1 ring-warning/30">
            <AppIcon name="Briefcase" size={24} className="text-warning" />
          </div>
          <div className="flex-1">
            <span className="text-base font-black text-foreground uppercase tracking-wide">Cadastrar OS / Projeto</span>
            <p className="text-xs text-muted-foreground">Vincule peças a uma ordem de serviço</p>
          </div>
          <AppIcon name="Plus" size={20} className="text-warning group-hover:scale-110 transition-transform" />
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* Project selector — modern segmented tabs */}
      {onSelectProject && activeProjects.length > 0 && (
        <div className="flex gap-2 items-center mb-6">
          {/* Dropdown selector */}
          <div ref={dropdownRef} className="relative flex-1">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-[24px] bg-card border-none hover:ring-1 hover:ring-warning/30 transition-all text-left group gap-3"
            >
              <div className="flex items-center gap-3 w-full">
                <span className="text-sm font-black text-warning">#{project.project_number}</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[15px] font-black text-foreground uppercase truncate tracking-wide leading-tight">
                    {project.description}
                  </span>
                  {project.client && (
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest truncate">
                      {project.client}
                    </span>
                  )}
                </div>
              </div>
              <AppIcon name="ChevronsUpDown" size={16} className="text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground/70 transition-colors" />
            </button>

            {/* Dropdown list */}
            {dropdownOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-2 rounded-[20px] bg-popover border border-border/10 shadow-xl overflow-hidden max-h-[300px] overflow-y-auto">
                {[...groupedByClient.entries()].map(([client, projects]) => (
                  <div key={client}>
                    {/* Client group header */}
                    <div className="px-4 py-2 bg-muted/10 flex items-center gap-1.5 sticky top-0 backdrop-blur-sm z-10 border-b border-border/5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{client}</span>
                    </div>
                    {/* Project items */}
                    {projects.map(p => {
                      const isActive = p.id === project?.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => { onSelectProject(p.id); setDropdownOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
                            isActive
                              ? "bg-warning/10 text-warning"
                              : "hover:bg-muted/10 text-foreground"
                          )}
                        >
                          <span className={cn("text-[13px] font-black w-14", isActive ? "text-warning" : "text-muted-foreground")}>
                            #{p.project_number}
                          </span>
                          <span className="text-[13px] font-bold uppercase truncate flex-1">{p.description}</span>
                          {isActive && <AppIcon name="Check" size={16} className="text-warning shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History button */}
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="flex items-center justify-center w-[54px] h-[54px] rounded-full bg-card border-none hover:ring-1 hover:ring-warning/30 text-muted-foreground hover:text-foreground transition-all shrink-0"
              title="Histórico de OS"
            >
              <AppIcon name="History" size={20} />
            </button>
          )}
        </div>
      )}

      <div className="relative overflow-hidden rounded-[32px] bg-card/60 ring-1 ring-border/5 p-6 shadow-sm">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between relative">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-warning">Ordem de Serviço</span>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/[0.03]",
                  progress.percent >= 100
                    ? "text-success"
                    : progress.percent > 0
                      ? "text-warning"
                      : "text-muted-foreground"
                )}>
                  {progress.percent >= 100 ? '○ CONCLUÍDO' : progress.percent > 0 ? '● EM PRODUÇÃO' : '○ AGUARDANDO'}
                </span>
              </div>
              <h2 className="text-[44px] font-black text-foreground tracking-tight font-display leading-[0.9] mb-1.5">
                #{project.project_number}
              </h2>
              <p className="text-[17px] font-bold text-foreground/80 uppercase tracking-widest">{project.description}</p>
            </div>
            {isAdmin && (
              <button
                onClick={onManageProjects}
                className="w-12 h-12 rounded-full border border-blue-400/30 flex items-center justify-center bg-card shadow-sm hover:scale-105 transition-all text-muted-foreground hover:text-foreground absolute right-0 top-0"
              >
                <AppIcon name="Settings" size={20} />
              </button>
            )}
          </div>

          {/* Client & Technical Specs */}
          <div className="flex items-center gap-3 flex-wrap pt-2">
            {project.client && (
              <div className="flex items-center gap-1.5 text-warning">
                <AppIcon name="Building2" size={14} />
                <span className="text-xs font-black uppercase tracking-wider">{project.client}</span>
              </div>
            )}
            {(project as any).material && (
              <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-secondary/80 border border-border/20 text-foreground/70">
                {(project as any).material}
              </span>
            )}
            {(project as any).thickness && (
              <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-secondary/80 border border-border/20 text-foreground/70">
                ⌀ {(project as any).thickness}
              </span>
            )}
            {(project as any).plate_size && (
              <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-secondary/80 border border-border/20 text-foreground/70 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3l-3.6-3.6" /><path d="M11.4 5.4l3.6 3.6" /><path d="M5.4 11.4l3.6 3.6" /><path d="M21.3 5.3a2 2 0 0 0-2.8 0l-13 13a2 2 0 0 0 0 2.8 2 2 0 0 0 2.8 0l13-13a2 2 0 0 0 0-2.8Z" /><path d="M15.3 21.3l3.6-3.6" /></svg>
                {(project as any).plate_size}
              </span>
            )}
          </div>

          {/* Groupings summary */}
          {groupings.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap pt-3">
              {groupings.map(g => (
                <button
                  key={g.id}
                  onClick={onManageGroupings}
                  className="flex items-center gap-2 px-4 py-2 rounded-[20px] border border-warning/20 bg-warning/[0.08] hover:border-warning/40 transition-colors"
                >
                  <span className="text-[11px] font-black text-warning">AG{g.grouping_number}</span>
                  <span className="text-[11px] font-medium text-muted-foreground">{g.total_pieces}pç</span>
                  {g.thickness && <span className="text-[11px] font-mono text-foreground/60">{g.thickness}</span>}
                </button>
              ))}
              {isAdmin && (
                <button onClick={onManageGroupings} className="text-warning hover:scale-110 transition-transform p-1.5 flex items-center justify-center">
                  <AppIcon name="Plus" size={20} />
                </button>
              )}
            </div>
          )}
          {groupings.length === 0 && isAdmin && onManageGroupings && (
            <div className="pt-2">
              <button
                onClick={onManageGroupings}
                className="flex items-center gap-2 px-4 py-2 rounded-[20px] border border-warning/20 bg-warning/[0.08] hover:bg-warning/15 transition-colors text-left"
              >
                <AppIcon name="Plus" size={16} className="text-warning" />
                <span className="text-[11px] font-black text-warning uppercase">Adicionar agrupamento CNC</span>
              </button>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-5 pt-8">
            <div className="w-full h-2 rounded-full bg-white/[0.03] overflow-hidden relative">
              <div
                className="absolute top-0 left-0 bottom-0 bg-warning transition-all duration-700 ease-out"
                style={{ width: `${Math.min(progress.percent, 100)}%` }}
              />
            </div>
            <div className="flex items-end justify-between px-1">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] text-muted-foreground font-bold tracking-[0.15em] uppercase">Feito</span>
                  <span className="text-2xl font-black text-foreground">{progress.done}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] text-muted-foreground font-bold tracking-[0.15em] uppercase">Total</span>
                  <span className="text-2xl font-black text-muted-foreground">{progress.ordered}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] text-muted-foreground font-bold tracking-[0.15em] uppercase">Falta</span>
                  <span className="text-2xl font-black text-warning">{progress.pending}</span>
                </div>
              </div>
              <span className={cn(
                "text-[40px] font-black font-display leading-[0.8]",
                progress.percent >= 100 ? "text-success" : "text-warning"
              )}>
                {progress.percent}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
