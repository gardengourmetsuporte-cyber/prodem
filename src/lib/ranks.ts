/**
 * Sistema de Rankings Prodem — Títulos Industriais por Pontos Ganhos
 * Progressão baseada na hierarquia de uma indústria
 */

export type RankEffect = 'none' | 'glow' | 'pulse' | 'double-ring' | 'orbit' | 'fire' | 'rainbow' | 'prisma';

export interface RankInfo {
  level: number;
  title: string;
  /** CSS color string */
  color: string;
  /** CSS border color */
  borderColor: string;
  /** CSS glow/shadow */
  glow: string;
  /** CSS border width */
  borderWidth: number;
  /** Whether to animate the border */
  animated: boolean;
  /** Visual effect type */
  effect: RankEffect;
}

const RANKS: { min: number; info: Omit<RankInfo, 'level'> }[] = [
  {
    min: 1500,
    info: {
      title: 'Presidente',
      color: 'hsl(200 80% 80%)',
      borderColor: 'linear-gradient(135deg, hsl(200 90% 75%), hsl(280 80% 75%), hsl(340 80% 75%), hsl(60 80% 75%))',
      glow: '0 0 20px hsl(200 80% 80% / 0.5), 0 0 40px hsl(280 80% 75% / 0.3), 0 0 60px hsl(340 80% 70% / 0.15)',
      borderWidth: 4,
      animated: true,
      effect: 'prisma',
    },
  },
  {
    min: 750,
    info: {
      title: 'Diretor',
      color: 'hsl(280 80% 65%)',
      borderColor: 'rainbow',
      glow: '0 0 16px hsl(280 80% 65% / 0.5), 0 0 32px hsl(190 90% 55% / 0.3)',
      borderWidth: 3,
      animated: true,
      effect: 'rainbow',
    },
  },
  {
    min: 300,
    info: {
      title: 'Engenheiro',
      color: 'hsl(var(--neon-red))',
      borderColor: 'hsl(var(--neon-red))',
      glow: '0 0 14px hsl(var(--neon-red) / 0.5), 0 0 28px hsl(var(--neon-red) / 0.2)',
      borderWidth: 3,
      animated: true,
      effect: 'fire',
    },
  },
  {
    min: 100,
    info: {
      title: 'Supervisor',
      color: 'hsl(var(--neon-amber))',
      borderColor: 'hsl(var(--neon-amber))',
      glow: '0 0 12px hsl(var(--neon-amber) / 0.4), 0 0 24px hsl(var(--neon-amber) / 0.15)',
      borderWidth: 3,
      animated: true,
      effect: 'orbit',
    },
  },
  {
    min: 50,
    info: {
      title: 'Especialista',
      color: 'hsl(var(--neon-purple))',
      borderColor: 'hsl(var(--neon-purple))',
      glow: '0 0 10px hsl(var(--neon-purple) / 0.35)',
      borderWidth: 3,
      animated: true,
      effect: 'double-ring',
    },
  },
  {
    min: 25,
    info: {
      title: 'Técnico',
      color: 'hsl(var(--neon-cyan))',
      borderColor: 'hsl(var(--neon-cyan))',
      glow: '0 0 8px hsl(var(--neon-cyan) / 0.3)',
      borderWidth: 2,
      animated: true,
      effect: 'pulse',
    },
  },
  {
    min: 10,
    info: {
      title: 'Operador',
      color: 'hsl(var(--neon-green))',
      borderColor: 'hsl(var(--neon-green))',
      glow: '0 0 6px hsl(var(--neon-green) / 0.25)',
      borderWidth: 2,
      animated: false,
      effect: 'glow',
    },
  },
  {
    min: 0,
    info: {
      title: 'Ajudante',
      color: 'hsl(var(--muted-foreground))',
      borderColor: 'hsl(var(--border))',
      glow: 'none',
      borderWidth: 2,
      animated: false,
      effect: 'none',
    },
  },
];

/**
 * Retorna informações de ranking baseadas nos pontos ganhos
 */
export function getRank(earnedPoints: number): RankInfo {
  const idx = RANKS.findIndex(r => earnedPoints >= r.min);
  const rank = RANKS[idx >= 0 ? idx : RANKS.length - 1];
  return { level: RANKS.length - (idx >= 0 ? idx : RANKS.length - 1), ...rank.info };
}

/**
 * Retorna o próximo rank e pontos necessários, ou null se já é Presidente
 */
export function getNextRank(earnedPoints: number): { title: string; pointsNeeded: number } | null {
  const idx = RANKS.findIndex(r => earnedPoints >= r.min);
  if (idx <= 0) return null; // already max
  const next = RANKS[idx - 1];
  return { title: next.info.title, pointsNeeded: next.min - earnedPoints };
}
