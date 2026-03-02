import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ICON_MAP } from '@/lib/iconMap';

interface AppIconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** 0 = outlined, 1 = filled (default) */
  fill?: 0 | 1;
  /** Weight: 100-700, default 400 for modern premium look */
  weight?: number;
}

export const AppIcon = forwardRef<HTMLSpanElement, AppIconProps>(
  ({ name, size = 24, className, style, fill = 1, weight = 400 }, ref) => {
    const materialName = ICON_MAP[name] || name;
    // progress_activity looks broken with FILL 1 — force outlined
    const effectiveFill = materialName === 'progress_activity' ? 0 : fill;

    return (
      <span
        ref={ref}
        className={cn("material-symbols-rounded select-none leading-none", className)}
        style={{
          fontSize: size,
          width: size,
          height: size,
          overflow: 'hidden',
          display: 'inline-block',
          fontVariationSettings: `'FILL' ${effectiveFill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size > 32 ? 48 : 24}`,
          ...style,
        }}
      >
        {materialName}
      </span>
    );
  }
);
AppIcon.displayName = 'AppIcon';
