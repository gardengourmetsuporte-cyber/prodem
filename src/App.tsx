import { lazy, Suspense, useEffect, useRef } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FabActionProvider } from "@/contexts/FabActionContext";
import { UnitProvider, useUnit } from "@/contexts/UnitContext";
import { PageLoader } from "@/components/PageLoader";
import { useUserModules } from "@/hooks/useAccessLevels";
import { getModuleKeyFromRoute } from "@/lib/modules";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { toast } from "sonner";
import { useRoutePersist, useRouteRestore } from "@/hooks/useRouteRestore";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { DevRoleSwitcher } from "@/components/dev/DevRoleSwitcher";

const LAZY_RELOAD_KEY = 'lazy_reload_count';

function lazyRetry(importFn: () => Promise<any>, retries = 3): Promise<any> {
  return new Promise((resolve, reject) => {
    importFn()
      .then((module) => {
        // Reset reload counter on success
        sessionStorage.removeItem(LAZY_RELOAD_KEY);
        resolve(module);
      })
      .catch((err: Error) => {
        if (retries > 0) {
          setTimeout(() => {
            lazyRetry(importFn, retries - 1).then(resolve, reject);
          }, 500);
        } else {
          // Prevent infinite reload loop: max 2 reloads per session
          const reloadCount = parseInt(sessionStorage.getItem(LAZY_RELOAD_KEY) || '0', 10);
          if (reloadCount < 2) {
            sessionStorage.setItem(LAZY_RELOAD_KEY, String(reloadCount + 1));
            window.location.reload();
          } else {
            sessionStorage.removeItem(LAZY_RELOAD_KEY);
            reject(err);
          }
        }
      });
  });
}

// Lazy load all pages for code splitting with retry
const Auth = lazy(() => lazyRetry(() => import("./pages/Auth")));
const DashboardNew = lazy(() => lazyRetry(() => import("./pages/DashboardNew")));
const Agenda = lazy(() => lazyRetry(() => import("./pages/Agenda")));
const Finance = lazy(() => lazyRetry(() => import("./pages/Finance")));
const Inventory = lazy(() => lazyRetry(() => import("./pages/Inventory")));

const Production = lazy(() => lazyRetry(() => import("./pages/Production")));

const Rewards = lazy(() => lazyRetry(() => import("./pages/Rewards")));
const Settings = lazy(() => lazyRetry(() => import("./pages/Settings")));
const NotFound = lazy(() => lazyRetry(() => import("./pages/NotFound")));
const CashClosing = lazy(() => lazyRetry(() => import("./pages/CashClosing")));

const Employees = lazy(() => lazyRetry(() => import("./pages/Employees")));
const TabletConfirm = lazy(() => lazyRetry(() => import("./pages/TabletConfirm")));
const CardapioHub = lazy(() => lazyRetry(() => import("./pages/CardapioHub")));
const SeedPage = lazy(() => lazyRetry(() => import("./pages/Seed")));

const Profile = lazy(() => lazyRetry(() => import("./pages/Profile")));
const Orders = lazy(() => lazyRetry(() => import("./pages/Orders")));
const Marketing = lazy(() => lazyRetry(() => import("./pages/Marketing")));
const Ranking = lazy(() => lazyRetry(() => import("./pages/Ranking")));

const Landing = lazy(() => lazyRetry(() => import("./pages/Landing")));


const Invite = lazy(() => lazyRetry(() => import("./pages/Invite")));

const QuotationPublic = lazy(() => lazyRetry(() => import("./pages/QuotationPublic")));
const CalendarFull = lazy(() => lazyRetry(() => import("./pages/CalendarFull")));
const Customers = lazy(() => lazyRetry(() => import("./pages/Customers")));
const DigitalMenu = lazy(() => lazyRetry(() => import("./pages/DigitalMenu")));
const Notifications = lazy(() => lazyRetry(() => import("./pages/Notifications")));
const PendingApproval = lazy(() => lazyRetry(() => import("./pages/PendingApproval")));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
    mutations: {
      onError: (error: Error) => {
        console.error('[Mutation error]', error);
        toast.error(error.message || 'Ocorreu um erro ao salvar.');
      },
    },
  },
});

// PageLoader imported from @/components/PageLoader

function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function ProtectedRoute({ children, skipOnboarding }: { children: React.ReactNode; skipOnboarding?: boolean }) {
  const { user, isLoading, isPending, isSuspended } = useAuth();
  const location = useLocation();
  const { hasAccess, isLoading: modulesLoading } = useUserModules();
  const { units, isLoading: unitsLoading } = useUnit();

  if (isLoading || unitsLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Block pending/suspended users
  if (isPending || isSuspended) {
    return <PendingApproval />;
  }

  // Do not block forever when auto-provision/recovery cannot attach a unit.
  if (!skipOnboarding && units.length === 0) {
    console.warn('[ProtectedRoute] No units available after load; continuing without blocking');
  }

  // Check module access (skip during loading to avoid flash)
  if (!modulesLoading) {
    const moduleKey = getModuleKeyFromRoute(location.pathname);
    if (moduleKey && !hasAccess(moduleKey)) {
      return <Navigate to="/" replace />;
    }
  }

  return <RouteErrorBoundary>{children}</RouteErrorBoundary>;
}

function UnhandledRejectionGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const msg = String(e.reason?.message || e.reason || "");
      // Auto-reload on dynamic import failures (stale cache / deploy)
      if (msg.includes("Failed to fetch dynamically imported module") || msg.includes("Loading chunk")) {
        e.preventDefault();
        const key = "unhandled_import_reload";
        const count = parseInt(sessionStorage.getItem(key) || "0", 10);
        if (count < 2) {
          sessionStorage.setItem(key, String(count + 1));
          window.location.reload();
        } else {
          sessionStorage.removeItem(key);
          toast.error("Erro ao carregar a página. Tente recarregar manualmente.");
        }
        return;
      }
      console.error("[Unhandled rejection]", e.reason);
      toast.error("Ocorreu um erro inesperado.");
      e.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
  return <>{children}</>;
}

function AppRoutes() {
  useRoutePersist();
  useRouteRestore();
  useDocumentTitle();
  useNetworkStatus();

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/invite" element={<Invite />} />
          <Route path="/" element={<ProtectedRoute><DashboardNew /></ProtectedRoute>} />
          <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />
          <Route path="/production-anty" element={<Navigate to="/production" replace />} />
          <Route path="/checklists" element={<Navigate to="/production" replace />} />
          <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/cash-closing" element={<ProtectedRoute><CashClosing /></ProtectedRoute>} />

          <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/cotacao/:token" element={<QuotationPublic />} />
          <Route path="/m/:unitId" element={<DigitalMenu />} />
          <Route path="/tablet/:unitId" element={<DigitalMenu />} />
          <Route path="/tablet/:unitId/menu" element={<DigitalMenu />} />
          <Route path="/tablet/:unitId/confirm/:orderId" element={<TabletConfirm />} />
          <Route path="/gamification/:unitId" element={<DigitalMenu />} />
          <Route path="/tablet-admin" element={<Navigate to="/cardapio" replace />} />
          <Route path="/cardapio" element={<ProtectedRoute><CardapioHub /></ProtectedRoute>} />
          <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />

          <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />

          <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/gamification" element={<Navigate to="/cardapio" replace />} />
          <Route path="/plans" element={<Navigate to="/" replace />} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarFull /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/seed" element={<ProtectedRoute><SeedPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <UnitProvider>
              <FabActionProvider>
                <UnhandledRejectionGuard>
                  {/* <DevRoleSwitcher /> */}
                  <AppRoutes />
                </UnhandledRejectionGuard>
              </FabActionProvider>
            </UnitProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;