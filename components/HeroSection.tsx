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
      {/* Video Background Mockup */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-cyber-black/70 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-black to-transparent z-10" />
        <img 
            src="https://images.unsplash.com/photo-1535905557558-afc4877a26fc?q=80&w=2574&auto=format&fit=crop" 
            alt="Cyberpunk City" 
            className="w-full h-full object-cover opacity-60"
        />
      </div>

      <div className="relative z-20 w-full max-w-4xl px-4 flex flex-col items-center text-center">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
        >
            <h1 className="text-5xl md:text-7xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-white to-cyber-purple drop-shadow-[0_0_10px_rgba(255,170,0,0.5)] mb-2">
            MOVIE<span className="text-cyber-cyan">BASE</span>
            </h1>
            <p className="text-cyber-green font-mono text-sm md:text-base tracking-[0.2em] mb-10 opacity-80 uppercase">
            System Online // Database Access Granted
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
            <div className="relative flex items-center bg-black/60 backdrop-blur-xl border border-white/20 rounded-full p-2 pl-6 focus-within:border-cyber-cyan focus-within:shadow-neon-cyan transition-all">
                <Search className="text-gray-400 w-5 h-5 mr-3 group-focus-within:text-cyber-cyan" />
                <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search movies, series, or actors..."
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
            {['Cyberpunk', 'Dystopian', 'Sci-Fi', 'Action', 'Anime'].map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-sm border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono uppercase cursor-pointer hover:bg-cyber-cyan hover:text-black transition-colors">
                    {tag}
                </span>
            ))}
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;