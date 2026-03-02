import { DMUnit } from '@/hooks/useDigitalMenu';
import { AppIcon } from '@/components/ui/app-icon';

interface Props {
  unit: DMUnit | null;
  unitInitials?: string;
}

export function MenuLanding({ unit, unitInitials = '?' }: Props) {
  if (!unit) return null;

  const info = unit.store_info;
  const logoUrl = info?.logo_url;
  const bannerUrl = info?.banner_url;
  const cuisineType = info?.cuisine_type;
  const city = info?.city;
  const address = info?.address;
  const deliveryTime = info?.delivery_time;

  const isOpen = (() => {
    if (!info?.opening_hours?.length) return true;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return info.opening_hours.some(h => currentTime >= h.open && currentTime <= h.close);
  })();

  const currentHours = info?.opening_hours?.length
    ? info.opening_hours.map(h => `${h.open} – ${h.close}`).join(' | ')
    : null;

  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-48 md:h-64 w-full overflow-hidden relative">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{
            background: 'linear-gradient(180deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.08) 40%, hsl(var(--background)) 100%)',
          }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Logo + Info */}
      <div className="px-4 md:px-8 -mt-16 relative z-10">
        <div className="flex items-end gap-4">
          {/* Logo container */}
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-card border-[3px] border-background shadow-xl overflow-hidden flex items-center justify-center shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={unit.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-card flex items-center justify-center">
                <span className="text-2xl md:text-3xl font-bold text-primary/60">{unitInitials}</span>
              </div>
            )}
          </div>
          <div className="pb-2 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{unit.name}</h1>
          {cuisineType && (
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{cuisineType}</p>
            )}
          {!cuisineType && (
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Engenharia Mecânica & Metalúrgica</p>
            )}
          </div>
        </div>

        {/* Status + Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            isOpen
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-destructive/10 text-destructive'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
            {isOpen ? 'Atendimento Online' : 'Fora do horário'}
          </div>

          {currentHours && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <AppIcon name="Schedule" size={12} />
              {currentHours}
            </span>
          )}

          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <AppIcon name="Timer" size={12} />
            {deliveryTime || 'Prazo sob consulta'}
          </span>
        </div>

        {/* Address */}
        {(city || address) && (
          <p className="text-xs md:text-sm text-muted-foreground mt-2 flex items-center gap-1">
            <AppIcon name="LocationOn" size={13} className="shrink-0" />
            {[address, city].filter(Boolean).join(' • ')}
          </p>
        )}
      </div>
    </div>
  );
}