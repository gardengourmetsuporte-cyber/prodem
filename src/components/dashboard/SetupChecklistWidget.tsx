import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Progress } from '@/components/ui/progress';
import { useSetupProgress, SetupStep } from '@/hooks/useSetupProgress';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'prodem-setup-dismissed';

export function SetupChecklistWidget() {
  const navigate = useNavigate();
  const { steps, completedCount, totalCount, allCompleted, progress, isLoading } = useSetupProgress();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === 'true');
  const [animatingOut, setAnimatingOut] = useState(false);

  // Auto-dismiss when all completed
  useEffect(() => {
    if (allCompleted && !dismissed) {
      const t = setTimeout(() => {
        setAnimatingOut(true);
        setTimeout(() => {
          localStorage.setItem(DISMISS_KEY, 'true');
          setDismissed(true);
        }, 400);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [allCompleted, dismissed]);

  if (dismissed || isLoading || totalCount === 0) return null;

  const handleDismiss = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      localStorage.setItem(DISMISS_KEY, 'true');
      setDismissed(true);
    }, 400);
  };

  return (
    <div
      className={cn(
        "card-surface p-5 space-y-4 transition-all duration-400",
        animatingOut ? "opacity-0 scale-95 -translate-y-2" : "animate-spring-in"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <AppIcon name="Rocket" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>
              Configure sua unidade
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {completedCount}/{totalCount} concluídos
            </p>
          </div>
        </div>
        {!allCompleted && (
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Fechar guia de configuração"
          >
            <AppIcon name="X" size={16} />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="h-2" />

      {/* Steps */}
      <div className="space-y-1">
        {steps.map((step) => (
          <StepRow key={step.key} step={step} onNavigate={() => navigate(step.route)} />
        ))}
      </div>

      {allCompleted && (
        <div className="flex items-center gap-2 pt-1">
          <AppIcon name="PartyPopper" size={18} className="text-primary" />
          <span className="text-sm font-semibold text-primary">Tudo pronto! Bom trabalho 🎉</span>
        </div>
      )}
    </div>
  );
}

function StepRow({ step, onNavigate }: { step: SetupStep; onNavigate: () => void }) {
  return (
    <button
      onClick={onNavigate}
      disabled={step.completed}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
        step.completed
          ? "opacity-60"
          : "hover:bg-secondary/50 active:scale-[0.98]"
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
        step.completed ? "bg-success/15" : "bg-secondary"
      )}>
        {step.completed ? (
          <AppIcon name="Check" size={16} className="text-success" />
        ) : (
          <AppIcon name={step.icon} size={16} className="text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium",
          step.completed ? "line-through text-muted-foreground" : "text-foreground"
        )}>
          {step.label}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">{step.description}</p>
      </div>
      {!step.completed && (
        <AppIcon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
      )}
    </button>
  );
}
