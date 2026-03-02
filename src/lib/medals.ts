/**
 * Sistema de Medalhas Prodem — Honrarias Industriais
 */

import { differenceInMonths } from 'date-fns';

export type MedalTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Medal {
  id: string;
  title: string;
  description: string;
  tier: MedalTier;
  unlocked: boolean;
  bonusPoints: number;
}

export interface MedalData {
  hasEmployeeOfMonth?: boolean;
  admissionDate?: string | null;
  hasInventedRecipe?: boolean;
}

export function calculateMedals(data: MedalData): Medal[] {
  const monthsSinceAdmission = data.admissionDate
    ? differenceInMonths(new Date(), new Date(data.admissionDate))
    : 0;

  return [
    {
      id: 'employee_of_month',
      title: 'Operador Destaque',
      description: 'Reconhecido como o melhor operador do mês pela liderança',
      tier: 'platinum',
      unlocked: data.hasEmployeeOfMonth ?? false,
      bonusPoints: 50,
    },
    {
      id: 'six_months',
      title: 'Veterano de Linha',
      description: 'Completou 6 meses trabalhando na linha de produção',
      tier: 'gold',
      unlocked: !!data.admissionDate && monthsSinceAdmission >= 6,
      bonusPoints: 30,
    },
    {
      id: 'one_year',
      title: 'Pilar da Fábrica',
      description: 'Completou 1 ano na Prodem — base sólida da operação',
      tier: 'platinum',
      unlocked: !!data.admissionDate && monthsSinceAdmission >= 12,
      bonusPoints: 75,
    },
    {
      id: 'inventor',
      title: 'Inovador Industrial',
      description: 'Criou um processo ou solução técnica para a produção',
      tier: 'gold',
      unlocked: data.hasInventedRecipe ?? false,
      bonusPoints: 40,
    },
  ];
}

export const TIER_CONFIG: Record<MedalTier, { label: string; color: string; bg: string; border: string; glow: string }> = {
  bronze: {
    label: 'Bronze',
    color: 'hsl(30 60% 50%)',
    bg: 'hsl(30 30% 92%)',
    border: 'hsl(30 40% 78%)',
    glow: '0 0 8px hsl(30 60% 50% / 0.15)',
  },
  silver: {
    label: 'Prata',
    color: 'hsl(220 15% 50%)',
    bg: 'hsl(220 15% 93%)',
    border: 'hsl(220 15% 80%)',
    glow: '0 0 8px hsl(220 15% 65% / 0.15)',
  },
  gold: {
    label: 'Ouro',
    color: 'hsl(45 80% 42%)',
    bg: 'hsl(45 40% 92%)',
    border: 'hsl(45 50% 78%)',
    glow: '0 0 10px hsl(45 90% 58% / 0.15)',
  },
  platinum: {
    label: 'Platina',
    color: 'hsl(190 70% 40%)',
    bg: 'hsl(190 30% 92%)',
    border: 'hsl(190 40% 78%)',
    glow: '0 0 14px hsl(190 80% 70% / 0.2)',
  },
};

export const TIER_CONFIG_DARK: Record<MedalTier, { color: string; bg: string; border: string }> = {
  bronze: { color: 'hsl(30 60% 60%)', bg: 'hsl(30 30% 14%)', border: 'hsl(30 50% 35%)' },
  silver: { color: 'hsl(220 15% 70%)', bg: 'hsl(220 15% 14%)', border: 'hsl(220 15% 40%)' },
  gold: { color: 'hsl(45 90% 58%)', bg: 'hsl(45 40% 14%)', border: 'hsl(45 70% 40%)' },
  platinum: { color: 'hsl(190 80% 70%)', bg: 'hsl(190 30% 14%)', border: 'hsl(190 60% 40%)' },
};
