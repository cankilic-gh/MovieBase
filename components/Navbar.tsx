import React, { useState, useEffect } from 'react';
import { User, Heart, LogOut, Globe, ChevronDown } from 'lucide-react';
import { MediaType, WatchRegion } from '../types';
import { supabase } from '../services/supabaseClient';
import { getUserInitials } from '../utils/userHelpers';
import { useAuth } from '../context/AuthContext';
import { REGION_OPTIONS } from '../context/RegionContext';

interface NavbarProps {
  onFilterChange: (type: MediaType) => void;
  activeFilter: MediaType;
  onOpenLogin: () => void;
  onOpenFavorites?: () => void;
  region: WatchRegion;
  onRegionChange: (region: WatchRegion) => void;
}

// Browse filter tabs. 'now_playing' surfaces the In Theaters view.
const FILTER_TABS: { value: MediaType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'Series' },
  { value: 'now_playing', label: 'In Theaters' },
];

const Navbar: React.FC<NavbarProps> = ({ onFilterChange, activeFilter, onOpenLogin, onOpenFavorites, region, onRegionChange }) => {
  const { isLoggedIn } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [regionOpen, setRegionOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the region dropdown on any outside click.
  useEffect(() => {
    if (!regionOpen) return;
    const close = () => setRegionOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [regionOpen]);

  useEffect(() => {
    const getUser = async () => {
      if (isLoggedIn) {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } else {
        setUser(null);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [isLoggedIn]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav className={`fixed top-0 w-full z-40 transition-all duration-300 border-b ${
      scrolled ? 'bg-cyber-black/95 backdrop-blur-xl border-cyber-cyan/30 shadow-neon-cyan py-3' : 'bg-transparent border-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo(0, 0)}>
          <span className="font-retro font-normal text-xl tracking-tight transition-all duration-300" style={{
            fontFamily: "'Bungee', 'Bebas Neue', sans-serif",
            letterSpacing: '-0.01em'
          } as React.CSSProperties}>
            <span style={{
              WebkitTextStrokeWidth: '1.5px',
              WebkitTextStrokeColor: '#DC143C',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 8px rgba(220, 20, 60, 0.8)) drop-shadow(0 0 16px rgba(220, 20, 60, 0.5))'
            } as React.CSSProperties}>
              MOVIE
            </span>
            <span style={{ 
              WebkitTextStrokeWidth: '1.5px',
              WebkitTextStrokeColor: '#0066FF',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 8px rgba(0, 102, 255, 0.8)) drop-shadow(0 0 16px rgba(0, 102, 255, 0.5))'
            } as React.CSSProperties}>
              BASE
            </span>
          </span>
          {/* Subtle glow on hover */}
          <div className="absolute inset-0 bg-red-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          <div className="absolute inset-0 bg-blue-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 translate-x-2" />
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:flex items-center gap-1 bg-cyber-black/60 p-1 rounded-full border border-cyber-cyan/20 backdrop-blur-md shadow-neon-cyan/50">
          {FILTER_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onFilterChange(value)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase font-bold transition-all duration-300 whitespace-nowrap ${
                activeFilter === value
                  ? 'bg-cyber-cyan/30 text-cyber-cyan shadow-neon-cyan border border-cyber-cyan/50 animate-pulse-neon'
                  : 'text-gray-400 hover:text-cyber-cyan hover:bg-cyber-cyan/10 border border-transparent hover:border-cyber-cyan/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {/* Region selector — drives watch-provider region. US is default. */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setRegionOpen((o) => !o)}
              aria-label="Select region"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyber-black/60 border border-cyber-cyan/30 text-gray-300 hover:text-cyber-cyan hover:border-cyber-cyan/60 hover:bg-cyber-cyan/10 transition-all duration-300 shadow-neon-cyan/30"
            >
              <Globe size={14} className="text-cyber-cyan drop-shadow-[0_0_4px_rgba(0,243,255,0.6)]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">{region}</span>
              <ChevronDown size={12} className={`transition-transform duration-300 ${regionOpen ? 'rotate-180' : ''}`} />
            </button>
            {regionOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-44 max-h-72 overflow-y-auto bg-cyber-panel/95 backdrop-blur-xl border border-cyber-cyan/40 rounded-lg shadow-neon-cyan z-50 py-1"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0, 243, 255, 0.3) transparent' }}
              >
                {REGION_OPTIONS.map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => { onRegionChange(code); setRegionOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 ${
                      region === code
                        ? 'text-cyber-cyan bg-cyber-cyan/10'
                        : 'text-gray-300 hover:text-cyber-cyan hover:bg-cyber-cyan/10'
                    }`}
                  >
                    <span className="truncate">{label}</span>
                    <span className="text-[10px] text-cyber-cyan/70 ml-2">{code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoggedIn && onOpenFavorites && (
          <button 
              onClick={onOpenFavorites}
              className="flex items-center gap-2 text-gray-300 hover:text-cyber-cyan transition-all duration-300 group px-3 py-1.5 rounded-full border border-transparent hover:border-cyber-cyan/30 hover:bg-cyber-cyan/10"
          >
              <Heart size={20} className="fill-cyber-cyan text-cyber-cyan group-hover:drop-shadow-[0_0_8px_rgba(0,243,255,0.8)] transition-all" />
            <span className="hidden sm:block text-xs font-mono font-bold uppercase tracking-wider">MY LIST</span>
          </button>
          )}
          
          {isLoggedIn && user ? (
            <div className="relative group">
              <button
                className="flex items-center justify-center w-9 h-9 rounded-full bg-cyber-cyan/20 border border-cyber-cyan/50 hover:border-cyber-cyan hover:bg-cyber-cyan/30 transition-all shadow-neon-cyan hover:shadow-neon-cyan hover:scale-110"
                title={user.email || 'User'}
                aria-label="Account menu"
              >
                <span className="text-cyber-cyan text-xs font-mono font-black drop-shadow-[0_0_4px_rgba(0,243,255,0.8)]">
                  {getUserInitials(user)}
                </span>
              </button>
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-cyber-panel/95 backdrop-blur-xl border border-cyber-cyan/40 rounded-lg shadow-neon-cyan opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-3 border-b border-cyber-cyan/20">
                  <p className="text-cyber-cyan text-sm font-mono font-bold truncate drop-shadow-[0_0_4px_rgba(0,243,255,0.5)]">{user.email}</p>
                  {user.user_metadata?.full_name && (
                    <p className="text-gray-400 text-xs mt-1 font-mono">{user.user_metadata.full_name}</p>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-cyber-orange hover:bg-cyber-orange/10 transition-all duration-300 text-sm font-mono font-bold uppercase tracking-wider"
                >
                  <LogOut size={16} className="drop-shadow-[0_0_4px_rgba(255,77,0,0.5)]" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
          <button
            onClick={onOpenLogin}
            aria-label="Sign in"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-cyber-black/60 border border-cyber-cyan/30 hover:border-cyber-cyan hover:bg-cyber-cyan/20 transition-all duration-300 shadow-neon-cyan/50 hover:shadow-neon-cyan hover:scale-110"
          >
              <User size={18} className="text-cyber-cyan drop-shadow-[0_0_4px_rgba(0,243,255,0.6)]" />
          </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;