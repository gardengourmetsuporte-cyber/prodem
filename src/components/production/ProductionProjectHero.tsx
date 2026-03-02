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

    <div className="production-os-hero relative overflow-hidden rounded-2xl p-5">
      {/* Industrial pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, currentColor 20px, currentColor 21px)' }}
      />
      
      {/* Corner accent */}
      <div className="absolute top-0 left-0 w-1 h-full bg-warning rounded-l-2xl" />
      
      <div className="relative z-10 space-y-3 pl-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-warning/80">Ordem de Serviço</span>
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                progress.percent >= 100
                  ? "bg-success/20 text-success"
                  : progress.percent > 0
                    ? "bg-warning/20 text-warning"
                    : "bg-muted/40 text-muted-foreground"
              )}>
                {progress.percent >= 100 ? '✓ CONCLUÍDO' : progress.percent > 0 ? '● EM PRODUÇÃO' : '○ AGUARDANDO'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight font-display">
              #{project.project_number}
            </h2>
            <p className="text-sm font-semibold text-foreground/80 leading-tight mt-0.5">{project.description}</p>
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
        <div className="flex items-center gap-3 flex-wrap">
          {project.client && (
            <div className="flex items-center gap-1.5">
              <AppIcon name="Building2" size={12} className="text-warning/60" />
              <span className="text-xs font-bold text-warning/80 uppercase tracking-wider">{project.client}</span>
            </div>
          )}
          {(project as any).material && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-background/40 ring-1 ring-border/20 text-foreground/70">
              {(project as any).material}
            </span>
          )}
          {(project as any).thickness && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-background/40 ring-1 ring-border/20 text-foreground/70">
              ⌀ {(project as any).thickness}
            </span>
          )}
          {(project as any).plate_size && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-background/40 ring-1 ring-border/20 text-foreground/70">
              📐 {(project as any).plate_size}
            </span>
          )}
        </div>

        {/* Groupings summary */}
        {groupings.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {groupings.map(g => (
              <button
                key={g.id}
                onClick={onManageGroupings}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-warning/10 ring-1 ring-warning/20 hover:ring-warning/40 transition-colors"
              >
                <span className="text-[9px] font-black text-warning">AG{g.grouping_number}</span>
                <span className="text-[8px] text-muted-foreground">{g.total_pieces}pç</span>
                {g.thickness && <span className="text-[8px] font-mono text-foreground/50">{g.thickness}</span>}
              </button>
            ))}
            {isAdmin && (
              <button onClick={onManageGroupings} className="p-1 rounded-lg hover:bg-warning/10 transition-colors">
                <AppIcon name="Plus" size={12} className="text-warning/60" />
              </button>
            )}
          </div>
        )}
        {groupings.length === 0 && isAdmin && onManageGroupings && (
          <button
            onClick={onManageGroupings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/5 ring-1 ring-warning/15 hover:ring-warning/30 transition-colors text-left"
          >
            <AppIcon name="Layers" size={14} className="text-warning/50" />
            <span className="text-[10px] text-muted-foreground">Cadastrar agrupamentos CNC</span>
          </button>
        )}

        {/* Progress */}
        <div className="space-y-2 pt-1">
          <div className="w-full h-2.5 rounded-sm bg-background/50 overflow-hidden ring-1 ring-border/20">
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(progress.percent, 100)}%`,
                background: progress.percent >= 100
                  ? 'hsl(var(--success))'
                  : 'linear-gradient(90deg, hsl(var(--warning)), hsl(var(--warning) / 0.7))',
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground uppercase">Feito</span>
                <span className="text-sm font-black text-foreground">{progress.done}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground uppercase">Total</span>
                <span className="text-sm font-black text-muted-foreground">{progress.ordered}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground uppercase">Falta</span>
                <span className="text-sm font-black text-warning">{progress.pending}</span>
              </div>
            </div>
            <span className={cn(
              "text-xl font-black font-display",
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
