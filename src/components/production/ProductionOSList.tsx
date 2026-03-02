import { useMemo } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { ProductionProject } from '@/hooks/useProductionProjects';
import { PieceProgress } from '@/hooks/useProductionLogs';
import { ProductionPiece } from '@/hooks/useProductionPieces';

interface Props {
  projects: ProductionProject[];
  pieces: Map<string, ProductionPiece[]>; // projectId -> pieces
  progressMap: Map<string, PieceProgress>;
  onSelect: (projectId: string) => void;
  onCreateProject: () => void;
  isAdmin: boolean;
}

export function ProductionOSList({ projects, pieces, progressMap, onSelect, onCreateProject, isAdmin }: Props) {
  const activeProjects = projects.filter(p => p.status === 'active');
  const closedProjects = projects.filter(p => p.status !== 'active');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black uppercase tracking-widest text-foreground">
          Ordens de Serviço
        </h2>
        {isAdmin && (
          <button
            onClick={onCreateProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
          >
            <AppIcon name="Plus" size={14} />
            Nova OS
          </button>
        )}
      </div>

      {activeProjects.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center mx-auto">
            <AppIcon name="Factory" size={32} className="text-muted-foreground/30" />
          </div>
          <p className="text-sm font-bold text-muted-foreground">Nenhuma OS ativa</p>
          {isAdmin && (
            <p className="text-xs text-muted-foreground/60">Crie uma nova Ordem de Serviço para começar</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {activeProjects.map(project => {
          const projectPieces = pieces.get(project.id) || [];
          const totalPieces = projectPieces.reduce((s, p) => s + p.qty_total, 0);
          const totalDone = projectPieces.reduce((s, p) => {
            const prog = progressMap.get(p.id);
            return s + (prog?.total_done || 0);
          }, 0);
          const percent = totalPieces > 0 ? Math.min(100, Math.round((totalDone / totalPieces) * 100)) : 0;

          return (
            <button
              key={project.id}
              onClick={() => onSelect(project.id)}
              className="w-full text-left p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/30 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary">OS {project.project_number}</span>
                    {percent >= 100 && <AppIcon name="CheckCircle2" size={14} className="text-success" />}
                  </div>
                  <p className="text-sm font-bold text-foreground mt-0.5">{project.description}</p>
                  {project.client && (
                    <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
                  )}
                </div>
                <AppIcon name="ChevronRight" size={18} className="text-muted-foreground/40 mt-1" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span>{projectPieces.length} peças</span>
                  <span className={cn("font-bold", percent >= 100 ? "text-success" : "text-foreground")}>
                    {totalDone}/{totalPieces} ({percent}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      percent >= 100 ? "bg-success" : percent > 0 ? "bg-primary" : "bg-muted/30"
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {closedProjects.length > 0 && (
        <details className="mt-6">
          <summary className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 cursor-pointer">
            OS Finalizadas ({closedProjects.length})
          </summary>
          <div className="space-y-2 mt-3">
            {closedProjects.map(project => (
              <button
                key={project.id}
                onClick={() => onSelect(project.id)}
                className="w-full text-left p-3 rounded-xl bg-muted/5 border border-border/20 opacity-60 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">OS {project.project_number}</span>
                  <span className="text-xs text-muted-foreground">—</span>
                  <span className="text-xs text-muted-foreground truncate">{project.description}</span>
                </div>
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
