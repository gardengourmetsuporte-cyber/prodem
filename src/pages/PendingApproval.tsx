import { useAuth } from '@/contexts/AuthContext';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import prodemLogo from '@/assets/prodem-logo.png';

export default function PendingApproval() {
  const { profile, signOut, isSuspended } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white mx-auto flex items-center justify-center shadow-lg">
          <img alt="Prodem" src={prodemLogo} className="w-[80%] h-[80%] object-contain" />
        </div>

        {/* Status icon */}
        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
          isSuspended ? 'bg-destructive/10' : 'bg-amber-500/10'
        }`}>
          <AppIcon 
            name={isSuspended ? 'ShieldX' : 'Clock'} 
            size={32} 
            className={isSuspended ? 'text-destructive' : 'text-amber-500'} 
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {isSuspended ? 'Acesso Suspenso' : 'Aguardando Aprovação'}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isSuspended
              ? 'Seu acesso ao sistema foi suspenso pelo administrador. Entre em contato com a equipe para mais informações.'
              : `Olá${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! Seu cadastro foi recebido com sucesso. Um administrador precisa aprovar seu acesso para que você possa utilizar o sistema.`
            }
          </p>
        </div>

        {/* Info card */}
        {!isSuspended && (
          <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <AppIcon name="Info" size={16} className="text-primary" />
              O que acontece agora?
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5 text-left">
              <li className="flex items-start gap-2">
                <AppIcon name="Check" size={12} className="text-green-500 mt-0.5 shrink-0" />
                Cadastro criado com sucesso
              </li>
              <li className="flex items-start gap-2">
                <AppIcon name="Clock" size={12} className="text-amber-500 mt-0.5 shrink-0" />
                Aguardando aprovação do administrador
              </li>
              <li className="flex items-start gap-2">
                <AppIcon name="Bell" size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                Você será notificado quando seu acesso for liberado
              </li>
            </ul>
          </div>
        )}

        <Button variant="outline" onClick={signOut} className="w-full">
          <AppIcon name="LogOut" size={16} className="mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}
