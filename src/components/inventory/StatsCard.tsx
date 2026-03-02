import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import { useCountUp } from '@/hooks/useCountUp';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
}

const variantStyles = {
  default: {
    iconBg: 'bg-primary/10 border border-primary/20',
    iconColor: 'text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  },
  success: {
    iconBg: 'bg-success/10 border border-success/20',
    iconColor: 'text-success drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]',
  },
  warning: {
    iconBg: 'bg-warning/10 border border-warning/20',
    iconColor: 'text-warning drop-shadow-[0_0_8px_hsl(var(--warning)/0.5)]',
  },
  destructive: {
    iconBg: 'bg-destructive/10 border border-destructive/20',
    iconColor: 'text-destructive drop-shadow-[0_0_8px_hsl(var(--destructive)/0.5)]',
  },
};

export function StatsCard({ title, value, icon, variant = 'default', onClick }: StatsCardProps) {
  const styles = variantStyles[variant];
  const numericValue = typeof value === 'number' ? value : null;
  const animatedValue = useCountUp(numericValue ?? 0);

  return (
    <button
      onClick={onClick}
      className="w-full text-left card-surface p-3 hover:shadow-card-hover active:scale-[0.97] transition-all duration-300 relative overflow-hidden group"
    >
      {/* Subtle shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

      <div className="flex items-center justify-between mb-2 relative z-10">
        <p className="text-[11px] font-medium text-muted-foreground leading-tight uppercase tracking-wide">{title}</p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors", styles.iconBg)}>
          <AppIcon name={icon} size={16} className={styles.iconColor} />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>
        {numericValue !== null ? animatedValue : value}
      </p>
    </button>
  );
}
