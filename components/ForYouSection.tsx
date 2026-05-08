import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Movie } from '../types';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { useStreamingAlerts } from '../hooks/useStreamingAlerts';
import { supabase } from '../services/supabaseClient';
import MovieCard from './MovieCard';

const ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN || '';
const BASE_URL = 'https://api.themoviedb.org/3';

interface ForYouSectionProps {
  onMovieClick: (m: Movie) => void;
}

interface SourceRef {
  id: number;
  media_type: 'movie' | 'tv';
}

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const ForYouSection: React.FC<ForYouSectionProps> = ({ onMovieClick }) => {
  const { isLoggedIn } = useAuth();
  const { favoriteIds } = useFavorites(isLoggedIn);
  const { alertIds } = useStreamingAlerts(isLoggedIn);
  const totalSignals = favoriteIds.size + alertIds.size;

  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSignals, setHasSignals] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setRecommendations([]);
      setHasSignals(null);
      return;
    }
    if (totalSignals === 0) {
      setHasSignals(false);
      setRecommendations([]);
      return;
    }

    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [favRes, alertRes] = await Promise.all([
          supabase.from('favorites').select('movie_id, movie_data').eq('user_id', user.id),
          supabase.from('streaming_alerts').select('movie_id, media_type').eq('user_id', user.id),
        ]);

        const sources: SourceRef[] = [];
        for (const f of favRes.data ?? []) {
          const m = (f as any).movie_data as Movie | null;
          if (m && typeof m.id === 'number') {
            sources.push({ id: m.id, media_type: m.media_type === 'tv' ? 'tv' : 'movie' });
          } else if ((f as any).movie_id) {
            sources.push({ id: (f as any).movie_id, media_type: 'movie' });
          }
        }
        for (const a of alertRes.data ?? []) {
          sources.push({
            id: (a as any).movie_id,
            media_type: (a as any).media_type === 'tv' ? 'tv' : 'movie',
          });
        }

        if (!isMounted) return;
        setHasSignals(sources.length > 0);
        if (sources.length === 0) {
          setRecommendations([]);
          setLoading(false);
          return;
        }

        const knownIds = new Set(sources.map((s) => s.id));
        const bases = shuffle(sources).slice(0, 3);
        const collected: Movie[] = [];
        const collectedIds = new Set<number>();

        for (const base of bases) {
          if (collected.length >= 4) break;
          try {
            const r = await fetch(
              `${BASE_URL}/${base.media_type}/${base.id}/recommendations?language=en-US&page=1`,
              { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } },
            );
            if (!r.ok) continue;
            const data = await r.json();
            for (const item of (data.results ?? []).slice(0, 8)) {
              if (collected.length >= 4) break;
              if (knownIds.has(item.id) || collectedIds.has(item.id)) continue;
              if (!item.poster_path) continue;
              collectedIds.add(item.id);
              collected.push({
                id: item.id,
                title: item.title || item.name,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                overview: item.overview,
                vote_average: item.vote_average,
                release_date: item.release_date || item.first_air_date || 'TBA',
                genre_ids: item.genre_ids ?? [],
                media_type: base.media_type,
              });
            }
          } catch (err) {
            console.error('TMDB recommendations fetch failed for', base, err);
          }
        }

        if (isMounted) {
          setRecommendations(collected);
          setLoading(false);
        }
      } catch (err) {
        console.error('ForYou load failed:', err);
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [isLoggedIn, totalSignals]);

  if (!isLoggedIn) return null;
  if (hasSignals === false) return null;
  if (!loading && recommendations.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-mono text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-cyber-cyan block shadow-[0_0_10px_#00F3FF]"></span>
          <Sparkles className="text-cyber-cyan drop-shadow-[0_0_6px_rgba(0,243,255,0.6)]" size={22} />
          For You
        </h2>
        <div className="text-xs font-mono text-cyber-cyan border border-cyber-cyan/30 px-2 py-1 rounded bg-cyber-cyan/5">
          BASED ON YOUR LIST + ALERTS
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-cyber-panel rounded-xl border border-cyber-cyan/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {recommendations.map((m) => (
            <div key={m.id} className="aspect-[2/3]">
              <MovieCard movie={m} onClick={onMovieClick} variant="standard" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForYouSection;
