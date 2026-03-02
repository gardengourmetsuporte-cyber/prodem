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
      {onSelectProject && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-muted/20 rounded-xl p-1 ring-1 ring-border/10">
          {activeProjects.map((p) => {
            const isActive = selectedProjectId === p.id || (!selectedProjectId && p.id === project?.id);
            return (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 min-h-[42px]",
                  isActive
                    ? "bg-background text-warning shadow-md shadow-warning/5 ring-1 ring-warning/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                )}
              >
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-warning" />
                )}
                <span className="font-black text-sm tracking-tight">#{p.project_number}</span>
                {p.client && (
                  <span className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    isActive ? "text-warning/70" : "opacity-50"
                  )}>
                    {p.client}
                  </span>
                )}
              </button>
            );
          })}
          {/* History button */}
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap text-muted-foreground/60 hover:text-foreground hover:bg-background/40 transition-all min-h-[42px]"
              title="Histórico de OS"
            >
              <AppIcon name="History" size={14} />
              <span className="text-[10px]">Todas</span>
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
