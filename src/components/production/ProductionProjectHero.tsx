import { AppIcon } from '@/components/ui/app-icon';
import { ProductionProject } from '@/hooks/useProductionProjects';
import { cn } from '@/lib/utils';

interface ProductionProjectHeroProps {
  project: ProductionProject | null;
  progress: { ordered: number; done: number; pending: number; percent: number };
  isAdmin: boolean;
  onManageProjects: () => void;
}

export function ProductionProjectHero({ project, progress, isAdmin, onManageProjects }: ProductionProjectHeroProps) {
  if (!project) {
    if (!isAdmin) return null;
    return (
      <button
        onClick={onManageProjects}
        className="w-full rounded-2xl p-5 text-left transition-all bg-card ring-1 ring-border/40 hover:ring-primary/30 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <AppIcon name="Briefcase" size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <span className="text-base font-bold text-foreground">Cadastrar Projeto / OS</span>
            <p className="text-xs text-muted-foreground">Vincule peças a um projeto com cliente</p>
          </div>
          <AppIcon name="Plus" size={20} className="text-primary group-hover:scale-110 transition-transform" />
        </div>
      </button>
    );
  }

  return (
    <div className="production-project-hero relative overflow-hidden rounded-2xl p-5">
      {/* Glow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/20 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-primary/30">
              <AppIcon name="Briefcase" size={22} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-primary font-display tracking-tight">
                  #{project.project_number}
                </span>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                  progress.percent >= 100
                    ? "bg-success/20 text-success"
                    : progress.percent > 0
                      ? "bg-warning/20 text-warning"
                      : "bg-muted/40 text-muted-foreground"
                )}>
                  {progress.percent >= 100 ? 'Concluído' : progress.percent > 0 ? 'Em produção' : 'Aguardando'}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground/90 leading-tight">{project.description}</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={onManageProjects}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <AppIcon name="Settings" size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Client badge */}
        {project.client && (
          <div className="flex items-center gap-2">
            <AppIcon name="Building2" size={12} className="text-muted-foreground/60" />
            <span className="text-xs font-medium text-muted-foreground">{project.client}</span>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(progress.percent, 100)}%`,
                background: progress.percent >= 100
                  ? 'hsl(var(--success))'
                  : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {progress.done}/{progress.ordered} peças hoje
            </span>
            <span className={cn(
              "font-black text-sm",
              progress.percent >= 100 ? "text-success" : "text-primary"
            )}>
              {progress.percent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
