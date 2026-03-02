/**
 * Sistema de Elos Prodem — Progressão industrial baseada em pontos ganhos
 */

import { getRank } from './ranks';

export interface EloTier {
  title: string;
  minPoints: number;
  color: string;
  unlocked: boolean;
  isCurrent: boolean;
  progress: number; // 0-100
}

// Definição dos 8 elos industriais em ordem crescente
const ELO_TIERS: { title: string; min: number }[] = [
  { title: 'Ajudante', min: 0 },
  { title: 'Operador', min: 10 },
  { title: 'Técnico', min: 25 },
  { title: 'Especialista', min: 50 },
  { title: 'Supervisor', min: 100 },
  { title: 'Engenheiro', min: 300 },
  { title: 'Diretor', min: 750 },
  { title: 'Presidente', min: 1500 },
];

const ELO_COLORS: Record<string, string> = {
  'Ajudante': 'hsl(var(--muted-foreground))',
  'Operador': 'hsl(var(--neon-green))',
  'Técnico': 'hsl(var(--neon-cyan))',
  'Especialista': 'hsl(var(--neon-purple))',
  'Supervisor': 'hsl(var(--neon-amber))',
  'Engenheiro': 'hsl(var(--neon-red))',
  'Diretor': 'hsl(280 80% 65%)',
  'Presidente': 'hsl(200 80% 80%)',
};

export function getEloList(earnedPoints: number): EloTier[] {
  const currentRank = getRank(earnedPoints);

  return ELO_TIERS.map((tier, i) => {
    const unlocked = earnedPoints >= tier.min;
    const isCurrent = currentRank.title === tier.title;

    let progress = 0;
    if (unlocked) {
      progress = 100;
    } else {
      const prevMin = i > 0 ? ELO_TIERS[i - 1].min : 0;
      const range = tier.min - prevMin;
      progress = range > 0 ? Math.round(((earnedPoints - prevMin) / range) * 100) : 0;
      progress = Math.max(0, Math.min(99, progress));
    }

    return {
      title: tier.title,
      minPoints: tier.min,
      color: ELO_COLORS[tier.title] || 'hsl(var(--muted-foreground))',
      unlocked,
      isCurrent,
      progress,
    };
  });
}

// Keep backward-compatible exports
export type AchievementData = { totalCompletions: number; earnedPoints: number; totalRedemptions: number };
export type Achievement = EloTier;
export function calculateAchievements(data: AchievementData): EloTier[] {
  return getEloList(data.earnedPoints);
}
