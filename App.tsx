import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import InfiniteScrollGrid from './components/InfiniteScrollGrid';
import LoginModal from './components/LoginModal';
import { Movie, MediaType } from './types';
import { getBackdropUrl } from './services/tmdbService';
import { X, Play, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Detail Modal (In-file for simplicity of the prompt architecture, though ideally separate)
const MovieDetailModal: React.FC<{ movie: Movie; onClose: () => void }> = ({ movie, onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative w-full max-w-5xl bg-cyber-dark rounded-xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
      >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-cyber-red hover:text-white transition-colors"
        >
            <X size={24} />
        </button>

        {/* Backdrop / Video Area */}
        <div className="relative w-full md:w-2/3 h-64 md:h-auto bg-black">
            <img 
                src={getBackdropUrl(movie.backdrop_path)} 
                alt={movie.title}
                className="w-full h-full object-cover opacity-60"
            />
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center group cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-cyber-cyan/20 backdrop-blur border border-cyber-cyan/50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-neon-cyan">
                    <Play className="text-white ml-1 fill-white" size={32} />
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyber-dark to-transparent" />
        </div>

        {/* Info Area */}
        <div className="w-full md:w-1/3 p-8 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${movie.platform === 'Netflix' ? 'text-red-500 border-red-500/50' : 'text-blue-400 border-blue-400/50'}`}>
                    {movie.platform || 'STREAMING'}
                </span>
                <span className="text-gray-400 text-xs font-mono">{movie.release_date}</span>
            </div>

            <h2 className="text-3xl font-mono font-bold text-white mb-4 leading-none">{movie.title}</h2>
            
            <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1 text-cyber-cyan font-mono font-bold">
                    <span className="text-lg">{movie.vote_average.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">IMDB</span>
                </div>
                <div className="h-4 w-px bg-gray-700" />
                <div className="text-xs text-gray-400 font-mono">
                    {movie.media_type === 'tv' ? 'SERIES' : 'MOVIE'}
                </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed mb-8 font-light">
                {movie.overview}
            </p>

            <div className="space-y-3">
                <button className="w-full py-3 bg-white text-black font-bold rounded hover:bg-cyber-cyan transition-colors flex items-center justify-center gap-2">
                    <Play size={18} className="fill-black" /> RESUME PLAYING
                </button>
                <button className="w-full py-3 bg-white/5 border border-white/10 text-white hover:border-white/30 rounded transition-colors flex items-center justify-center gap-2">
                    <Info size={18} /> MORE INFO
                </button>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const App: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<MediaType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsLoginOpen(false);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    // Reset to 'all' if searching to search everything
    if(q) setActiveFilter('all');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveFilter('all');
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-cyber-black text-gray-100 font-sans selection:bg-cyber-cyan selection:text-black">
        {/* Decorative Grid Background */}
        <div className="fixed inset-0 bg-cyber-grid bg-[length:40px_40px] z-0 pointer-events-none opacity-20" />
        
        <Navbar 
          onFilterChange={setActiveFilter} 
          activeFilter={activeFilter}
          isLoggedIn={isLoggedIn}
          onOpenLogin={() => setIsLoginOpen(true)}
        />

        <main className="relative z-10 pt-20">
          <Routes>
            <Route path="/" element={
              <>
                <HeroSection 
                    onSearch={handleSearch} 
                    searchQuery={searchQuery}
                    onClearSearch={handleClearSearch}
                />
                <InfiniteScrollGrid 
                    onMovieClick={setSelectedMovie} 
                    searchQuery={searchQuery}
                    filterType={activeFilter}
                    onClearSearch={handleClearSearch}
                />
              </>
            } />
          </Routes>
        </main>

        {/* Modals */}
        <LoginModal 
            isOpen={isLoginOpen} 
            onClose={() => setIsLoginOpen(false)} 
            onLogin={handleLogin} 
        />
        
        <AnimatePresence>
            {selectedMovie && (
                <MovieDetailModal 
                    movie={selectedMovie} 
                    onClose={() => setSelectedMovie(null)} 
                />
            )}
        </AnimatePresence>
      </div>
    </HashRouter>
  );
};

export default App;