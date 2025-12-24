import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Movie, MediaType } from '../types';
import { fetchMovies, searchMovies } from '../services/tmdbService';
import MovieCard from './MovieCard';
import { Loader2, X } from 'lucide-react';

interface InfiniteScrollGridProps {
  onMovieClick: (movie: Movie) => void;
  searchQuery?: string;
  filterType: MediaType;
  onClearSearch?: () => void;
  genreId?: number;
}

const InfiniteScrollGrid: React.FC<InfiniteScrollGridProps> = ({ onMovieClick, searchQuery, filterType, onClearSearch, genreId }) => {
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

  // Reset when search, filter, or genre changes
  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
  }, [searchQuery, filterType, genreId]);

  // Data Fetching Logic
  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true);
      
      let newMovies: Movie[] = [];
      
      if (searchQuery) {
        if (page === 1) {
            newMovies = await searchMovies(searchQuery);
            // Filter by genre if active
            if (genreId) {
              newMovies = newMovies.filter(movie => movie.genre_ids.includes(genreId));
            }
            setHasMore(false);
        }
      } else {
        newMovies = await fetchMovies(page, filterType, genreId);
        if (newMovies.length === 0) setHasMore(false);
      }

      setMovies(prev => page === 1 ? newMovies : [...prev, ...newMovies]);
      setLoading(false);
    };

    loadMovies();
  }, [page, searchQuery, filterType, genreId]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-mono text-white flex items-center gap-2">
                <span className="w-2 h-8 bg-cyber-purple block shadow-[0_0_10px_#ff003c]"></span>
                {searchQuery ? `Results for "${searchQuery}"` : 'Trending In Sector 01'}
            </h2>
            <div className="flex items-center gap-3">
                {searchQuery && onClearSearch && (
                    <button
                        onClick={onClearSearch}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-cyber-cyan border border-cyber-cyan/30 rounded bg-cyber-cyan/5 hover:bg-cyber-cyan/10 hover:border-cyber-cyan/50 transition-colors"
                    >
                        <X size={14} />
                        CLEAR SEARCH
                    </button>
                )}
                <div className="text-xs font-mono text-cyber-cyan border border-cyber-cyan/30 px-2 py-1 rounded bg-cyber-cyan/5">
                    {movies.length} TITLES FOUND
                </div>
            </div>
        </div>

        {/* 
            Grid Layout Logic:
            - grid-cols-4 for desktop.
            - First item (Index 0): Hero, spans all 4 cols.
            - Second item (Index 1): Large Vertical, spans 2 cols and 2 rows (Left side).
            - Next 4 items (Index 2-5): Standard, span 1 col each (Right side 2x2).
            - Subsequent items: Flow normally.
        */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-auto grid-flow-dense">
            {movies.map((movie, index) => {
                let gridClass = "col-span-1";
                let cardVariant: 'standard' | 'featured' | 'large' = 'standard';

                // Apply special layout only for the first page of "Trending" (no search)
                const isFirstPageDefault = !searchQuery && page === 1;

                if (isFirstPageDefault) {
                     if (index === 0) {
                        // 1. Hero Card (Top)
                        gridClass = "col-span-2 md:col-span-4 h-[50vh] md:h-[600px]"; 
                        cardVariant = 'featured';
                    } else if (index === 1) {
                        // 2. Large Vertical Card (Left Side of Bento)
                        // Spans 2 columns and 2 rows to match the height of 4 standard cards (2 stacked)
                        gridClass = "col-span-2 md:col-span-2 md:row-span-2 aspect-[2/3] md:aspect-auto";
                        cardVariant = 'large';
                    } else if (index >= 2 && index <= 5) {
                        // 3. The Quartet (Right Side of Bento) - 2x2 Grid
                        // These naturally flow into the remaining columns next to the row-span-2 item
                        gridClass = "col-span-1 md:col-span-1 aspect-[2/3]";
                        cardVariant = 'standard';
                    } else {
                        // Standard Grid Flow
                        gridClass = "col-span-1 aspect-[2/3]";
                    }
                } else {
                     // Search results or subsequent pages: Standard uniform grid
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
                <span className="font-mono text-xs animate-pulse">DOWNLOADING DATA PACKETS...</span>
            </div>
        )}
        
        {!loading && movies.length === 0 && (
            <div className="text-center py-20 text-gray-500 font-mono border border-gray-800 rounded p-10 bg-black/50">
                <p>NO DATA FOUND IN SECTOR 7G.</p>
                <p className="text-xs mt-2 text-gray-600">Try adjusting your search parameters.</p>
            </div>
        )}
    </div>
  );
};

export default InfiniteScrollGrid;