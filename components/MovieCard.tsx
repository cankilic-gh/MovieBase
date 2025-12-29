import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Heart } from 'lucide-react';
import { Movie } from '../types';
import { getImageUrl, getBackdropUrl } from '../services/tmdbService';
import { supabase } from '../services/supabaseClient';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  variant?: 'standard' | 'featured' | 'large';
  isLoggedIn?: boolean;
  hideHeartButton?: boolean; // Hide the built-in heart button (useful for FavoritesModal)
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, variant = 'standard', isLoggedIn = false, hideHeartButton = false }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);

  // Check if movie is in favorites
  useEffect(() => {
    let isMounted = true;
    let channel: any = null;
    let authSubscription: any = null;

    const checkFavorite = async () => {
      // Always check session directly, don't rely only on isLoggedIn prop
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        
        if (!user) {
          if (isMounted) setIsFavorite(false);
          return;
        }

        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('movie_id', movie.id)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking favorite:', error);
          return;
        }

        if (isMounted) {
          setIsFavorite(!!data);
        }
      } catch (error) {
        console.error('Failed to check favorite:', error);
        if (isMounted) setIsFavorite(false);
      }
    };

    // Initial check
    checkFavorite();

    // Subscribe to auth state changes (for refresh scenarios)
    authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        if (session?.user) {
          checkFavorite();
        } else {
          setIsFavorite(false);
        }
      }
    });

    // Subscribe to favorites changes for this movie and user
    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) return;

      channel = supabase
        .channel(`favorites-${movie.id}-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorites',
            filter: `movie_id=eq.${movie.id}`,
          },
          () => {
            // Re-check favorite status when changes occur
            if (isMounted) {
              checkFavorite();
            }
          }
        )
        .subscribe();
    };

    // Setup subscription after a short delay to ensure session is loaded
    const timeoutId = setTimeout(() => {
      setupSubscription();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [movie.id]); // Remove isLoggedIn dependency, check session directly

  const handleAddToFavorites = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn || isAddingFavorite) {
      return;
    }

    // Prevent double-click
    if (isAddingFavorite) return;

    setIsAddingFavorite(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAddingFavorite(false);
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movie.id);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        // First check if it already exists
        const { data: existing } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('movie_id', movie.id)
          .maybeSingle();

        if (existing) {
          // Already exists, just update state
          setIsFavorite(true);
        } else {
          // Insert new favorite
          const { data, error } = await supabase
            .from('favorites')
            .insert({
              user_id: user.id,
              movie_id: movie.id,
              movie_title: movie.title,
              movie_data: movie
            })
            .select(); // Return inserted data to verify

          if (error) {
            // If it's a unique constraint violation, check again
            if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
              // Race condition: another request inserted it, just update state
              setIsFavorite(true);
            } else {
              console.error('Failed to insert favorite:', error);
              throw error;
            }
          } else {
            // Successfully inserted
            if (data && data.length > 0) {
              setIsFavorite(true);
            } else {
              console.warn('Insert returned no data');
              // Verify it was actually inserted
              const { data: verify } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('movie_id', movie.id)
                .maybeSingle();
              
              if (verify) {
                setIsFavorite(true);
              } else {
                throw new Error('Failed to insert favorite - no data returned');
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to update favorite:', error);
      // Don't show alert, just log the error
    } finally {
      setIsAddingFavorite(false);
    }
  };

  // Calculate color based on score
  const scoreColor = movie.vote_average >= 7.5 ? '#FFD700' : movie.vote_average >= 5 ? '#00F3FF' : '#555';
  
  const getPlatformColor = (p?: string) => {
    if (!p) return 'text-white';
    
    // Normalize platform name for comparison
    const platformLower = p.toLowerCase();
    
    if (platformLower.includes('netflix')) return 'text-red-600';
    if (platformLower.includes('prime')) return 'text-blue-400';
    if (platformLower.includes('disney')) return 'text-blue-500';
    if (platformLower.includes('hbo')) return 'text-purple-500';
    if (platformLower.includes('hulu')) return 'text-green-500';
    if (platformLower.includes('apple')) return 'text-gray-300';
    if (platformLower.includes('paramount')) return 'text-blue-600';
    if (platformLower.includes('showtime')) return 'text-red-500';
    if (platformLower.includes('starz')) return 'text-purple-400';
    if (platformLower.includes('crunchyroll')) return 'text-orange-500';
    
    return 'text-cyber-cyan';
  };

  // Determine Image Source and Style based on Variant
  const isFeatured = variant === 'featured';
  const isLarge = variant === 'large';
  
  const imageSrc = isFeatured ? getBackdropUrl(movie.backdrop_path) : getImageUrl(movie.poster_path);
  
  // Dynamic classes based on variant
  const titleSize = isFeatured ? 'text-4xl md:text-6xl' : isLarge ? 'text-2xl md:text-3xl' : 'text-lg';
  const infoSize = isFeatured || isLarge ? 'text-sm md:text-base' : 'text-xs';
  const containerClasses = isFeatured 
    ? 'w-full h-full' // Featured takes full container height defined in Grid
    : 'w-full h-full'; // Standard/Large take full height of their aspect ratio container

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ zIndex: 20, scale: isFeatured ? 1.01 : 1.05 }}
      transition={{ duration: 0.3 }}
      className={`group relative overflow-hidden cursor-pointer border border-white/5 hover:border-cyber-cyan/50 hover:shadow-neon-cyan transition-all duration-300 bg-cyber-panel rounded-xl ${containerClasses}`}
      onClick={() => onClick(movie)}
    >
      {/* Image */}
      <img
        src={imageSrc}
        alt={movie.title}
        className={`w-full h-full object-cover transition-transform duration-700 ${isFeatured ? 'group-hover:scale-105 opacity-60 group-hover:opacity-80' : 'opacity-80 group-hover:opacity-100'}`}
        loading="lazy"
      />

      {/* Holographic Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t ${isFeatured ? 'from-cyber-black via-cyber-black/50 to-transparent' : 'from-cyber-black via-transparent to-transparent'} opacity-90 transition-opacity`} />

      {/* Top Right: Circular Score and Add Button */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
        {/* Add to Favorites Button - Hidden if hideHeartButton is true */}
        {!hideHeartButton && (
          <button 
            className={`w-10 h-10 flex items-center justify-center rounded transition-colors bg-black/80 backdrop-blur-md ${
              isFavorite 
                ? 'opacity-100 text-cyber-cyan bg-cyber-cyan/20' 
                : 'opacity-0 group-hover:opacity-100 hover:text-cyber-cyan'
            } ${isAddingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleAddToFavorites}
            disabled={isAddingFavorite || !isLoggedIn}
            title={isLoggedIn ? (isFavorite ? 'Remove from favorites' : 'Add to favorites') : 'Login to add favorites'}
          >
            {isAddingFavorite ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart 
                size={18} 
                className={isFavorite ? "fill-cyber-cyan text-cyber-cyan" : ""}
              />
            )}
          </button>
        )}
        {/* Circular Score */}
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/10 shadow-lg">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-gray-800"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={scoreColor}
            strokeWidth="3"
            strokeDasharray={`${movie.vote_average * 10}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[10px] font-bold text-white font-mono">
          {movie.vote_average.toFixed(1)}
        </span>
        </div>
      </div>

      {/* Featured Specific: Big Play Button Center */}
      {isFeatured && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100">
                <Play className="fill-white text-white ml-1" size={40} />
            </div>
        </div>
      )}

      {/* Content Info */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 z-20 transform ${isFeatured ? 'translate-y-0' : 'translate-y-4 group-hover:translate-y-0'} transition-transform duration-300`}>
        {/* Platform Badge */}
        <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded bg-black/60 backdrop-blur border border-white/10 text-xs font-bold font-mono ${getPlatformColor(movie.platform)}`}>
                {movie.platform || 'N/A'}
            </span>
            {isFeatured && (
                <span className="px-2 py-1 rounded bg-cyber-purple/20 border border-cyber-purple text-cyber-purple text-xs font-mono font-bold animate-pulse">
                    TRENDING #1
                </span>
            )}
        </div>

        <h3 className={`${titleSize} text-white font-mono font-black leading-tight truncate md:whitespace-normal group-hover:text-cyber-cyan transition-colors drop-shadow-lg`}>
          {movie.title}
        </h3>

        {/* Extra info for featured/large */}
        {(isFeatured || isLarge) && (
            <p className="text-gray-300 text-sm line-clamp-2 mt-2 max-w-2xl font-sans opacity-80 hidden md:block">
                {movie.overview}
            </p>
        )}
        
        <div className={`flex items-center gap-2 mt-2 ${infoSize} text-gray-400 font-mono`}>
          <span>{movie.release_date?.split('-')[0]}</span>
          <span>•</span>
          <span>{movie.media_type === 'tv' ? 'Series' : 'Movie'}</span>
          {isFeatured && (
            <>
                <span>•</span>
                <span className="text-cyber-green">98% Match</span>
            </>
          )}
        </div>
        
      </div>
      
      {/* Glitch Effect Overlay */}
      <div className="absolute inset-0 bg-cyber-cyan mix-blend-overlay opacity-0 group-hover:opacity-5 pointer-events-none" />
    </motion.div>
  );
};

export default MovieCard;