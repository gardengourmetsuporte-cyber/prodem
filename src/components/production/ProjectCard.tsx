import { ProductionProject } from '@/hooks/useProductionProjects';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: ProductionProject;
  isAdmin?: boolean;
  onEdit?: () => void;
}

export function ProjectCard({ project, isAdmin, onEdit }: ProjectCardProps) {
  return (
    <div className="rounded-2xl p-4 bg-card ring-1 ring-border/40 space-y-1">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <AppIcon name="Briefcase" size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary">#{project.project_number}</span>
            {project.client && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/60 text-muted-foreground font-medium truncate">
                {project.client}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground truncate">{project.description}</p>
        </div>
        {isAdmin && onEdit && (
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
            <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
