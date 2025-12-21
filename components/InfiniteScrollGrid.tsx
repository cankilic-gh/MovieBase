import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Movie, MediaType } from '../types';
import { fetchMovies, searchMovies } from '../services/tmdbService';
import MovieCard from './MovieCard';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollGridProps {
  onMovieClick: (movie: Movie) => void;
  searchQuery?: string;
  filterType: MediaType;
}

const InfiniteScrollGrid: React.FC<InfiniteScrollGridProps> = ({ onMovieClick, searchQuery, filterType }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Ref for intersection observer
  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastMovieElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Reset when search or filter changes
  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
  }, [searchQuery, filterType]);

  // Data Fetching Logic
  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true);
      
      let newMovies: Movie[] = [];
      
      if (searchQuery) {
        if (page === 1) {
            newMovies = await searchMovies(searchQuery);
            setHasMore(false);
        }
      } else {
        newMovies = await fetchMovies(page, filterType);
        if (newMovies.length === 0) setHasMore(false);
      }

      setMovies(prev => page === 1 ? newMovies : [...prev, ...newMovies]);
      setLoading(false);
    };

    loadMovies();
  }, [page, searchQuery, filterType]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-mono text-white flex items-center gap-2">
                <span className="w-2 h-8 bg-cyber-purple block"></span>
                {searchQuery ? `Results for "${searchQuery}"` : 'Trending Now'}
            </h2>
            <div className="text-xs font-mono text-cyber-cyan">
                {movies.length} TITLES FOUND
            </div>
        </div>

        {/* Grid Layout Container */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-auto">
            {movies.map((movie, index) => {
                // Layout Logic:
                // Index 0: Full Width Hero (Backdrop Image)
                // Index 1: Large Vertical (2 cols, 2 rows)
                // Index 2-5: Standard Vertical (1 col)
                // Index > 5: Standard Grid

                let gridClass = "col-span-1";
                let cardVariant: 'standard' | 'featured' | 'large' = 'standard';

                if (!searchQuery && page === 1 || (searchQuery && index < 6)) {
                     if (index === 0) {
                        gridClass = "col-span-2 md:col-span-4 h-[50vh] md:h-[600px]"; 
                        cardVariant = 'featured';
                    } else if (index === 1) {
                        gridClass = "col-span-2 md:col-span-2 md:row-span-2 aspect-[2/3]";
                        cardVariant = 'large';
                    } else if (index > 1 && index < 6) {
                        gridClass = "col-span-1 aspect-[2/3]";
                        cardVariant = 'standard';
                    } else {
                        gridClass = "col-span-1 aspect-[2/3]";
                    }
                } else {
                     // Infinite scroll items
                     gridClass = "col-span-1 aspect-[2/3]";
                }

                const content = (
                    <MovieCard 
                        movie={movie} 
                        onClick={onMovieClick} 
                        variant={cardVariant}
                    />
                );

                if (movies.length === index + 1) {
                    return (
                        <div ref={lastMovieElementRef} key={`${movie.id}-${index}`} className={gridClass}>
                            {content}
                        </div>
                    );
                } else {
                    return (
                        <div key={`${movie.id}-${index}`} className={gridClass}>
                            {content}
                        </div>
                    );
                }
            })}
        </div>

        {loading && (
            <div className="w-full py-10 flex flex-col items-center justify-center text-cyber-cyan">
                <Loader2 className="animate-spin w-8 h-8 mb-2" />
                <span className="font-mono text-xs animate-pulse">LOADING DATA STREAM...</span>
            </div>
        )}
        
        {!loading && movies.length === 0 && (
            <div className="text-center py-20 text-gray-500 font-mono">
                NO DATA FOUND IN SECTOR 7G.
            </div>
        )}
    </div>
  );
};

export default InfiniteScrollGrid;