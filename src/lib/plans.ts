// Canonical plan definitions for the SaaS
export type PlanTier = 'free' | 'pro' | 'business';

export interface PlanDef {
  id: PlanTier;
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  features: string[];
  highlight: boolean;
}

export const PLANS: PlanDef[] = [
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para operações em crescimento',
    monthly: 97,
    yearly: 77,
    highlight: true,
    features: [
      'Financeiro completo',
      'Estoque inteligente',
      'Gestão de equipe',
      'Checklists ilimitados',
      'Fichas técnicas',
      'Gamificação e ranking',
      'Fechamento de caixa',
      'Finanças pessoais',
      'Até 15 usuários',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Para operações avançadas',
    monthly: 197,
    yearly: 157,
    highlight: false,
    features: [
      'Tudo do Pro',
      'IA Copiloto',
      'WhatsApp Bot',
      'Marketing',
      'Pedidos online (tablet)',
      'Cardápio digital',
      'Usuários ilimitados',
      'Suporte prioritário',
    ],
  },
];

/** Which plan tier is required for each module key */
export const MODULE_REQUIRED_PLAN: Record<string, PlanTier> = {
  // PRO modules
  'finance': 'pro',
  'cash-closing': 'pro',
  'recipes': 'pro',
  'employees': 'pro',
  'ranking': 'pro',
  'rewards': 'pro',
  'personal-finance': 'pro',
  // BUSINESS modules
  'marketing': 'business',
  'copilot': 'business',
  'menu-admin': 'business',
  'tablet-admin': 'business',
  'gamification': 'business',
  'whatsapp': 'business',
};

/** Modules that are still in production (shown with a beta/production badge) */
export const PRODUCTION_MODULES: string[] = ['menu-admin', 'tablet-admin', 'gamification', 'whatsapp'];

/** Check if a plan satisfies the required plan level */
export function planSatisfies(userPlan: PlanTier, requiredPlan: PlanTier): boolean {
  const hierarchy: PlanTier[] = ['free', 'pro', 'business'];
  return hierarchy.indexOf(userPlan) >= hierarchy.indexOf(requiredPlan);
}
