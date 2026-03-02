import garrafaTermica from '@/assets/rewards/garrafa-termica.jpg';
import camiseta from '@/assets/rewards/camiseta.jpg';
import cinema from '@/assets/rewards/cinema.jpg';
import almoco from '@/assets/rewards/almoco.jpg';
import saidaCedo from '@/assets/rewards/saida-cedo.jpg';
import vale50 from '@/assets/rewards/vale50.jpg';
import churrasco from '@/assets/rewards/churrasco.jpg';
import folga from '@/assets/rewards/folga.jpg';
import vale100 from '@/assets/rewards/vale100.jpg';
import bonusSalarial from '@/assets/rewards/bonus-salarial.jpg';

/** Map product names (lowercase) to local fallback images */
const REWARD_IMAGE_MAP: Record<string, string> = {
  'garrafa térmica premium': garrafaTermica,
  'camiseta prodem exclusiva': camiseta,
  'ingresso cinema (2 pessoas)': cinema,
  'ingresso cinema': cinema,
  'almoço especial': almoco,
  'saída 2h mais cedo': saidaCedo,
  'vale-presente r$50': vale50,
  'kit churrasco': churrasco,
  'folga extra (1 dia)': folga,
  'folga extra': folga,
  'vale-presente r$100': vale100,
  'bônus salarial r$200': bonusSalarial,
  'bônus salarial': bonusSalarial,
};

export function getRewardFallbackImage(productName: string): string | null {
  const key = productName.toLowerCase().trim();
  return REWARD_IMAGE_MAP[key] || null;
}
