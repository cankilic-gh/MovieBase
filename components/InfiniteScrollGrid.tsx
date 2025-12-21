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
        // Simple search (no pagination in this MVP mock logic)
        if (page === 1) {
            newMovies = await searchMovies(searchQuery);
            setHasMore(false); // Assume 1 page for search
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {movies.map((movie, index) => {
                if (movies.length === index + 1) {
                    return (
                        <div ref={lastMovieElementRef} key={`${movie.id}-${index}`}>
                            <MovieCard movie={movie} onClick={onMovieClick} />
                        </div>
                    );
                } else {
                    return (
                        <div key={`${movie.id}-${index}`}>
                            <MovieCard movie={movie} onClick={onMovieClick} />
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