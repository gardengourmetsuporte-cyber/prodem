import { getEloList, type EloTier } from '@/lib/achievements';
import { RANK_FRAMES } from '@/components/profile/rank-frames';
import { Progress } from '@/components/ui/progress';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface EloListProps {
  earnedPoints: number;
}

export function EloList({ earnedPoints }: EloListProps) {
  const elos = getEloList(earnedPoints);
  const currentIdx = elos.findIndex(e => e.isCurrent);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <AppIcon name="Shield" size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Patentes Prodem</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {elos.filter(e => e.unlocked).length}/{elos.length}
        </span>
      </div>

      <div className="space-y-2">
        {elos.map((elo, i) => {
          const FrameComponent = RANK_FRAMES[elo.title];
          return (
            <div
              key={elo.title}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all",
                elo.isCurrent && "ring-1",
                elo.unlocked
                  ? "bg-secondary/40 border border-border/30"
                  : "bg-secondary/15 border border-border/10 opacity-60"
              )}
            style={elo.isCurrent ? {
                borderColor: elo.color,
                boxShadow: `0 0 12px ${elo.color}30, inset 0 0 0 1px ${elo.color}40`,
              } : undefined}
            >
              {/* Rank frame preview */}
              <div className="shrink-0">
                {FrameComponent ? (
                  <FrameComponent size={36}>
                    <div
                      className="w-full h-full rounded-full"
                      style={{
                        background: elo.unlocked
                          ? `linear-gradient(135deg, ${elo.color}40, ${elo.color}20)`
                          : 'hsl(var(--muted) / 0.3)',
                      }}
                    />
                  </FrameComponent>
                ) : (
                  <div className="w-[41px] h-[41px] rounded-full border-2 border-border" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={cn("text-xs font-bold", !elo.unlocked && "text-muted-foreground")}
                    style={elo.unlocked ? { color: elo.color } : undefined}
                  >
                    {elo.title}
                  </p>
                  {elo.isCurrent && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/12 text-primary">
                      ATUAL
                    </span>
                  )}
                  {elo.unlocked && !elo.isCurrent && (
                    <AppIcon name="Check" size={12} style={{ color: elo.color }} />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {elo.minPoints}+ pontos
                </p>
                {!elo.unlocked && (
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={elo.progress} className="h-1 flex-1" />
                    <span className="text-[9px] text-muted-foreground shrink-0">
                      {earnedPoints}/{elo.minPoints}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
