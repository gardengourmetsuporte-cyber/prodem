import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

export type MenuTab = 'home' | 'menu' | 'cart';

interface Props {
  active: MenuTab;
  onTabChange: (tab: MenuTab) => void;
  cartCount: number;
}

const tabs: { key: MenuTab; icon: string; iconFilled: string; label: string }[] = [
  { key: 'home', icon: 'Storefront', iconFilled: 'Storefront', label: 'Início' },
  { key: 'menu', icon: 'Package', iconFilled: 'Package', label: 'Catálogo' },
  { key: 'cart', icon: 'FileText', iconFilled: 'FileText', label: 'Cotação' },
];

export function MenuBottomNav({ active, onTabChange, cartCount }: Props) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 safe-area-pb">
      <div className="max-w-4xl mx-auto px-3 pb-2">
        <div className="bg-card/90 backdrop-blur-2xl border border-border/40 rounded-2xl shadow-xl">
          <div className="flex items-center justify-around h-16">
            {tabs.map(tab => {
              const isActive = active === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all relative',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground active:scale-95'
                  )}
                >
                  <div className="relative">
                    <AppIcon name={isActive ? tab.iconFilled : tab.icon} size={22} fill={isActive ? 1 : 0} />
                    {tab.key === 'cart' && cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </div>
                  <span className={cn('text-[10px]', isActive ? 'font-bold' : 'font-medium')}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-0 w-5 h-[3px] rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
