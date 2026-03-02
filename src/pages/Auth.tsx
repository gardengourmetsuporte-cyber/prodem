// Auth page v4 — Modern SaaS split-screen layout
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { lovable } from '@/integrations/lovable/index';
import prodemLogo from '@/assets/prodem-logo.png';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter no mínimo 6 caracteres');
const nameSchema = z.string().min(2, 'Nome deve ter no mínimo 2 caracteres');

// ── Brand Panel (left half on desktop) ─────────────────────────────
function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden bg-[#0a1020]">
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow orbs - Prodem theme */}
      <div
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[150px] opacity-20 pointer-events-none"
        style={{ background: 'hsl(25 85% 54%)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{ background: 'hsl(220 70% 50%)' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-12 max-w-lg">
        {/* Logo */}
        <div
          className="relative w-36 h-36 rounded-[2rem] overflow-hidden flex items-center justify-center"
          style={{
            background: 'white',
            boxShadow: '0 0 100px hsl(25 85% 54% / 0.2), 0 25px 70px rgba(0,0,0,0.8)',
          }}
        >
          <img alt="Prodem Gestão" className="w-[85%] h-[85%] object-contain" src={prodemLogo} />
        </div>

        {/* Headline */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-extrabold tracking-tight text-white font-display">
            Prodem
          </h1>
          <p className="text-[11px] text-white/35 tracking-[0.3em] uppercase font-semibold">
            Gestão Industrial
          </p>
        </div>

        {/* Tagline */}
        <p className="text-sm text-white/30 leading-relaxed max-w-xs text-center">
          Sistema interno de gestão
        </p>
      </div>
    </div>
  );
}

// ── Mobile Brand Header (full-bleed banner) ────────────────────────
function MobileBrandHeader() {
  return (
    <div
      className="relative flex lg:hidden flex-col items-center justify-center min-h-[52vh] px-6 overflow-hidden w-full bg-[#0a1020]"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)',
      }}
    >
      {/* Subtle border top separator indicating header */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Animated glow orbs - Prodem Theme */}
      <div
        className="absolute top-[15%] left-[20%] w-[250px] h-[250px] rounded-full blur-[100px] opacity-20 pointer-events-none"
        style={{
          background: 'hsl(25 85% 54%)',
          animation: 'float-orb-1 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-[20%] right-[15%] w-[200px] h-[200px] rounded-full blur-[80px] opacity-15 pointer-events-none"
        style={{
          background: 'hsl(220 70% 50%)',
          animation: 'float-orb-2 10s ease-in-out infinite',
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 pt-16 pb-12">
        {/* Logo with entrance animation */}
        <div
          className="w-24 h-24 rounded-[1.25rem] overflow-hidden flex items-center justify-center animate-[scale-in_0.6s_cubic-bezier(0.16,1,0.3,1)_0.1s_both]"
          style={{
            background: 'white',
            boxShadow: '0 0 80px hsl(25 85% 54% / 0.15), 0 16px 50px rgba(0,0,0,0.8)',
          }}
        >
          <img alt="Prodem Gestão" className="w-[85%] h-[85%] object-contain" src={prodemLogo} />
        </div>

        {/* Title with staggered entrance */}
        <div className="text-center space-y-1.5 animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.25s_both]">
          <h1 className="text-4xl font-extrabold text-white tracking-tight font-display">Prodem</h1>
          <p className="text-[10px] text-white/35 tracking-[0.25em] uppercase font-semibold">Gestão Industrial</p>
        </div>

        {/* Tagline */}
        <p className="text-xs text-white/30 mt-2 animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.4s_both]">
          Sistema interno de gestão
        </p>
      </div>

      {/* Bottom overlay blending mask into page content */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-background rounded-t-3xl" />
    </div>
  );
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isNewPassword, setIsNewPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { user, signIn, signUp, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get('plan');
  const tokenFromUrl = searchParams.get('token');
  const paymentSuccess = searchParams.get('payment');

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsNewPassword(true);
      setIsResetPassword(false);
      setIsLogin(true);
    }
  }, []);

  useEffect(() => {
    if (paymentSuccess === 'success' && planFromUrl) {
      setIsLogin(false);
      toast.success(`Pagamento confirmado! Crie sua conta para ativar o plano ${planFromUrl.charAt(0).toUpperCase() + planFromUrl.slice(1)}.`);
    }
  }, []);

  useEffect(() => {
    if (user && !isLoading && !isNewPassword) {
      if (tokenFromUrl) {
        navigate(`/invite?token=${tokenFromUrl}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, isLoading, navigate, isNewPassword, tokenFromUrl]);

  const canSignUp = true; // Prodem: open registration, admin approves

  const validate = () => {
    const newErrors: Record<string, string> = {};
    try { emailSchema.parse(email); } catch (e: any) { newErrors.email = e.errors[0].message; }
    try { passwordSchema.parse(password); } catch (e: any) { newErrors.password = e.errors[0].message; }
    if (!isLogin) {
      try { nameSchema.parse(fullName); } catch (e: any) { newErrors.fullName = e.errors[0].message; }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    try { passwordSchema.parse(password); } catch (err: any) { newErrors.password = err.errors[0].message; }
    if (password !== confirmPassword) { newErrors.confirmPassword = 'As senhas não coincidem'; }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { toast.error(error.message); return; }
      toast.success('Senha alterada com sucesso!');
      setIsNewPassword(false);
      setPassword('');
      setConfirmPassword('');
      navigate('/', { replace: true });
    } finally { setIsSubmitting(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    try { emailSchema.parse(email); } catch (err: any) { newErrors.email = err.errors[0].message; }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) { toast.error(error.message); return; }
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setIsResetPassword(false);
    } finally { setIsSubmitting(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) toast.error('Email ou senha incorretos');
          else if (error.message.includes('Email not confirmed')) toast.error('Confirme seu email antes de fazer login');
          else toast.error(error.message);
          return;
        }
        toast.success('Bem-vindo de volta!');
      } else {
        const redirectUrl = planFromUrl
          ? `${window.location.origin}/auth?plan=${planFromUrl}&payment=success`
          : tokenFromUrl
            ? `${window.location.origin}/invite?token=${tokenFromUrl}`
            : `${window.location.origin}/`;
        const { error } = await signUp(email, password, fullName, redirectUrl);
        if (error) {
          if (error.message.includes('already registered')) toast.error('Este email já está cadastrado');
          else toast.error(error.message);
          return;
        }
        toast.success('Cadastro realizado! Verifique seu email para confirmar.');
        setIsLogin(true);
      }
    } finally { setIsSubmitting(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const inputClasses = (field: string) => cn(
    "pl-11 h-12 rounded-xl border transition-all duration-200 focus-visible:!ring-0 focus-visible:!ring-offset-0",
    "text-foreground placeholder:text-muted-foreground/50",
    focusedField === field
      ? "border-primary/50 bg-secondary/80"
      : "border-border/60 bg-secondary/40 hover:border-border",
    errors[field] && "border-destructive/50"
  );

  const formTitle = isNewPassword ? 'Nova Senha' : isResetPassword ? 'Recuperar Senha' : isLogin ? 'Entrar' : 'Criar Conta';
  const formSubtitle = isNewPassword
    ? 'Defina sua nova senha abaixo'
    : isResetPassword
      ? 'Enviaremos um link de recuperação'
      : isLogin
        ? 'Acesse sua conta para continuar'
        : planFromUrl
          ? `Cadastre-se para ativar o plano ${planFromUrl.charAt(0).toUpperCase() + planFromUrl.slice(1)}`
          : 'Preencha os dados para começar';

  return (
    <div className="dark min-h-[100dvh] flex flex-row bg-[#0a1020] text-foreground">
      {/* ── LEFT: Brand Panel (desktop) ── */}
      <BrandPanel />

      {/* ── RIGHT: Form Panel ── */}
      <div className="flex-1 flex flex-col relative overflow-y-auto lg:pt-0 pt-0 bg-background">
        {/* Top bar - absolute on mobile to overlay the navy banner seamlessly */}
        <div className="flex items-center justify-between px-5 absolute top-0 left-0 right-0 z-20 lg:relative" style={{ paddingTop: 'max(calc(env(safe-area-inset-top) + 8px), 16px)' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/landing')} className="gap-1.5 text-white/80 hover:text-white hover:bg-white/10 lg:text-muted-foreground lg:hover:text-foreground -ml-2">
            <AppIcon name="ChevronLeft" size={16} />
            Voltar
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center lg:justify-center relative z-10">
          {/* Mobile brand header */}
          <MobileBrandHeader />

          <div className="w-full flex flex-col items-center px-6 py-8">

            <div className="w-full max-w-[380px] space-y-6">
              {/* Header */}
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {formTitle}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formSubtitle}
                </p>
              </div>

              {/* Social login buttons - top position */}
              {!isNewPassword && !isResetPassword && (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={async () => { try { await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin, extraParams: { prompt: "select_account" } }); } catch { toast.error('Erro ao conectar com Google'); } }}
                    className="w-full h-12 rounded-xl flex items-center justify-center gap-3 text-sm font-medium transition-colors border border-border/60 bg-card hover:bg-secondary/60 text-foreground"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continuar com Google
                  </button>
                  <button
                    type="button"
                    onClick={async () => { try { await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin }); } catch { toast.error('Erro ao conectar com Apple'); } }}
                    className="w-full h-12 rounded-xl flex items-center justify-center gap-3 text-sm font-medium transition-colors border border-border/60 bg-card hover:bg-secondary/60 text-foreground"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Continuar com Apple
                  </button>
                </div>
              )}

              {/* Divider */}
              {!isNewPassword && !isResetPassword && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">ou</span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
              )}

              {/* Form */}
              {isNewPassword ? (
                <form onSubmit={handleSetNewPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-muted-foreground">Nova Senha</Label>
                    <div className="relative">
                      <div className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200", focusedField === 'newPassword' ? 'text-primary' : 'text-muted-foreground')}>
                        <AppIcon name="Lock" size={18} />
                      </div>
                      <Input id="newPassword" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocusedField('newPassword')} onBlur={() => setFocusedField(null)} placeholder="••••••••" className={cn(inputClasses('password'), "pr-11")} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        <AppIcon name={showPassword ? "EyeOff" : "Eye"} size={18} />
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">Confirmar Senha</Label>
                    <div className="relative">
                      <div className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200", focusedField === 'confirmPassword' ? 'text-primary' : 'text-muted-foreground')}>
                        <AppIcon name="Lock" size={18} />
                      </div>
                      <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)} placeholder="••••••••" className={inputClasses('confirmPassword')} />
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-semibold rounded-xl" style={{ boxShadow: '0 4px 20px hsl(var(--primary) / 0.2)' }}>
                    {isSubmitting ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Aguarde...</span> : 'Salvar nova senha'}
                  </Button>
                </form>
              ) : isResetPassword ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-sm font-medium text-muted-foreground">Email</Label>
                    <div className="relative">
                      <div className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200", focusedField === 'resetEmail' ? 'text-primary' : 'text-muted-foreground')}>
                        <AppIcon name="Mail" size={18} />
                      </div>
                      <Input id="resetEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocusedField('resetEmail')} onBlur={() => setFocusedField(null)} placeholder="seu@email.com" className={inputClasses('email')} />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-semibold rounded-xl" style={{ boxShadow: '0 4px 20px hsl(var(--primary) / 0.2)' }}>
                    {isSubmitting ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Aguarde...</span> : 'Enviar link de recuperação'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                      <div className="relative">
                        <div className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200", focusedField === 'fullName' ? 'text-primary' : 'text-muted-foreground')}>
                          <AppIcon name="User" size={18} />
                        </div>
                        <Input id="fullName" type="text" autoComplete="name" autoCapitalize="words" value={fullName} onChange={e => setFullName(e.target.value)} onFocus={() => setFocusedField('fullName')} onBlur={() => setFocusedField(null)} placeholder="Seu nome" className={inputClasses('fullName')} />
                      </div>
                      {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</Label>
                    <div className="relative">
                      <div className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200", focusedField === 'email' ? 'text-primary' : 'text-muted-foreground')}>
                        <AppIcon name="Mail" size={18} />
                      </div>
                      <Input id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} placeholder="seu@email.com" className={inputClasses('email')} />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">Senha</Label>
                      {isLogin && (
                        <button type="button" onClick={() => { setIsResetPassword(true); setErrors({}); }} className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                          Esqueceu a senha?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200", focusedField === 'password' ? 'text-primary' : 'text-muted-foreground')}>
                        <AppIcon name="Lock" size={18} />
                      </div>
                      <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} placeholder="••••••••" className={cn(inputClasses('password'), "pr-11")} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        <AppIcon name={showPassword ? "EyeOff" : "Eye"} size={18} />
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <div className="pt-1">
                    <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-semibold rounded-xl" style={{ boxShadow: '0 4px 20px hsl(var(--primary) / 0.2)' }}>
                      {isSubmitting ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Aguarde...</span> : <>{isLogin ? 'Entrar' : 'Criar conta'}<AppIcon name="ArrowRight" size={18} className="ml-2" /></>}
                    </Button>
                  </div>
                </form>
              )}

              {/* Toggle login/signup */}
              <div className="text-center pt-2">
                {isResetPassword ? (
                  <button type="button" onClick={() => { setIsResetPassword(false); setErrors({}); }} className="text-sm text-primary font-medium hover:text-primary/80 transition-colors">
                    ← Voltar para o login
                  </button>
                ) : canSignUp ? (
                  <button type="button" onClick={() => { setIsLogin(!isLogin); setErrors({}); setPassword(''); setFullName(''); }} className="text-sm text-muted-foreground">
                    {isLogin ? <>Não tem conta? <span className="font-medium text-primary">Cadastre-se</span></> : <>Já tem conta? <span className="font-medium text-primary">Entrar</span></>}
                  </button>
                ) : (
                  <button type="button" onClick={() => navigate('/landing')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    ← Voltar para o site
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-xs text-muted-foreground/40">
          © {new Date().getFullYear()} Prodem — Gestão Industrial
        </div>
      </div>
    </div>
  );
}
