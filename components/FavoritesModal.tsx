import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Loader2 } from 'lucide-react';
import { Movie } from '../types';
import { supabase } from '../services/supabaseClient';
import MovieCard from './MovieCard';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieClick: (movie: Movie) => void;
}

const FavoritesModal: React.FC<FavoritesModalProps> = ({ isOpen, onClose, onMovieClick }) => {
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFavorites();
    }
  }, [isOpen]);

  const loadFavorites = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please login to view favorites');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('favorites')
        .select('movie_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const movies = data?.map((item: any) => item.movie_data).filter(Boolean) || [];
      setFavorites(movies);
    } catch (err: any) {
      console.error('Failed to load favorites:', err);
      setError(err.message || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  // Note: handleRemoveFavorite removed - favorites are managed via MovieCard component

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            className="fixed inset-0 m-auto w-full max-w-7xl h-[90vh] z-50 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-cyber-panel border border-cyber-cyan/30 rounded-xl overflow-hidden shadow-neon-cyan h-full flex flex-col">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-cyan to-cyber-purple" />
              
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-cyber-purple/20 flex items-center justify-center border border-cyber-purple/50">
                    <Heart className="text-cyber-purple fill-cyber-purple" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-mono font-bold text-white">MY FAVORITES</h2>
                    <p className="text-gray-400 text-sm font-mono">
                      {favorites.length} {favorites.length === 1 ? 'movie' : 'movies'} saved
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-cyber-cyan">
                    <Loader2 className="animate-spin w-8 h-8 mb-4" />
                    <span className="font-mono text-sm">LOADING FAVORITES...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-20 text-gray-500 font-mono">
                    <p className="text-red-400 mb-2">{error}</p>
                    <button
                      onClick={loadFavorites}
                      className="mt-4 px-4 py-2 bg-cyber-cyan/10 border border-cyber-cyan/50 text-cyber-cyan rounded hover:bg-cyber-cyan/20 transition-colors font-mono text-sm"
                    >
                      RETRY
                    </button>
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 font-mono">
                    <Heart className="mx-auto mb-4 text-gray-600" size={48} />
                    <p className="text-xl mb-2">NO FAVORITES YET</p>
                    <p className="text-sm text-gray-600">Start adding movies to your favorites list!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {favorites.map((movie) => (
                      <div key={movie.id} className="relative group">
                        <MovieCard 
                          movie={movie} 
                          onClick={onMovieClick}
                          variant="standard"
                          isLoggedIn={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FavoritesModal;

