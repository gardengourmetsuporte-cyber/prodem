import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useUserModules } from '@/hooks/useAccessLevels';

import { usePoints } from '@/hooks/usePoints';
import { getRank } from '@/lib/ranks';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { getThemeColor } from '@/lib/unitThemes';
import { getModuleKeyFromRoute } from '@/lib/modules';
import { MODULE_REQUIRED_PLAN, PRODUCTION_MODULES, planSatisfies } from '@/lib/plans';
import type { PlanTier } from '@/lib/plans';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from 'sonner';
import { BottomBarTabPicker } from '@/components/settings/BottomBarTabPicker';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  adminOnly?: boolean;
  group: string;
  groupLabel: string;
}

const navItems: NavItem[] = [
  { icon: 'CalendarDays', label: 'Agenda', href: '/agenda', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'DollarSign', label: 'Financeiro', href: '/finance', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'Package', label: 'Estoque', href: '/inventory', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'UserSearch', label: 'Clientes', href: '/customers', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ShoppingCart', label: 'Pedidos', href: '/orders', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ClipboardCheck', label: 'Checklists', href: '/checklists', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Receipt', label: 'Fechamento', href: '/cash-closing', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'ChefHat', label: 'Fichas Técnicas', href: '/recipes', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Users', label: 'Funcionários', href: '/employees', adminOnly: true, group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Gift', label: 'Recompensas', href: '/rewards', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Trophy', label: 'Ranking', href: '/ranking', adminOnly: true, group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Megaphone', label: 'Marketing', href: '/marketing', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'Sparkles', label: 'Copilot IA', href: '/copilot', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'BookOpen', label: 'Cardápio Digital', href: '/cardapio', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'MessageCircle', label: 'WhatsApp', href: '/whatsapp', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
];

interface MoreDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MoreDrawer = React.forwardRef<HTMLDivElement, MoreDrawerProps>(function MoreDrawer({ open, onOpenChange }, _ref) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAdmin, isSuperAdmin, signOut, plan } = useAuth();
  const { units, activeUnit, setActiveUnitId } = useUnit();
  const { hasAccess, allowedModules, isLoading: accessLoading } = useUserModules();

  const { earned: earnedPoints } = usePoints();
  const rank = useMemo(() => getRank(earnedPoints), [earnedPoints]);
  const [tabPickerOpen, setTabPickerOpen] = useState(false);

  const hasAccessLevel = allowedModules !== null && allowedModules !== undefined;

  const filteredNavItems = useMemo(() => {
    return navItems.filter(item => {
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
  }, [isSuperAdmin, isAdmin, hasAccessLevel, allowedModules]);

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

  const isModuleLocked = (href: string): boolean => {
    const moduleKey = getModuleKeyFromRoute(href);
    if (!moduleKey) return false;
    const required = MODULE_REQUIRED_PLAN[moduleKey];
    if (!required) return false;
    return !planSatisfies(plan, required);
  };

  const getRequiredPlanLabel = (href: string): string | null => {
    const moduleKey = getModuleKeyFromRoute(href);
    if (!moduleKey) return null;
    const required = MODULE_REQUIRED_PLAN[moduleKey];
    if (!required) return null;
    if (planSatisfies(plan, required)) return null;
    return required === 'business' ? 'BUSINESS' : 'PRO';
  };

  const isProductionModule = (href: string): boolean => {
    const moduleKey = getModuleKeyFromRoute(href);
    return moduleKey ? PRODUCTION_MODULES.includes(moduleKey) : false;
  };

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut();
    navigate('/auth');
  };

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <BottomBarTabPicker open={tabPickerOpen} onOpenChange={setTabPickerOpen} />
      {/* Overlay — covers entire screen including behind bottom bar */}
      <div
        className="fixed inset-0 z-40 bg-black/60 animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      {/* Panel */}
      <div
        className="fixed inset-x-0 top-0 bottom-0 z-50 overflow-hidden flex flex-col animate-fade-in"
        style={{
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(to bottom, hsl(25 30% 4%) 0px, hsl(25 40% 10%) 280px, hsl(var(--background)) 280px)',
        }}
      >
        <div className="overflow-y-auto h-full">
          {/* Dark emerald gradient header area */}
          <div
            className="relative px-4 pt-[calc(env(safe-area-inset-top,12px)+12px)] pb-6 space-y-3"
            style={{
              background: 'linear-gradient(135deg, hsl(25 30% 4%) 0%, hsl(25 40% 8%) 30%, hsl(25 40% 10%) 70%, hsl(25 30% 4%) 100%)',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-[calc(env(safe-area-inset-top,12px)+12px)] right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            >
              <AppIcon name="X" size={18} className="text-white/80" />
            </button>

            {/* Profile card */}
            <div className="flex items-center gap-3 w-full py-3 pr-10">
              <button
                onClick={() => { navigate('/profile/me'); onOpenChange(false); }}
                className="flex items-center gap-3 flex-1 min-w-0 active:scale-[0.98] transition-transform"
              >
                <RankedAvatar avatarUrl={profile?.avatar_url} earnedPoints={earnedPoints} size={48} userName={profile?.full_name || 'Usuário'} userId={user?.id} />
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate font-display">{profile?.full_name || 'Usuário'}</p>
                  <p className="text-[11px] font-medium text-white/70">{rank.title} · {earnedPoints} pts</p>
                </div>
              </button>
              {/* ThemeToggle removido temporariamente */}
            </div>

            {/* Store selector — compact inline */}
            {units.length > 1 && (
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${units.length}, 1fr)` }}>
                {units.map(unit => {
                  const isActive = unit.id === activeUnit?.id;
                  return (
                    <button
                      key={unit.id}
                      onClick={() => {
                        setActiveUnitId(unit.id);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1.5 px-2 py-2 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all min-w-0",
                        isActive
                          ? "bg-white/20 text-white border border-white/30"
                          : "bg-white/10 text-white/60 hover:bg-white/15"
                      )}
                    >
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          isActive ? "bg-primary" : "bg-white/40"
                        )}
                      />
                      <span className="truncate">{unit.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Plans button */}
            {(plan === 'free') && (
              <button
                onClick={() => { navigate('/plans'); onOpenChange(false); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-all"
              >
                <AppIcon name="Crown" size={20} style={{ color: 'hsl(45 90% 55%)', filter: 'drop-shadow(0 0 6px hsl(45 90% 55% / 0.4))' }} />
                <span className="text-sm font-semibold text-white">Upgrade de Plano</span>
                <span className="text-[10px] font-bold uppercase tracking-wider ml-auto" style={{ color: 'hsl(45 90% 55%)' }}>FREE</span>
              </button>
            )}
            {(plan !== 'free' && isAdmin) && (
              <button
                onClick={() => { navigate('/plans'); onOpenChange(false); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-all"
              >
                <AppIcon name="Crown" size={20} style={{ color: 'hsl(45 90% 55%)', filter: 'drop-shadow(0 0 6px hsl(45 90% 55% / 0.4))' }} />
                <span className="text-sm font-semibold text-white">Planos</span>
                <span className="text-[10px] font-bold uppercase tracking-wider ml-auto" style={{ color: 'hsl(45 90% 55%)' }}>{plan?.toUpperCase()}</span>
              </button>
            )}
          </div>

          {/* Module grid — adaptive cards */}
          <div className="px-4 pt-5 pb-8 space-y-3 bg-background -mt-3 relative z-10">
            {groupedNav.map(group => {
              const count = group.items.length;
              const useCols3 = count >= 3 && count !== 4;
              const cols = useCols3 ? 3 : 2;
              const remainder = count % cols;
              const fullRowItems = remainder > 0 ? group.items.slice(0, count - remainder) : group.items;
              const lastRowItems = remainder > 0 ? group.items.slice(count - remainder) : [];

              const renderItem = (item: typeof group.items[0]) => {
                const active = location.pathname === item.href;
                const locked = isModuleLocked(item.href);
                const planLabel = getRequiredPlanLabel(item.href);
                const isProd = isProductionModule(item.href);

                return (
                  <Link
                    key={item.href}
                    to={locked ? (isAdmin ? '/plans' : '#') : item.href}
                    onClick={(e) => {
                      if (locked && !isAdmin) {
                        e.preventDefault();
                        toast.info(`Este módulo requer plano ${planLabel}.`, {
                          description: 'Fale com o administrador da loja para fazer o upgrade.',
                        });
                      }
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-2xl transition-all active:scale-95 relative overflow-hidden",
                      active
                        ? "bg-primary/10 border border-primary/25"
                        : "card-surface hover:bg-card/90"
                    )}
                    style={{
                      opacity: locked ? 0.55 : 1,
                      ...(active ? { boxShadow: '0 0 20px hsl(25 85% 54% / 0.08), inset 0 1px 0 rgba(255,255,255,0.04)' } : {}),
                    }}
                  >
                    {isProd && (
                      <span className="absolute top-1 right-1 text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-orange-500/15 text-orange-500 leading-none">
                        Beta
                      </span>
                    )}
                    <div className="relative z-10 w-full flex justify-center">
                      <div className={cn(
                        "w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 transition-all duration-300",
                        active
                          ? "bg-primary/15 border border-primary/30"
                          : "bg-card border border-white/5"
                      )}
                        style={active ? { boxShadow: '0 0 12px hsl(25 85% 54% / 0.2)' } : undefined}
                      >
                        <AppIcon name={item.icon} size={20} fill={active ? 1 : 0} className={active ? "text-primary" : "text-foreground/70"} />
                      </div>
                      {locked && (
                        <AppIcon name="Gem" size={10} className="absolute -top-1 -right-1" style={{ color: 'hsl(45 90% 55%)' }} />
                      )}
                    </div>
                    <span className={cn("text-[11px] font-medium leading-tight text-center truncate max-w-full relative z-10", active ? "text-primary font-semibold" : locked ? "text-muted-foreground" : "text-foreground/80")}>
                      {item.label}
                    </span>
                    {locked && planLabel && (
                      <span className="text-[8px] font-bold uppercase tracking-wider -mt-1" style={{ color: 'hsl(45 90% 55%)' }}>
                        {planLabel}
                      </span>
                    )}
                  </Link>
                );
              };

              return (
                <div key={group.label} className="mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-1 mb-2 block text-muted-foreground/50 font-display">
                    {group.label}
                  </span>
                  <div className={cn("grid gap-2", useCols3 ? 'grid-cols-3' : 'grid-cols-2')}>
                    {fullRowItems.map(renderItem)}
                    {lastRowItems.length > 0 && (
                      <div className={cn("grid gap-2 col-span-full", `grid-cols-${lastRowItems.length}`)}>
                        {lastRowItems.map(renderItem)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Settings + Logout */}
            <div className="space-y-1.5 mt-2 px-4 pb-4">
              <button
                onClick={() => setTabPickerOpen(true)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl card-surface hover:bg-card/90 active:scale-[0.98] transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                  <AppIcon name="Settings2" size={18} className="text-foreground/70" />
                </div>
                <span className="text-sm font-medium text-foreground">Personalizar barra inferior</span>
                <AppIcon name="ChevronRight" size={16} className="text-muted-foreground ml-auto shrink-0" />
              </button>
              <button
                onClick={() => { navigate('/settings'); onOpenChange(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl card-surface hover:bg-card/90 active:scale-[0.98] transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                  <AppIcon name="Settings" size={18} className="text-foreground/70" />
                </div>
                <span className="text-sm font-medium text-foreground">Configurações</span>
                <AppIcon name="ChevronRight" size={16} className="text-muted-foreground ml-auto shrink-0" />
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl card-surface hover:bg-card/90 active:scale-[0.98] transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                  <AppIcon name="LogOut" size={18} className="text-destructive" />
                </div>
                <span className="text-sm font-medium text-destructive">Sair da conta</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
MoreDrawer.displayName = "MoreDrawer";
