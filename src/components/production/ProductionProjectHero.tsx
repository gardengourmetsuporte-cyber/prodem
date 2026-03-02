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
        <div className="flex gap-2 items-center">
          {/* Dropdown selector */}
          <div ref={dropdownRef} className="relative flex-1">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/20 ring-1 ring-border/10 hover:ring-warning/30 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-warning">#{project.project_number}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{project.description}</p>
                {project.client && (
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{project.client}</p>
                )}
              </div>
              <AppIcon name="ChevronsUpDown" size={16} className="text-muted-foreground/50 shrink-0" />
            </button>

            {/* Dropdown list */}
            {dropdownOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-xl bg-popover border border-border/20 shadow-xl overflow-hidden max-h-[300px] overflow-y-auto">
                {[...groupedByClient.entries()].map(([client, projects]) => (
                  <div key={client}>
                    {/* Client group header */}
                    <div className="px-3 py-1.5 bg-muted/30 flex items-center gap-1.5 sticky top-0">
                      <AppIcon name="Building2" size={10} className="text-muted-foreground/50" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{client}</span>
                      <span className="text-[9px] text-muted-foreground/40 ml-auto">{projects.length}</span>
                    </div>
                    {/* Project items */}
                    {projects.map(p => {
                      const isActive = p.id === project?.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => { onSelectProject(p.id); setDropdownOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                            isActive
                              ? "bg-warning/10 text-warning"
                              : "hover:bg-muted/20 text-foreground"
                          )}
                        >
                          <span className={cn("text-xs font-black", isActive ? "text-warning" : "text-muted-foreground")}>
                            #{p.project_number}
                          </span>
                          <span className="text-xs truncate flex-1">{p.description}</span>
                          {isActive && <AppIcon name="Check" size={14} className="text-warning shrink-0" />}
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
              className="flex items-center gap-1.5 px-3 py-3 rounded-xl bg-muted/20 ring-1 ring-border/10 hover:ring-warning/30 text-muted-foreground hover:text-foreground transition-all shrink-0"
              title="Histórico de OS"
            >
              <AppIcon name="History" size={16} />
            </button>
          )}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-card/60 ring-1 ring-border/15 p-5">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-warning">Ordem de Serviço</span>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-muted/40",
                  progress.percent >= 100
                    ? "text-success"
                    : progress.percent > 0
                      ? "text-warning"
                      : "text-muted-foreground"
                )}>
                  {progress.percent >= 100 ? '○ CONCLUÍDO' : progress.percent > 0 ? '● EM PRODUÇÃO' : '○ AGUARDANDO'}
                </span>
              </div>
              <h2 className="text-4xl font-black text-foreground tracking-tight font-display leading-[0.9] mb-1">
                #{project.project_number}
              </h2>
              <p className="text-lg font-bold text-foreground/80 uppercase tracking-wide">{project.description}</p>
            </div>
            {isAdmin && (
              <button
                onClick={onManageProjects}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <AppIcon name="Settings" size={16} className="text-muted-foreground" />
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
            <div className="flex items-center gap-2 flex-wrap pt-2">
              {groupings.map(g => (
                <button
                  key={g.id}
                  onClick={onManageGroupings}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-warning/20 bg-warning/5 hover:border-warning/40 transition-colors"
                >
                  <span className="text-[10px] font-black text-warning">AG{g.grouping_number}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{g.total_pieces}pç</span>
                  {g.thickness && <span className="text-[10px] font-mono text-foreground/60 ml-0.5">{g.thickness}</span>}
                </button>
              ))}
              {isAdmin && (
                <button onClick={onManageGroupings} className="text-warning hover:scale-110 transition-transform p-1">
                  <AppIcon name="Plus" size={16} />
                </button>
              )}
            </div>
          )}
          {groupings.length === 0 && isAdmin && onManageGroupings && (
            <button
              onClick={onManageGroupings}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-warning/20 bg-warning/5 hover:bg-warning/10 transition-colors text-left mt-2"
            >
              <AppIcon name="Plus" size={14} className="text-warning" />
              <span className="text-[10px] font-bold text-warning uppercase">Adicionar agrupamento CNC</span>
            </button>
          )}

          {/* Progress */}
          <div className="space-y-4 pt-6">
            <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden relative">
              <div
                className="absolute top-0 left-0 bottom-0 bg-warning transition-all duration-700 ease-out"
                style={{ width: `${Math.min(progress.percent, 100)}%` }}
              />
            </div>
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-bold tracking-[0.1em] uppercase">Feito</span>
                  <span className="text-lg font-black text-foreground">{progress.done}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-bold tracking-[0.1em] uppercase">Total</span>
                  <span className="text-lg font-black text-muted-foreground">{progress.ordered}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-bold tracking-[0.1em] uppercase">Falta</span>
                  <span className="text-lg font-black text-warning">{progress.pending}</span>
                </div>
              </div>
              <span className={cn(
                "text-5xl font-black font-display leading-[0.8]",
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
