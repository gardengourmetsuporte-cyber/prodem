type RouteImporter = () => Promise<unknown>;

const routeImporters: Record<string, RouteImporter> = {
  '/': () => import('@/pages/DashboardNew'),
  '/agenda': () => import('@/pages/Agenda'),
  '/finance': () => import('@/pages/Finance'),
  '/inventory': () => import('@/pages/Inventory'),
  '/orders': () => import('@/pages/Orders'),
  '/checklists': () => import('@/pages/Checklists'),
  '/cash-closing': () => import('@/pages/CashClosing'),
  '/recipes': () => import('@/pages/Recipes'),
  '/employees': () => import('@/pages/Employees'),
  '/rewards': () => import('@/pages/Rewards'),
  '/settings': () => import('@/pages/Settings'),
  '/marketing': () => import('@/pages/Marketing'),
  '/copilot': () => import('@/pages/Copilot'),
  '/whatsapp': () => import('@/pages/WhatsApp'),
  '/cardapio': () => import('@/pages/MenuAdmin'),
  '/tablet-admin': () => import('@/pages/TabletAdmin'),
  '/gamification': () => import('@/pages/Gamification'),
  '/ranking': () => import('@/pages/Ranking'),
  
  
};

const preloadedRoutes = new Set<string>();

function normalizePath(path: string) {
  const cleanPath = path.split('?')[0].split('#')[0];
  if (cleanPath.startsWith('/profile/')) return '/profile/:userId';
  return cleanPath;
}

export async function preloadRoute(path: string) {
  const normalizedPath = normalizePath(path);
  const importer = routeImporters[normalizedPath];

  if (!importer || preloadedRoutes.has(normalizedPath)) return;

  preloadedRoutes.add(normalizedPath);
  try {
    await importer();
  } catch {
    preloadedRoutes.delete(normalizedPath);
  }
}

export function preloadRoutes(paths: string[]) {
  for (const path of paths) {
    void preloadRoute(path);
  }
}
