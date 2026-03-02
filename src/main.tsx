// Prodem entry
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force update: when a new service worker is installed, reload — but only after a grace period
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready
    .then((reg) => {
      // Check for updates on load
      reg.update().catch(() => {});

      // On visibility change (returning to app), check for updates with debounce
      let updateDebounce: ReturnType<typeof setTimeout> | null = null;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          if (updateDebounce) clearTimeout(updateDebounce);
          updateDebounce = setTimeout(() => {
            reg.update().catch(() => {});
            updateDebounce = null;
          }, 5000);
        }
      });

      // When a new SW is installed and waiting, activate it silently
      // The new version will be active on next natural navigation
      const activateWaiting = () => {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      };

      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        newSW?.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            // New version ready — activate silently without reload
            activateWaiting();
          }
        });
      });

      // If there's already a waiting SW on load, activate it
      activateWaiting();
    })
    .catch(() => {});
}

// Fix: prevent page jump when virtual keyboard opens on iOS/mobile
if ("ontouchstart" in window) {
  let savedScrollY = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  document.addEventListener("focusin", (e) => {
    const target = e.target as HTMLElement;
    if (!(target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

    // Skip when dnd-kit is active to avoid scroll conflicts
    if (document.querySelector('[data-dnd-dragging], [data-rfd-draggable-context-id]')) return;

    const isInsideOverlay = target.closest(
      '[role="dialog"], [vaul-drawer], [data-radix-popper-content-wrapper], .sheet-content'
    );

    if (isInsideOverlay) {
      savedScrollY = window.scrollY;
      requestAnimationFrame(() => {
        window.scrollTo(0, savedScrollY);
      });
      // Single debounced fallback instead of multiple timeouts
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        window.scrollTo(0, savedScrollY);
        debounceTimer = null;
      }, 150);
    } else {
      setTimeout(() => {
        const scrollable = target.closest('.flex-1.overflow-y-auto, .overflow-y-auto');
        if (scrollable) {
          const targetRect = target.getBoundingClientRect();
          const containerRect = scrollable.getBoundingClientRect();
          const offset = targetRect.top - containerRect.top - containerRect.height / 3;
          scrollable.scrollTop += offset;
        }
      }, 350);
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
