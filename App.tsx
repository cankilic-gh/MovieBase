import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import InfiniteScrollGrid from './components/InfiniteScrollGrid';
import LoginModal from './components/LoginModal';
import FavoritesModal from './components/FavoritesModal';
import { Movie, MediaType } from './types';
import { getBackdropUrl, fetchTrailer } from './services/tmdbService';
import { supabase } from './services/supabaseClient';
import { X, Play, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

// Helper function to get platform color
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

// Detail Modal (In-file for simplicity of the prompt architecture, though ideally separate)
const MovieDetailModal: React.FC<{ movie: Movie; onClose: () => void; isLoggedIn: boolean }> = ({ movie, onClose, isLoggedIn }) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);

  useEffect(() => {
    const loadTrailer = async () => {
      setIsLoadingTrailer(true);
      const key = await fetchTrailer(movie.id, movie.media_type || 'movie');
      setTrailerKey(key);
      setIsLoadingTrailer(false);
    };
    loadTrailer();
  }, [movie.id, movie.media_type]);

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
        .channel(`favorites-modal-${movie.id}-${user.id}`)
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
      if (!isLoggedIn) {
        alert('Please login to add favorites');
      }
      return;
    }

    setIsAddingFavorite(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please login to add favorites');
        setIsAddingFavorite(false);
        return;
      }

      if (isFavorite) {
        // Remove from favorites
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
                        isFavorite 
                            ? 'text-cyber-cyan bg-cyber-cyan/10' 
                            : 'hover:text-cyber-cyan bg-white/5'
                    } ${isAddingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isLoggedIn ? (isFavorite ? 'Remove from favorites' : 'Add to favorites') : 'Login to add favorites'}
                >
                    {isAddingFavorite ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Heart 
                            size={20} 
                            className={isFavorite ? "fill-cyber-cyan text-cyber-cyan" : ""}
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

const App: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<MediaType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Check Supabase session on mount and when auth state changes
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Supabase session check failed:', error.message);
          return;
        }
        setIsLoggedIn(!!session);
      } catch (error) {
        console.warn('Failed to check Supabase session:', error);
      }
    };
    
    // Only check session if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      checkSession();

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsLoggedIn(!!session);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const handleLogin = async () => {
    // Check session after login to ensure it's persisted
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    } catch (error) {
      console.error('Failed to check session after login:', error);
    }
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
      <div className="min-h-screen bg-cyber-black text-gray-100 font-sans selection:bg-cyber-cyan selection:text-black">
        {/* Decorative Grid Background */}
        <div className="fixed inset-0 bg-cyber-grid bg-[length:40px_40px] z-0 pointer-events-none opacity-20" />
        
        <Navbar 
          onFilterChange={setActiveFilter} 
          activeFilter={activeFilter}
          isLoggedIn={isLoggedIn}
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
                    isLoggedIn={isLoggedIn}
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
                    isLoggedIn={isLoggedIn}
                />
            )}
        </AnimatePresence>
      </div>
    </HashRouter>
  );
};

export default App;