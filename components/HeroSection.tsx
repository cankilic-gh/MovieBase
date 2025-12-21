import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="relative w-full h-[60vh] flex flex-col items-center justify-center overflow-hidden border-b border-cyber-cyan/20">
      {/* Background Image - Retro Video Store Theme */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-cyber-black/70 z-10 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-black via-cyber-black/50 to-transparent z-10" />
        
        <img 
            src="/store.png"
            alt="Cyberpunk Video Store"
            className="w-full h-full object-cover opacity-80"
        />
        
        {/* VHS Scanline Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-40" />
      </div>

      <div className="relative z-20 w-full max-w-4xl px-4 flex flex-col items-center text-center">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-2"
        >
            <div className="relative inline-block group cursor-default">
                {/* Bloom Effect */}
                <div className="absolute inset-0 bg-cyber-cyan/30 blur-3xl opacity-20 group-hover:opacity-60 transition-opacity duration-200" />
                
                {/* Main Text */}
                <h1 className="relative z-10 text-5xl md:text-8xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-white to-cyber-purple drop-shadow-[0_0_10px_rgba(255,170,0,0.5)] tracking-tighter">
                    MOVIE<span className="text-cyber-cyan">BASE</span>
                </h1>

                {/* Glitch Layer 1 (Red Shift) */}
                <h1 className="absolute top-0 left-0 z-0 text-5xl md:text-8xl font-mono font-black text-cyber-red opacity-0 group-hover:opacity-70 group-hover:animate-glitch-1 select-none pointer-events-none mix-blend-screen tracking-tighter">
                    MOVIEBASE
                </h1>
                
                {/* Glitch Layer 2 (Cyan/Blue Shift) */}
                <h1 className="absolute top-0 left-0 z-0 text-5xl md:text-8xl font-mono font-black text-blue-500 opacity-0 group-hover:opacity-70 group-hover:animate-glitch-2 select-none pointer-events-none mix-blend-screen tracking-tighter">
                    MOVIEBASE
                </h1>
            </div>
            
            <p className="text-cyber-green font-mono text-sm md:text-base tracking-[0.3em] mb-10 opacity-80 uppercase mt-4 text-shadow-neon">
            /// Neural Network Connected ///
            </p>
        </motion.div>

        {/* Search Bar */}
        <motion.form 
            onSubmit={handleSearch}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-2xl relative group"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan to-cyber-purple blur opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
            <div className="relative flex items-center bg-black/80 backdrop-blur-xl border border-white/20 rounded-full p-2 pl-6 focus-within:border-cyber-cyan focus-within:shadow-neon-cyan transition-all">
                <Search className="text-gray-400 w-5 h-5 mr-3 group-focus-within:text-cyber-cyan" />
                <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search the archive..."
                    className="bg-transparent border-none outline-none text-white w-full font-mono placeholder-gray-500"
                />
                <button type="button" className="ml-2 p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <SlidersHorizontal size={20} />
                </button>
            </div>
        </motion.form>

        {/* Categories / Tags */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
        >
            {['Sci-Fi', 'Cyberpunk', 'Dystopia', 'Noir', 'Action', 'Thriller'].map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-sm border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono uppercase cursor-pointer hover:bg-cyber-cyan hover:text-black transition-colors hover:shadow-[0_0_10px_#ffaa00]">
                    {tag}
                </span>
            ))}
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;