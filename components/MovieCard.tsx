import React from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Star } from 'lucide-react';
import { Movie } from '../types';
import { getImageUrl } from '../services/tmdbService';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  // Calculate color based on score - Updated to Amber/Red palette
  // High score: Amber (Gold), Mid: Crimson, Low: Grey/Red
  const scoreColor = movie.vote_average >= 7.5 ? '#ffaa00' : movie.vote_average >= 5 ? '#ff003c' : '#555';
  
  // Platform logo placeholder logic
  const getPlatformColor = (p?: string) => {
    switch(p) {
      case 'Netflix': return 'text-red-600';
      case 'Prime': return 'text-blue-400';
      case 'Disney+': return 'text-blue-500';
      case 'HBO': return 'text-purple-500';
      default: return 'text-white';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.3 }}
      className="group relative w-full aspect-[2/3] rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-cyber-cyan/50 hover:shadow-neon-cyan transition-all duration-300 bg-cyber-panel"
      onClick={() => onClick(movie)}
    >
      {/* Image */}
      <img
        src={getImageUrl(movie.poster_path)}
        alt={movie.title}
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
        loading="lazy"
      />

      {/* Holographic Overlay Gradient (Amber tint) */}
      <div className="absolute inset-0 bg-gradient-to-t from-cyber-black via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

      {/* Top Right: Circular Score */}
      <div className="absolute top-3 right-3 flex items-center justify-center w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/10 shadow-lg">
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

      {/* Platform Badge (Left Bottom Overlay) */}
      <div className="absolute bottom-24 left-3 px-2 py-1 rounded bg-black/80 backdrop-blur-sm border border-white/10 flex items-center gap-1">
        <span className={`text-xs font-bold font-mono ${getPlatformColor(movie.platform)}`}>
            {movie.platform || 'N/A'}
        </span>
      </div>

      {/* Info Content (Slide Up on Hover) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-cyber-black via-cyber-black/95 to-transparent">
        <h3 className="text-white font-mono font-bold text-lg leading-tight truncate group-hover:text-cyber-cyan transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 font-mono">
          <span>{movie.release_date.split('-')[0]}</span>
          <span>•</span>
          <span>{movie.media_type === 'tv' ? 'Series' : 'Movie'}</span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
          <button className="flex-1 flex items-center justify-center gap-2 bg-cyber-cyan/10 hover:bg-cyber-cyan text-cyber-cyan hover:text-black py-2 rounded text-xs font-bold border border-cyber-cyan/50 transition-colors">
            <Play size={14} /> PLAY
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-white/20 hover:border-cyber-purple hover:text-cyber-purple transition-colors bg-white/5">
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      {/* Glitch Effect Element (Decorative) */}
      <div className="absolute inset-0 bg-cyber-cyan mix-blend-overlay opacity-0 group-hover:opacity-10 pointer-events-none" />
    </motion.div>
  );
};

export default MovieCard;