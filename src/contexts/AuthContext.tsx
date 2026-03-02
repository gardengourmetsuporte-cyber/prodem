import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole, UserStatus } from '@/types/database';
import type { PlanTier } from '@/lib/plans';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  userStatus: UserStatus | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLider: boolean;
  isPending: boolean;
  isSuspended: boolean;
  isLoading: boolean;
  plan: PlanTier;
  planStatus: string;
  subscriptionEnd: string | null;
  isPro: boolean;
  isBusiness: boolean;
  isFree: boolean;
  hasPlan: (required: PlanTier) => boolean;
  setEffectivePlan: (plan: PlanTier) => void;
  refreshSubscription: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, redirectTo?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_CACHE_KEY = 'garden_auth_cache';

function getCachedAuth() {
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (cached) return JSON.parse(cached) as { profile: Profile | null; role: AppRole | null };
  } catch {}
  return null;
}

function setCachedAuth(profile: Profile | null, role: AppRole | null) {
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ profile, role }));
  } catch {}
}

function clearCachedAuth() {
  localStorage.removeItem(AUTH_CACHE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const cached = getCachedAuth();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(cached?.profile ?? null);
  const [role, setRole] = useState<AppRole | null>(cached?.role ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchUserDataRef = useRef<(userId: string) => Promise<void>>();
  const fetchingRef = useRef(false);

  // Prodem: all plans unlocked — always business
  const plan: PlanTier = 'business';
  const planStatus = 'active';
  const subscriptionEnd: string | null = null;
  const isPro = true;
  const isBusiness = true;
  const isFree = false;
  const hasPlan = useCallback((_required: PlanTier) => true, []);
  const setEffectivePlan = useCallback((_plan: PlanTier) => {}, []);
  const refreshSubscription = useCallback(async () => {}, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserData(userId: string) {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        const [profileResult, roleResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId),
        ]);

        if (!isMounted) return;

        const p = profileResult.data as any;

        const ROLE_PRIORITY: Record<string, number> = { super_admin: 4, admin: 3, lider: 2, funcionario: 1 };
        const rolesData = (roleResult.data as { role: AppRole }[] | null) ?? [];
        const r: AppRole = rolesData.length > 0
          ? rolesData.reduce((best, cur) => (ROLE_PRIORITY[cur.role] ?? 0) > (ROLE_PRIORITY[best.role] ?? 0) ? cur : best).role
          : 'funcionario';

        setProfile(p as Profile | null);
        setRole(r);
        setCachedAuth(p, r);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      } finally {
        fetchingRef.current = false;
        if (isMounted) setIsLoading(false);
      }
    }

    fetchUserDataRef.current = fetchUserData;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'PASSWORD_RECOVERY') {
          if (isMounted) {
            setSession(session);
            setUser(session?.user ?? null);
          }
          return;
        }

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }

        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);

          if (event === 'SIGNED_IN') {
            supabase.rpc('log_audit_event' as any, {
              p_user_id: session.user.id,
              p_unit_id: null,
              p_action: 'user_login',
              p_entity_type: 'auth',
              p_entity_id: null,
              p_details: { email: session.user.email },
            }).then(() => {});
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setProfile(null);
            setRole(null);
            setIsLoading(false);
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        if (cached) {
          setIsLoading(false);
        }
        fetchUserData(session.user.id);
      } else {
        clearCachedAuth();
        setIsLoading(false);
      }
    }).catch((err) => {
      console.error('[AuthContext] getSession failed:', err);
      if (isMounted) {
        clearCachedAuth();
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Re-validate user data when tab regains focus
  useEffect(() => {
    let lastFetchAt = 0;
    const DEBOUNCE_MS = 30_000;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user) {
        const now = Date.now();
        if (now - lastFetchAt > DEBOUNCE_MS) {
          lastFetchAt = now;
          fetchUserDataRef.current?.(user.id);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string, redirectTo?: string) => {
    const finalRedirect = redirectTo || `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: finalRedirect,
        data: { full_name: fullName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    clearCachedAuth();
  };

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';
  const isLider = role === 'lider';
  const userStatus = (profile?.status as UserStatus) || null;
  const isPending = userStatus === 'pending';
  const isSuspended = userStatus === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        userStatus,
        isAdmin,
        isSuperAdmin,
        isLider,
        isPending,
        isSuspended,
        isLoading,
        plan,
        planStatus,
        subscriptionEnd,
        isPro,
        isBusiness,
        isFree,
        hasPlan,
        setEffectivePlan,
        refreshSubscription,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
