import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ROUTE_KEY = 'prodem_last_route';

// Routes that should NOT be persisted
const IGNORE_ROUTES = ['/auth', '/landing', '/invite', '/onboarding'];

/**
 * Persists the current route (path + search params) to localStorage so the PWA
 * can restore it when iOS kills and restarts the app from background.
 */
export function useRoutePersist() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (!IGNORE_ROUTES.some(r => path.startsWith(r))) {
      try {
        const full = path + (location.search || '');
        localStorage.setItem(ROUTE_KEY, full);
      } catch {}
    }
  }, [location.pathname, location.search]);
}

/**
 * On mount, checks if there's a saved route and navigates to it.
 * Only runs once, only if we're on "/" (the default start_url).
 * Uses a retry to handle cases where the initial navigate might be
 * overridden by auth redirects.
 */
export function useRouteRestore() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRestored = useRef(false);

  useEffect(() => {
    // Only restore once per app lifecycle
    if (hasRestored.current) return;
    // Only restore if we landed on the root (PWA restart scenario)
    if (location.pathname !== '/') {
      hasRestored.current = true;
      return;
    }

    try {
      const saved = localStorage.getItem(ROUTE_KEY);
      if (saved && saved !== '/' && !IGNORE_ROUTES.some(r => saved.startsWith(r))) {
        hasRestored.current = true;
        // Use replace so back button doesn't go to "/"
        navigate(saved, { replace: true });
      }
    } catch {}
  }, [location.pathname]); // Re-check when pathname changes (e.g. after auth loads)
}

/**
 * Helper to get the saved route (used before forced reloads)
 */
export function getSavedRoute(): string | null {
  try {
    return localStorage.getItem(ROUTE_KEY);
  } catch {
    return null;
  }
}

/**
 * Helper to save current route immediately (call before any forced reload)
 */
export function persistCurrentRoute() {
  try {
    const path = window.location.pathname;
    if (!IGNORE_ROUTES.some(r => path.startsWith(r))) {
      localStorage.setItem(ROUTE_KEY, path + (window.location.search || ''));
    }
  } catch {}
}
