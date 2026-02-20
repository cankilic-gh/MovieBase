import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Heart } from 'lucide-react';
import { Movie } from '../types';
import { getBackdropUrl, fetchTrailer } from '../services/tmdbService';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../context/AuthContext';

const getPlatformColor = (platform?: string): string => {
  if (!platform) return 'text-blue-400 border-blue-400/50';

  const platformLower = platform.toLowerCase();

  if (platformLower.includes('netflix')) return 'text-red-500 border-red-500/50';
  if (platformLower.includes('prime')) return 'text-blue-400 border-blue-400/50';
  if (platformLower.includes('disney')) return 'text-blue-500 border-blue-500/50';
  if (platformLower.includes('hbo')) return 'text-purple-500 border-purple-500/50';
  if (platformLower.includes('hulu')) return 'text-green-500 border-green-500/50';
  if (platformLower.includes('apple')) return 'text-gray-300 border-gray-300/50';
  if (platformLower.includes('paramount')) return 'text-blue-600 border-blue-600/50';
  if (platformLower.includes('showtime')) return 'text-red-500 border-red-500/50';
  if (platformLower.includes('starz')) return 'text-purple-400 border-purple-400/50';

  return 'text-cyber-cyan border-cyber-cyan/50';
};

interface MovieDetailModalProps {
  movie: Movie;
  onClose: () => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ movie, onClose }) => {
  const { isLoggedIn } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(isLoggedIn);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);

  const movieIsFavorite = isFavorite(movie.id);

  useEffect(() => {
    const loadTrailer = async () => {
      setIsLoadingTrailer(true);
      const key = await fetchTrailer(movie.id, movie.media_type || 'movie');
      setTrailerKey(key);
      setIsLoadingTrailer(false);
    };
    loadTrailer();
  }, [movie.id, movie.media_type]);

  const handleAddToFavorites = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isLoggedIn || isAddingFavorite) {
      if (!isLoggedIn) {
        alert('Please login to add favorites');
      }
      return;
    }

    setIsAddingFavorite(true);
    try {
      await toggleFavorite(movie.id, movieIsFavorite);
    } catch (error: any) {
      console.error('Failed to update favorite:', error);
      alert(error.message || 'Failed to update favorite');
    } finally {
      setIsAddingFavorite(false);
    }
  };

  const handlePlayClick = () => {
    if (trailerKey) {
      setShowTrailer(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative w-full max-w-5xl bg-cyber-dark rounded-xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-cyber-red hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Backdrop / Video Area */}
        <div className="relative w-full md:w-2/3 h-64 md:h-auto bg-black">
          {showTrailer && trailerKey ? (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
              title={`${movie.title} Trailer`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <img
                src={getBackdropUrl(movie.backdrop_path)}
                alt={movie.title}
                className="w-full h-full object-cover opacity-60"
              />
              {/* Play Button Overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center group cursor-pointer"
                onClick={handlePlayClick}
              >
                {isLoadingTrailer ? (
                  <div className="w-16 h-16 rounded-full bg-cyber-cyan/20 backdrop-blur border border-cyber-cyan/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : trailerKey ? (
                  <div className="w-16 h-16 rounded-full bg-cyber-cyan/20 backdrop-blur border border-cyber-cyan/50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-neon-cyan">
                    <Play className="text-white ml-1 fill-white" size={32} />
                  </div>
                ) : (
                  <div className="text-center p-4 bg-black/50 rounded backdrop-blur">
                    <p className="text-gray-400 text-sm font-mono">No trailer available</p>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyber-dark to-transparent" />
            </>
          )}
        </div>

        {/* Info Area */}
        <div className="w-full md:w-1/3 p-8 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getPlatformColor(movie.platform)}`}>
              {movie.platform || 'STREAMING'}
            </span>
            <span className="text-gray-400 text-xs font-mono">{movie.release_date}</span>
          </div>

          <div className="flex items-start justify-between mb-4">
            <h2 className="text-3xl font-mono font-bold text-white leading-none flex-1 pr-4">{movie.title}</h2>
            <button
              onClick={handleAddToFavorites}
              disabled={isAddingFavorite || !isLoggedIn}
              className={`w-10 h-10 flex items-center justify-center rounded transition-colors flex-shrink-0 ${
                movieIsFavorite
                  ? 'text-cyber-cyan bg-cyber-cyan/10'
                  : 'hover:text-cyber-cyan bg-white/5'
              } ${isAddingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isLoggedIn ? (movieIsFavorite ? 'Remove from favorites' : 'Add to favorites') : 'Login to add favorites'}
            >
              {isAddingFavorite ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Heart
                  size={20}
                  className={movieIsFavorite ? "fill-cyber-cyan text-cyber-cyan" : ""}
                />
              )}
            </button>
          </div>

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

          <p className="text-gray-300 text-sm leading-relaxed font-light">
            {movie.overview}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MovieDetailModal;
