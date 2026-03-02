import prodemLogo from '@/assets/prodem-logo.png';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

interface InviteData {
  id: string;
  email: string;
  unit_id: string;
  role: string;
  token: string;
  accepted_at: string | null;
  expires_at: string;
  unit_name: string;
}

export default function Invite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetchUnits } = useUnit();
  const token = searchParams.get('token');

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [signupDone, setSignupDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de convite inválido.');
      setLoading(false);
      return;
    }

    async function fetchInvite() {
      const { data, error: err } = await supabase.rpc('get_invite_by_token', { p_token: token });
      if (err || !data || data.length === 0) {
        setError('Convite inválido, expirado ou já utilizado.');
      } else {
        setInvite(data[0] as InviteData);
      }
      setLoading(false);
    }

    fetchInvite();
  }, [token]);

  // If user is already logged in and invite exists, auto-accept
  useEffect(() => {
    if (user && invite && !invite.accepted_at) {
      acceptInviteForUser(user.id, user.email || '');
    }
  }, [user, invite]);

  async function acceptInviteForUser(userId: string, userEmail: string) {
    try {
      // Check email matches
      if (invite && invite.email.toLowerCase() !== userEmail.toLowerCase()) {
        setError(`Este convite é para ${invite.email}. Faça login com esse email.`);
        return;
      }

      // Create user_units association
      await supabase.from('user_units').insert({
        user_id: userId,
        unit_id: invite!.unit_id,
        role: invite!.role || 'member',
        is_default: true,
      });

      // Mark invite as accepted
      await supabase.from('invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite!.id);

      // Refresh units so ProtectedRoute won't redirect to onboarding
      await refetchUnits();

      toast.success(`Bem-vindo ao ${invite!.unit_name}!`);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Error accepting invite:', err);
      toast.error('Erro ao aceitar convite.');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;

    setIsSubmitting(true);
    try {
      console.log('[Invite] Attempting signUp for:', invite.email);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/invite?token=${token}`,
          data: { full_name: fullName },
        },
      });

      console.log('[Invite] signUp result:', JSON.stringify({ signUpData, signUpError }));

      if (signUpError) {
        console.error('[Invite] signUp error:', signUpError.message, signUpError.status);
        if (signUpError.message.includes('already registered')) {
          toast.error('Este email já possui conta. Faça login para aceitar o convite.');
          navigate(`/auth?token=${token}`);
          return;
        }
        // Show the actual error to the user
        const friendlyMsg = signUpError.message.includes('weak') || signUpError.message.includes('pwned') || signUpError.message.includes('leaked')
          ? 'Senha muito fraca ou comum. Use uma senha mais forte com letras, números e símbolos.'
          : signUpError.message.includes('rate')
          ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
          : `Erro ao criar conta: ${signUpError.message}`;
        toast.error(friendlyMsg, { duration: 8000 });
        return;
      }

      // Check if user was actually created or if it's a fake success
      if (signUpData?.user?.identities?.length === 0) {
        toast.error('Este email já possui conta. Faça login para aceitar o convite.');
        navigate(`/auth?token=${token}`);
        return;
      }

      setSignupDone(true);
      toast.success('Conta criada! Verifique seu email para confirmar.');
    } catch (err: any) {
      console.error('[Invite] signUp catch error:', err);
      toast.error(err.message || 'Erro ao criar conta.', { duration: 8000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = (field: string) => cn(
    "pl-11 h-12 rounded-xl border bg-secondary/30 text-foreground placeholder:text-muted-foreground/50 transition-all duration-300",
    focusedField === field
      ? "border-primary/60 bg-secondary/50"
      : "border-border/30 hover:border-border/60"
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando convite...</div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AppIcon name="AlertTriangle" size={32} className="text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{error || 'Convite inválido'}</h2>
          <p className="text-sm text-muted-foreground">O link pode ter expirado ou já foi utilizado.</p>
          <Button variant="outline" onClick={() => navigate('/')}>Ir para o início</Button>
        </div>
      </div>
    );
  }

  if (signupDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <AppIcon name="Mail" size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Verifique seu email</h2>
          <p className="text-sm text-muted-foreground">
            Enviamos um link de confirmação para <strong>{invite.email}</strong>. 
            Após confirmar, você será adicionado ao <strong>{invite.unit_name}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden">
      {/* ThemeToggle removido temporariamente */}

      <div className="absolute top-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[120px] animate-float"
        style={{ background: 'radial-gradient(circle, hsl(var(--neon-cyan) / 0.1), transparent 60%)' }}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-4 animate-slide-up">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-primary/20"
              style={{ boxShadow: '0 0 30px hsl(var(--neon-cyan) / 0.15)' }}
            >
              <img alt="Prodem Gestão" className="w-full h-full object-contain rounded-full p-1" src={prodemLogo} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-foreground">Você foi convidado!</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Para se juntar ao <span className="text-primary font-semibold">{invite.unit_name}</span>
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl p-6 space-y-5 backdrop-blur-xl animate-slide-up"
            style={{
              animationDelay: '100ms',
              background: 'linear-gradient(145deg, hsl(var(--card) / 0.9), hsl(var(--card) / 0.6))',
              border: '1px solid hsl(var(--neon-cyan) / 0.15)',
              boxShadow: '0 0 40px hsl(var(--neon-cyan) / 0.06), var(--shadow-elevated)',
            }}
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Crie sua conta para acessar o sistema
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Email: <strong>{invite.email}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground font-medium">Nome Completo</Label>
                <div className="relative">
                  <div className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors", focusedField === 'name' ? "text-primary" : "text-muted-foreground/60")}>
                    <AppIcon name="User" size={20} />
                  </div>
                  <Input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Seu nome completo"
                    required
                    minLength={2}
                    className={inputClasses('name')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground font-medium">Senha</Label>
                <div className="relative">
                  <div className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors", focusedField === 'password' ? "text-primary" : "text-muted-foreground/60")}>
                    <AppIcon name="Lock" size={20} />
                  </div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Ex: Mesa@2026!"
                    required
                    minLength={8}
                    className={cn(inputClasses('password'), "pr-11")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors">
                    {showPassword ? <AppIcon name="EyeOff" size={20} /> : <AppIcon name="Eye" size={20} />}
                  </button>
                </div>
                <div className="space-y-1 px-1">
                  <p className="text-xs font-medium text-muted-foreground">A senha deve ter:</p>
                  <ul className="text-xs text-muted-foreground/80 space-y-0.5">
                    <li className={cn("flex items-center gap-1.5", password.length >= 8 && "text-primary")}>
                      {password.length >= 8 ? <AppIcon name="Check" size={12} /> : <AppIcon name="Circle" size={12} />}
                      Mínimo 8 caracteres
                    </li>
                    <li className={cn("flex items-center gap-1.5", /[A-Z]/.test(password) && "text-primary")}>
                      {/[A-Z]/.test(password) ? <AppIcon name="Check" size={12} /> : <AppIcon name="Circle" size={12} />}
                      Uma letra maiúscula
                    </li>
                    <li className={cn("flex items-center gap-1.5", /[0-9]/.test(password) && "text-primary")}>
                      {/[0-9]/.test(password) ? <AppIcon name="Check" size={12} /> : <AppIcon name="Circle" size={12} />}
                      Um número
                    </li>
                    <li className={cn("flex items-center gap-1.5", /[^A-Za-z0-9]/.test(password) && "text-primary")}>
                      {/[^A-Za-z0-9]/.test(password) ? <AppIcon name="Check" size={12} /> : <AppIcon name="Circle" size={12} />}
                      Um símbolo (@, !, #, etc.)
                    </li>
                  </ul>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan) / 0.8))',
                  boxShadow: '0 4px 24px hsl(var(--primary) / 0.35)',
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Criando conta...
                  </span>
                ) : (
                  <>Criar conta e entrar<AppIcon name="ArrowRight" size={20} className="ml-2" /></>
                )}
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => navigate(`/auth?token=${token}`)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Já tem conta? <span className="text-primary font-medium">Faça login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
