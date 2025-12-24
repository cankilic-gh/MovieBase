import React from 'react';
import { motion } from 'framer-motion';
import { Play, Plus } from 'lucide-react';
import { Movie } from '../types';
import { getImageUrl, getBackdropUrl } from '../services/tmdbService';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  variant?: 'standard' | 'featured' | 'large';
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, variant = 'standard' }) => {
  // Calculate color based on score
  const scoreColor = movie.vote_average >= 7.5 ? '#ffaa00' : movie.vote_average >= 5 ? '#ff003c' : '#555';
  
  const getPlatformColor = (p?: string) => {
    switch(p) {
      case 'Netflix': return 'text-red-600';
      case 'Prime': return 'text-blue-400';
      case 'Disney+': return 'text-blue-500';
      case 'HBO': return 'text-purple-500';
      default: return 'text-white';
    }
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
        {/* Add to Favorites Button */}
        <button 
          className="w-10 h-10 flex items-center justify-center rounded border border-white/20 hover:border-cyber-purple hover:text-cyber-purple transition-colors bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Add to favorites functionality
          }}
          title="Add to favorites"
        >
          <Plus size={18} />
        </button>
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
        
        {/* Action Buttons (Standard & Large Only - Featured has center play) */}
        {!isFeatured && (
            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
            <button className="flex-1 flex items-center justify-center gap-2 bg-cyber-cyan/10 hover:bg-cyber-cyan text-cyber-cyan hover:text-black py-2 rounded text-xs font-bold border border-cyber-cyan/50 transition-colors">
                <Play size={14} /> PLAY
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-white/20 hover:border-cyber-purple hover:text-cyber-purple transition-colors bg-white/5">
                <Plus size={16} />
            </button>
            </div>
        )}
      </div>
      
      {/* Glitch Effect Overlay */}
      <div className="absolute inset-0 bg-cyber-cyan mix-blend-overlay opacity-0 group-hover:opacity-5 pointer-events-none" />
    </motion.div>
  );
};

export default MovieCard;