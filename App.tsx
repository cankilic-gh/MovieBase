import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import InfiniteScrollGrid from './components/InfiniteScrollGrid';
import LoginModal from './components/LoginModal';
import FavoritesModal from './components/FavoritesModal';
import MovieDetailModal from './components/MovieDetailModal';
import { Movie, MediaType } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';

// Genre mapping: Category name -> TMDB Genre ID
const GENRE_MAP: Record<string, number> = {
  'Action': 28,
  'Comedy': 35,
  'Drama': 18,
  'Horror': 27,
  'Romance': 10749,
  'Adventure': 12,
  'Kids': 10751,
};

const AppContent: React.FC = () => {
  const { isLoggedIn, checkSession } = useAuth();
  const [activeFilter, setActiveFilter] = useState<MediaType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleLogin = async () => {
    await checkSession();
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
    setActiveCategory(null);
  };

  const handleCategoryFilter = (category: string | null) => {
    setActiveCategory(category);
    setSearchQuery(''); // Clear search when filtering by category
  };

  const genreId = activeCategory ? GENRE_MAP[activeCategory] : undefined;

  return (
    <HashRouter>
      <motion.div
        className="min-h-screen bg-cyber-black text-gray-100 font-sans selection:bg-cyber-cyan selection:text-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Decorative Grid Background */}
        <div className="fixed inset-0 bg-cyber-grid bg-[length:40px_40px] z-0 pointer-events-none opacity-20" />

        {/* Meteors Effect */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-0.5 rounded-full bg-gradient-to-r from-cyber-cyan to-transparent"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-5%',
                width: `${Math.random() * 100 + 50}px`,
                transform: 'rotate(215deg)',
                boxShadow: '0 0 10px rgba(0, 243, 255, 0.5)'
              }}
              initial={{ y: -100, opacity: 0 }}
              animate={{
                y: ['0vh', '120vh'],
                opacity: [0, 1, 1, 0]
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                delay: Math.random() * 10,
                repeat: Infinity,
                repeatDelay: Math.random() * 15 + 5,
                ease: 'linear'
              }}
            />
          ))}
        </div>
        
        <Navbar
          onFilterChange={setActiveFilter}
          activeFilter={activeFilter}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenFavorites={() => setIsFavoritesOpen(true)}
        />

        <main className="relative z-10 pt-20">
          <Routes>
            <Route path="/" element={
              <>
                <HeroSection
                    onSearch={handleSearch}
                    searchQuery={searchQuery}
                    onClearSearch={handleClearSearch}
                    onCategoryFilter={handleCategoryFilter}
                    activeCategory={activeCategory}
                />
                <InfiniteScrollGrid
                    onMovieClick={setSelectedMovie}
                    searchQuery={searchQuery}
                    filterType={activeFilter}
                    onClearSearch={handleClearSearch}
                    genreId={genreId}
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
        
        {isLoggedIn && (
          <FavoritesModal
            isOpen={isFavoritesOpen}
            onClose={() => setIsFavoritesOpen(false)}
            onMovieClick={setSelectedMovie}
          />
        )}
        
        <AnimatePresence>
            {selectedMovie && (
                <MovieDetailModal
                    movie={selectedMovie}
                    onClose={() => setSelectedMovie(null)}
                />
            )}
        </AnimatePresence>
      </motion.div>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;