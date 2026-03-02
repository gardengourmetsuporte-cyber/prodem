import { LeaderboardEntry } from '@/hooks/useLeaderboard';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { getRank } from '@/lib/ranks';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PodiumProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  compact?: boolean;
}

const PODIUM_CONFIG = [
  { position: 1, order: 2, height: 'h-20', crownColor: 'hsl(var(--neon-amber))', rgb: '217, 166, 30', label: '1º' },
  { position: 2, order: 1, height: 'h-14', crownColor: 'hsl(215 20% 65%)', rgb: '146, 155, 170', label: '2º' },
  { position: 3, order: 3, height: 'h-10', crownColor: 'hsl(30 50% 45%)', rgb: '172, 120, 57', label: '3º' },
];

export function Podium({ entries, currentUserId, compact = false }: PodiumProps) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  // Pad to 3 if needed
  while (top3.length < 3) {
    top3.push(null as any);
  }

  const avatarSize = compact ? 40 : 52;

  return (
    <div className="flex items-end justify-center gap-2 pt-4 pb-2">
      {PODIUM_CONFIG.map(({ position, order, height, crownColor, rgb, label }) => {
        const entry = top3[position - 1];
        if (!entry) {
          return (
            <div key={position} className="flex flex-col items-center" style={{ order }}>
              <div className={cn("w-16 rounded-t-xl bg-secondary/30", compact ? "w-14" : "w-18", height)} />
            </div>
          );
        }

        const isCurrentUser = entry.user_id === currentUserId;
        const entryRank = getRank(entry.earned_all_time ?? entry.total_score);

        return (
          <Link
            to={`/profile/${entry.user_id}`}
            key={entry.user_id}
            className="flex flex-col items-center animate-slide-up"
            style={{ order, animationDelay: `${(position - 1) * 100}ms` }}
          >
            {/* Crown for 1st */}
            {position === 1 && (
              <div className="mb-1 animate-pulse" style={{ animationDuration: '3s' }}>
                <AppIcon name="Crown" size={compact ? 18 : 22} style={{ color: crownColor }} />
              </div>
            )}

            {/* Avatar */}
            <div className={cn(
              "relative mb-2 rounded-full",
              position === 1 && "ring-2 ring-offset-2 ring-offset-background ring-amber-500/60",
              isCurrentUser && position !== 1 && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}>
              <RankedAvatar
                avatarUrl={entry.avatar_url}
                earnedPoints={entry.earned_all_time ?? entry.total_score}
                size={avatarSize}
                userName={entry.full_name}
                userId={entry.user_id}
              />
              {/* Position badge */}
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-background"
                style={{ background: crownColor, color: position === 1 ? '#0d1f14' : '#fff' }}
              >
                {position}
              </div>
            </div>

            {/* Name */}
            <p className={cn(
              "font-semibold text-center truncate max-w-[70px]",
              compact ? "text-[11px]" : "text-xs",
              isCurrentUser ? "text-primary" : "text-foreground"
            )}>
              {entry.full_name?.split(' ')[0]}
            </p>

            {/* Rank title */}
            {!compact && (
              <p className="text-[10px] text-muted-foreground" style={{ color: entryRank.color }}>
                {entryRank.title}
              </p>
            )}

            {/* Score */}
            <div className="flex items-center gap-0.5 mt-0.5">
              <AppIcon name="Star" size={10} style={{ color: crownColor }} />
              <span className="text-[11px] font-bold" style={{ color: crownColor }}>
                {entry.total_score}
              </span>
            </div>

            {/* Podium bar */}
            <div
              className={cn(
                "w-full rounded-t-xl mt-1.5 border-t border-x border-b-0 relative overflow-hidden",
                compact ? "w-16" : "w-20",
                height
              )}
              style={{
                background: `linear-gradient(to top, rgba(${rgb}, 0.85), rgba(${rgb}, 0.5), rgba(${rgb}, 0.25))`,
                borderColor: `rgba(${rgb}, 0.7)`,
                boxShadow: `0 -4px 20px rgba(${rgb}, 0.35), inset 0 2px 10px rgba(${rgb}, 0.3)`,
              }}
            >
              {/* Shimmer effect */}
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  background: `linear-gradient(135deg, transparent 30%, rgba(${rgb}, 0.5) 50%, transparent 70%)`,
                }}
              />
              <div className="flex items-center justify-center h-full relative z-10">
                <span className="text-xs font-bold" style={{ color: crownColor }}>{label}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
