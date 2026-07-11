import React from 'react';
import { WatchProvider } from '../types';
import { getProviderLogoUrl } from '../services/tmdbService';

const SUBSCRIPTION_KINDS: WatchProvider['kinds'][number][] = ['flatrate', 'free', 'ads'];

// Subscription-style providers (real streaming), in their existing order.
export const subscriptionProviders = (providers?: WatchProvider[]): WatchProvider[] =>
  (providers || []).filter((p) => p.kinds.some((k) => SUBSCRIPTION_KINDS.includes(k)));

// True when a title is only available transactionally (rent/buy), no subscription.
export const hasOnlyTransactional = (providers?: WatchProvider[]): boolean => {
  if (!providers || providers.length === 0) return false;
  return subscriptionProviders(providers).length === 0;
};

interface ProviderChipsProps {
  providers: WatchProvider[];
  // Max logo chips to render (grid cards keep it tight; modal shows all).
  max?: number;
  size?: 'sm' | 'md';
  // Show a subdued "Rent/Buy" chip when only transactional providers exist.
  showRentBuyFallback?: boolean;
}

// Renders provider logos as small rounded chips with a name tooltip. Providers
// without a logo are skipped (callers fall back to the text badge).
const ProviderChips: React.FC<ProviderChipsProps> = ({
  providers,
  max,
  size = 'sm',
  showRentBuyFallback = false,
}) => {
  const subs = subscriptionProviders(providers);
  const withLogos = subs.filter((p) => p.logoPath);
  const shown = typeof max === 'number' ? withLogos.slice(0, max) : withLogos;

  const dimension = size === 'md' ? 'w-8 h-8' : 'w-6 h-6';

  if (shown.length === 0) {
    if (showRentBuyFallback && hasOnlyTransactional(providers)) {
      return (
        <span className="px-2 py-0.5 rounded-sm bg-cyber-black/70 border border-gray-500/40 text-gray-400 text-[10px] font-mono font-bold uppercase tracking-wider">
          Rent/Buy
        </span>
      );
    }
    return null;
  }

  const remaining = withLogos.length - shown.length;

  return (
    <div className="flex items-center gap-1.5">
      {shown.map((p) => {
        const logo = getProviderLogoUrl(p.logoPath);
        return (
          <span
            key={p.name}
            title={p.name}
            className={`${dimension} rounded-md overflow-hidden border border-cyber-cyan/30 bg-cyber-black/70 backdrop-blur flex items-center justify-center shadow-neon-cyan/20 hover:border-cyber-cyan/60 transition-colors`}
          >
            {logo && (
              <img src={logo} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
            )}
          </span>
        );
      })}
      {remaining > 0 && (
        <span
          className={`${dimension} rounded-md border border-cyber-cyan/30 bg-cyber-black/70 flex items-center justify-center text-[9px] font-mono font-bold text-cyber-cyan`}
          title={`+${remaining} more`}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
};

export default ProviderChips;
