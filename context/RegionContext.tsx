import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WatchRegion } from '../types';
import { clearProviderCache } from '../services/tmdbService';

const STORAGE_KEY = 'moviebase-region';
const DEFAULT_REGION: WatchRegion = 'US';

// Regions offered in the Navbar selector. US stays the default so nothing
// changes for existing US users.
export const REGION_OPTIONS: { code: WatchRegion; label: string }[] = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'TR', label: 'Türkiye' },
  { code: 'IN', label: 'India' },
];

const VALID_CODES = new Set(REGION_OPTIONS.map((r) => r.code));

interface RegionContextType {
  region: WatchRegion;
  setRegion: (region: WatchRegion) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

const readStoredRegion = (): WatchRegion => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_CODES.has(stored as WatchRegion)) {
      return stored as WatchRegion;
    }
  } catch {
    /* localStorage unavailable — fall back to default */
  }
  return DEFAULT_REGION;
};

export const RegionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [region, setRegionState] = useState<WatchRegion>(readStoredRegion);

  const setRegion = useCallback((next: WatchRegion) => {
    setRegionState((prev) => {
      if (prev === next) return prev;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore persistence failures */
      }
      // Provider availability is region-specific — drop cached results so the
      // current view refetches against the new region.
      clearProviderCache();
      return next;
    });
  }, []);

  return (
    <RegionContext.Provider value={{ region, setRegion }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = (): RegionContextType => {
  const ctx = useContext(RegionContext);
  if (!ctx) {
    // Safe fallback so components used outside the provider still work.
    return { region: DEFAULT_REGION, setRegion: () => {} };
  }
  return ctx;
};
