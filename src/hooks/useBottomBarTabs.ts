import { useState, useCallback } from 'react';
import { ALL_MODULES } from '@/lib/modules';

const STORAGE_KEY = 'bottombar-pinned-tabs';
const DEFAULT_KEYS = ['production', 'inventory'];

export interface BottomTabDef {
  key: string;
  icon: string;
  label: string;
  path: string;
  moduleKey: string;
}

function resolveTab(moduleKey: string): BottomTabDef | null {
  const mod = ALL_MODULES.find(m => m.key === moduleKey);
  if (!mod || mod.key === 'dashboard' || mod.key === 'settings') return null;
  return {
    key: mod.key,
    icon: mod.icon,
    label: mod.label,
    path: mod.route,
    moduleKey: mod.key,
  };
}

function readFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_KEYS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 2 && parsed.every((k: unknown) => typeof k === 'string')) {
      return parsed;
    }
  } catch {}
  return DEFAULT_KEYS;
}

export function useBottomBarTabs() {
  const [pinnedKeys, setPinnedKeysState] = useState<string[]>(readFromStorage);

  const pinnedTabs: BottomTabDef[] = pinnedKeys
    .map(resolveTab)
    .filter((t): t is BottomTabDef => t !== null);

  // If resolution failed (module removed etc), fall back
  if (pinnedTabs.length < 2) {
    const fallbacks = DEFAULT_KEYS.map(resolveTab).filter((t): t is BottomTabDef => t !== null);
    while (pinnedTabs.length < 2 && fallbacks.length > 0) {
      const fb = fallbacks.shift()!;
      if (!pinnedTabs.find(t => t.key === fb.key)) pinnedTabs.push(fb);
    }
  }

  const setPinnedTabs = useCallback((keys: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    setPinnedKeysState(keys);
  }, []);

  return { pinnedTabs, pinnedKeys, setPinnedTabs };
}
