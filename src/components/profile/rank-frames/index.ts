import { InicianteFrame } from './InicianteFrame';
import { AprendizFrame } from './AprendizFrame';
import { DedicadoFrame } from './DedicadoFrame';
import { VeteranoFrame } from './VeteranoFrame';
import { MestreFrame } from './MestreFrame';
import { LendaFrame } from './LendaFrame';
import { MiticoFrame } from './MiticoFrame';
import { ImortalFrame } from './ImortalFrame';

// Mapeamento dos títulos industriais Prodem para os frames visuais
export const RANK_FRAMES: Record<string, React.ComponentType<{ size: number; children: React.ReactNode }>> = {
  'Ajudante': InicianteFrame,
  'Operador': AprendizFrame,
  'Técnico': DedicadoFrame,
  'Especialista': VeteranoFrame,
  'Supervisor': MestreFrame,
  'Engenheiro': LendaFrame,
  'Diretor': MiticoFrame,
  'Presidente': ImortalFrame,
};

export {
  InicianteFrame,
  AprendizFrame,
  DedicadoFrame,
  VeteranoFrame,
  MestreFrame,
  LendaFrame,
  MiticoFrame,
  ImortalFrame,
};
