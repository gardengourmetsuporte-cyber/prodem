// Plan definitions — Prodem is B2B direct sale, no paywall needed.
// All features are unlocked. Types kept for backward compatibility.
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

export const PLANS: PlanDef[] = [];

/** Which plan tier is required for each module key — all unlocked */
export const MODULE_REQUIRED_PLAN: Record<string, PlanTier> = {};

/** Modules that are still in production (shown with a beta/production badge) */
export const PRODUCTION_MODULES: string[] = ['menu-admin', 'tablet-admin', 'gamification', 'whatsapp'];

/** In Prodem all features are unlocked — always returns true */
export function planSatisfies(_userPlan: PlanTier, _requiredPlan: PlanTier): boolean {
  return true;
}
