import prodemLogo from '@/assets/prodem-logo.png';
import { ReactNode, useState, useMemo, useRef, useEffect } from 'react';
import { PageLoader } from '@/components/PageLoader';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PageTransition } from './PageTransition';
import { AppIcon } from '@/components/ui/app-icon';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { PointsDisplay } from '@/components/rewards/PointsDisplay';
import { CoinAnimationProvider, useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { CoinAnimationLayer } from '@/components/animations/CoinAnimation';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { cn } from '@/lib/utils';
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { useUserModules } from '@/hooks/useAccessLevels';
import { getModuleKeyFromRoute } from '@/lib/modules';
import { MODULE_REQUIRED_PLAN, planSatisfies } from '@/lib/plans';
import type { PlanTier } from '@/lib/plans';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { usePoints } from '@/hooks/usePoints';
import { getRank } from '@/lib/ranks';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { preloadRoute, preloadRoutes } from '@/lib/routePreload';
import { lazy, Suspense, memo } from 'react';

// Lazy-load BottomTabBar — only used on mobile
const LazyBottomTabBar = lazy(() => import('./BottomTabBar').then(m => ({ default: m.BottomTabBar })));

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: string;
  label: string;
  href: string;
  adminOnly?: boolean;
  group: string;
  groupLabel: string;
}

const navItems: NavItem[] = [
  { icon: 'CalendarDays', label: 'Agenda', href: '/agenda', adminOnly: true, group: 'principal', groupLabel: 'Principal' },
  { icon: 'DollarSign', label: 'Financeiro', href: '/finance', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'Package', label: 'Estoque', href: '/inventory', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ShoppingCart', label: 'Pedidos', href: '/orders', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'UserSearch', label: 'Clientes', href: '/customers', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ClipboardCheck', label: 'Checklists', href: '/checklists', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Receipt', label: 'Fechamento', href: '/cash-closing', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'ChefHat', label: 'Fichas Técnicas', href: '/recipes', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Users', label: 'Funcionários', href: '/employees', adminOnly: true, group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Gift', label: 'Recompensas', href: '/rewards', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Trophy', label: 'Ranking', href: '/ranking', adminOnly: true, group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Megaphone', label: 'Marketing', href: '/marketing', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'Sparkles', label: 'Copilot IA', href: '/copilot', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'MessageSquare', label: 'WhatsApp', href: '/whatsapp', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'BookOpen', label: 'Cardápio', href: '/cardapio', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'Monitor', label: 'Tablets', href: '/tablet-admin', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'Dices', label: 'Gamificação', href: '/gamification', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'Settings', label: 'Configurações', href: '/settings', adminOnly: true, group: 'config', groupLabel: 'Sistema' },
];

function AppLayoutContent({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, profile, isAdmin, isSuperAdmin, signOut, plan } = useAuth();
  const { units, activeUnit, setActiveUnitId, isTransitioning } = useUnit();
  const { isPulsing } = useCoinAnimation();
  const { unreadCount } = useNotifications();
  const { earned: earnedPoints } = usePoints();
  const rank = useMemo(() => getRank(earnedPoints), [earnedPoints]);
  const isMobile = useIsMobile();
  const { leaderboard } = useLeaderboard();
  const myPosition = useMemo(() => leaderboard.find(e => e.user_id === user?.id)?.rank, [leaderboard, user?.id]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate('/auth');
  };

  const userModules = useUserModules();

  const isModuleLocked = (href: string): boolean => {
    const moduleKey = getModuleKeyFromRoute(href);
    if (!moduleKey) return false;
    const required = MODULE_REQUIRED_PLAN[moduleKey];
    if (!required) return false;
    return !planSatisfies(plan, required);
  };

  const { hasAccess, allowedModules, isLoading: accessLoading } = userModules;
  const hasAccessLevel = allowedModules !== null && allowedModules !== undefined;

  const lastNavRef = useRef<NavItem[]>(navItems);

  const filteredNavItems = useMemo(() => {
    if (accessLoading && lastNavRef.current.length > 0) {
      return lastNavRef.current;
    }
    const result = navItems.filter(item => {
      const moduleKey = getModuleKeyFromRoute(item.href);
      if (isSuperAdmin) return true;
      if (hasAccessLevel) {
        if (moduleKey === 'dashboard') return true;
        if (moduleKey === 'settings') return true; // Always accessible for profile editing
        if (moduleKey && !allowedModules!.includes(moduleKey)) return false;
        if (!moduleKey && item.adminOnly && !isAdmin) return false;
        return true;
      }
      if (item.group === 'premium') return isAdmin;
      if (item.adminOnly && !isAdmin) return false;
      return true;
    });
    lastNavRef.current = result;
    return result;
  }, [isSuperAdmin, isAdmin, hasAccessLevel, allowedModules, accessLoading]);

  useEffect(() => {
    const preloadPaths = filteredNavItems.map(item => item.href).slice(0, 8);
    if (preloadPaths.length === 0) return;

    const browserWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (browserWindow.requestIdleCallback) {
      const idleId = browserWindow.requestIdleCallback(() => preloadRoutes(preloadPaths), { timeout: 1200 });
      return () => browserWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(() => preloadRoutes(preloadPaths), 350);
    return () => window.clearTimeout(timeoutId);
  }, [filteredNavItems]);

  const groupedNav: { label: string; items: typeof filteredNavItems }[] = [];
  const seenGroups = new Set<string>();
  filteredNavItems.forEach(item => {
    if (!seenGroups.has(item.group)) {
      seenGroups.add(item.group);
      groupedNav.push({
        label: item.groupLabel,
        items: filteredNavItems.filter(i => i.group === item.group),
      });
    }
  });

  // Get user initials for avatar fallback
  const initials = useMemo(() => {
    const name = profile?.full_name || 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }, [profile?.full_name]);

  if (isSigningOut) {
    return (
      <div className="animate-fade-in">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ======= Mobile Header with Navy Brand Strip ======= */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-primary/10"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          background: 'linear-gradient(145deg, hsl(222 30% 5%) 0%, hsl(222 25% 10%) 50%, hsl(222 30% 5%) 100%)',
        }}
      >
        {/* Premium gradient brand bar */}
        <div
          className="relative overflow-hidden backdrop-blur-3xl"
          style={{
            background: 'linear-gradient(145deg, rgba(10,15,25,0.92) 0%, rgba(20,25,40,0.92) 50%, rgba(10,15,25,0.92) 100%)',
          }}
        >
          {/* Animated ambient glow */}
          <div className="absolute inset-0 pointer-events-none header-ambient-glow" />
          <div className="flex items-center justify-between h-14 px-3 relative z-10">
            {/* Left: Logo + Unit Name */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 active:scale-95 transition-transform min-w-0"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-sm">
                <img alt="Prodem Gestão" className="w-6 h-6 object-contain" src={prodemLogo} />
              </div>
              <span className="text-sm font-bold text-white truncate max-w-[140px] font-display" style={{ letterSpacing: '-0.02em' }}>
                {activeUnit?.name || 'Prodem'}
              </span>
            </button>

            {/* Right: Notifications + Avatar */}
            <div className="flex items-center gap-1">
              <Drawer open={notifOpen} onOpenChange={setNotifOpen}>
                <DrawerTrigger asChild>
                  <button className="relative p-2.5 rounded-lg hover:bg-white/10 transition-all">
                    <AppIcon name="Bell" size={22} className="text-white/70" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </DrawerTrigger>
                <DrawerContent className="px-4 pb-8 pt-4 max-h-[70vh] overflow-y-auto">
                  <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4" />
                  {notifOpen && <NotificationCard />}
                </DrawerContent>
              </Drawer>

              <button
                onClick={() => navigate('/profile/me')}
                className="p-1 rounded-full active:scale-90 transition-transform"
              >
                <Avatar className="w-8 h-8 border-2 border-white/20">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile?.full_name || 'Avatar'} />
                  ) : null}
                  <AvatarFallback className="text-[11px] font-bold bg-white/15 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ======= Desktop Sidebar ======= */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[260px] z-50 flex-col bg-card/60 backdrop-blur-3xl border-r border-primary/10">
        {/* Premium brand header */}
        <div
          className="relative overflow-hidden shrink-0 border-b border-primary/10"
          style={{
            background: 'linear-gradient(145deg, rgba(10,15,25,0.7) 0%, rgba(20,25,40,0.7) 50%, rgba(10,15,25,0.7) 100%)',
          }}
        >
          <div className="flex items-center gap-3 px-4 h-16 relative z-10">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center active:scale-95 transition-transform shrink-0 shadow-sm"
            >
              <img alt="Prodem Gestão" className="w-7 h-7 object-contain" src={prodemLogo} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{activeUnit?.name || 'Prodem'}</p>
              <p className="text-[10px] text-primary/50 font-medium tracking-wide">Gestão Industrial</p>
            </div>
          </div>
        </div>

        {/* User card */}
        <button
          onClick={() => navigate('/profile/me')}
          className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors border-b border-primary/10"
        >
          <RankedAvatar avatarUrl={profile?.avatar_url} earnedPoints={earnedPoints} size={36} />
          <div className="text-left min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || 'Usuário'}</p>
            <p className="text-[11px] font-medium" style={{ color: rank.color }}>{rank.title} · {earnedPoints} pts</p>
          </div>
        </button>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
          {/* Home */}
          <Link
            to="/"
            onMouseEnter={() => void preloadRoute('/')}
            onTouchStart={() => void preloadRoute('/')}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              location.pathname === '/'
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
            )}
          >
            <AppIcon name="Home" size={20} />
            <span>Início</span>
          </Link>

          {groupedNav.map((group) => (
            <div key={group.label}>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 px-3 mb-1 block">
                {group.label}
              </span>
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                const locked = isModuleLocked(item.href);
                const targetHref = locked ? '/plans' : item.href;

                return (
                  <Link
                    key={item.href}
                    to={targetHref}
                    onMouseEnter={() => void preloadRoute(targetHref)}
                    onTouchStart={() => void preloadRoute(targetHref)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden group",
                     isActive
                        ? "bg-primary/12 text-primary shadow-sm ring-1 ring-primary/20"
                        : locked
                          ? "text-muted-foreground/50 hover:text-muted-foreground hover:bg-primary/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                    )}
                  >
                    {!isActive && !locked && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out pointer-events-none" />
                    )}
                    <AppIcon name={item.icon} size={20} style={{ opacity: locked ? 0.5 : 1 }} className="relative z-10" />
                    <span className="truncate flex-1 relative z-10">{item.label}</span>
                    {locked && <AppIcon name="Lock" size={14} className="text-primary/60 shrink-0 relative z-10" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-3 border-t border-primary/10 space-y-1 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <PointsDisplay isPulsing={isPulsing} showLabel className="scale-90 origin-left" />
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
          >
            <AppIcon name="LogOut" size={18} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* ======= Main Content ======= */}
      <main
        className="min-h-screen lg:ml-[260px] lg:pt-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3.5rem)' }}
      >
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {/* ======= Global Bottom Tab Bar (mobile only, lazy-loaded) ======= */}
      {isMobile && (
        <Suspense fallback={null}>
          <LazyBottomTabBar />
        </Suspense>
      )}

      {isTransitioning && (
        <div
          className="fixed inset-0 z-[100] pointer-events-none animate-unit-flash"
          style={{ background: 'hsl(var(--primary) / 0.12)' }}
        />
      )}

      <CoinAnimationLayer />
      <PushNotificationPrompt />
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <CoinAnimationProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </CoinAnimationProvider>
  );
}
