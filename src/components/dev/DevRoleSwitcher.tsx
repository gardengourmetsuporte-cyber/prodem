import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppIcon } from '@/components/ui/app-icon';
import type { AppRole } from '@/types/database';

const DEV_USER_ID = 'fcc4a0b6-5562-4ec8-80f0-54bc1158892f';

const ROLES: { role: AppRole; label: string; icon: string; color: string }[] = [
  { role: 'super_admin', label: 'Super Admin', icon: 'ShieldCheck', color: 'bg-red-500' },
  { role: 'admin', label: 'Admin', icon: 'Shield', color: 'bg-amber-500' },
  { role: 'lider', label: 'Líder', icon: 'Crown', color: 'bg-indigo-500' },
  { role: 'funcionario', label: 'Operador', icon: 'HardHat', color: 'bg-primary' },
];

export function DevRoleSwitcher() {
  const { user, role, setDevRole } = useAuth();
  const [open, setOpen] = useState(false);

  // Only show for dev user
  if (user?.id !== DEV_USER_ID) return null;

  const currentRole = ROLES.find(r => r.role === role);

  return (
    <div className="fixed top-3 right-3 z-[9999]">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm transition-all ${currentRole?.color || 'bg-muted'} hover:scale-105 active:scale-95`}
      >
        <AppIcon name="Bug" size={12} />
        {currentRole?.label || role}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl p-1.5 min-w-[160px] z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider px-2 py-1 font-bold">
              Simular perfil
            </p>
            {ROLES.map(r => (
              <button
                key={r.role}
                onClick={() => {
                  setDevRole(r.role);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  role === r.role 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <div className={`w-5 h-5 rounded-full ${r.color} flex items-center justify-center`}>
                  <AppIcon name={r.icon as any} size={10} className="text-white" />
                </div>
                {r.label}
                {role === r.role && <AppIcon name="Check" size={12} className="ml-auto text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
