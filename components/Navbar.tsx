import React, { useState, useEffect } from 'react';
import { User, Heart, Film } from 'lucide-react';
import { MediaType } from '../types';

interface NavbarProps {
  onFilterChange: (type: MediaType) => void;
  activeFilter: MediaType;
  isLoggedIn: boolean;
  onOpenLogin: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onFilterChange, activeFilter, isLoggedIn, onOpenLogin }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-40 transition-all duration-300 border-b ${
      scrolled ? 'bg-cyber-black/90 backdrop-blur-md border-cyber-cyan/20 py-3' : 'bg-transparent border-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
          <Film className="text-cyber-cyan" />
          <span className="font-mono font-bold text-xl tracking-wider text-white">
            MOVIE<span className="text-cyber-cyan">BASE</span>
          </span>
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:flex items-center gap-1 bg-black/30 p-1 rounded-full border border-white/10 backdrop-blur-sm">
          {(['all', 'movie', 'tv'] as MediaType[]).map((type) => (
            <button
              key={type}
              onClick={() => onFilterChange(type)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase transition-all ${
                activeFilter === type 
                  ? 'bg-cyber-cyan/20 text-cyber-cyan shadow-[0_0_10px_rgba(0,243,255,0.2)] border border-cyber-cyan/30' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {type === 'tv' ? 'Series' : type === 'all' ? 'All' : 'Movies'}
            </button>
          ))}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenLogin}
            className="flex items-center gap-2 text-gray-300 hover:text-cyber-pink transition-colors group"
          >
            <Heart size={20} className={isLoggedIn ? "fill-cyber-red text-cyber-red" : "group-hover:text-cyber-red"} />
            <span className="hidden sm:block text-xs font-mono">MY LIST</span>
          </button>
          
          <button 
            onClick={onOpenLogin}
            className="flex items-center justify-center w-9 h-9 rounded bg-white/5 border border-white/20 hover:border-cyber-cyan hover:bg-cyber-cyan/10 transition-all"
          >
            <User size={18} className={isLoggedIn ? "text-cyber-cyan" : "text-white"} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;