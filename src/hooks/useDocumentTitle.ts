import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/finance': 'Financeiro',
  '/personal-finance': 'Finanças Pessoais',
  '/inventory': 'Estoque',
  '/orders': 'Pedidos',
  '/recipes': 'Fichas Técnicas',
  '/checklists': 'Checklists',
  '/employees': 'Equipe',
  '/cash-closing': 'Fechamento de Caixa',
  '/agenda': 'Agenda',
  '/marketing': 'Marketing',
  '/ranking': 'Ranking',
  '/rewards': 'Recompensas',
  '/gamification': 'Gamificação',
  '/profile': 'Perfil',
  '/settings': 'Configurações',
  '/copilot': 'Copilot IA',
  '/whatsapp': 'WhatsApp',
  '/plans': 'Planos',
  '/calendar': 'Calendário',
  '/menu-admin': 'Cardápio',
};

const APP_NAME = 'Prodem';

export function useDocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = ROUTE_TITLES[pathname];
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [pathname]);
}
