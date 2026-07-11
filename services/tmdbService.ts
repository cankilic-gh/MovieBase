import { Movie, ApiResponse, MediaType, WatchProvider } from '../types';
import { tmdbFetch } from './tmdbClient';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';
// Small square logos for provider chips.
const PROVIDER_LOGO_BASE_URL = 'https://image.tmdb.org/t/p/w92';

// Default watch region (can be changed to 'TR' for Turkey, 'US' for United States, etc.)
const DEFAULT_WATCH_REGION = 'US';

// TMDB Provider ID to Platform Name Mapping
// Based on TMDB's watch provider IDs (https://www.themoviedb.org/talk/5e6c3cd6000e4d3ab53797ed)
const PROVIDER_MAP: Record<number, string> = {
  8: 'Netflix',
  9: 'Prime Video',
  119: 'Prime Video',
  337: 'Disney+',
  15: 'Hulu',
  31: 'HBO Max',
  1899: 'Max',
  350: 'Apple TV+',
  2: 'Apple TV',
  3: 'Google Play Movies',
  68: 'Microsoft Store',
  192: 'YouTube',
  283: 'Crunchyroll',
  384: 'HBO Go',
  531: 'Paramount+',
  619: 'Starz',
  626: 'Showtime',
  387: 'Peacock',
  386: 'Peacock',
  1770: 'Paramount+',
  584: 'Discovery+',
};

export const getImageUrl = (path: string | null) =>
  path ? `${IMAGE_BASE_URL}${path}` : 'https://placehold.co/500x750/1a0b0b/DC143C?text=NO+IMAGE';

export const getBackdropUrl = (path: string | null) =>
  path ? `${BACKDROP_BASE_URL}${path}` : 'https://placehold.co/1920x1080/1a0b0b/DC143C?text=NO+SIGNAL';

// Provider logo (small square). Returns null when there's no logo so the UI can
// fall back to the text badge.
export const getProviderLogoUrl = (logoPath: string | null): string | null =>
  logoPath ? `${PROVIDER_LOGO_BASE_URL}${logoPath}` : null;

// Result of resolving a title's availability: the primary sentinel/name (kept
// backward compatible) plus the full ordered provider list.
interface ProviderResolution {
  platform: string | null;
  platforms: WatchProvider[];
}

// Cache for watch providers to avoid excessive API calls. Keyed by
// mediaType-id-region; stores the full resolution.
const providerCache = new Map<string, ProviderResolution>();

// Cache of the current theatrical release id set per region (from now_playing).
// Populated lazily and reused so the 'Theatre' sentinel is accurate.
const nowPlayingIdCache = new Map<string, Set<number>>();

// Days-since-release window used as a fallback theatre heuristic when the
// now_playing set can't confirm a title.
const THEATRE_WINDOW_DAYS = 45;

// Check if a movie is currently in theatres. A movie counts as "in theatres"
// if it appears in the cached now_playing id set for the region, OR it was
// released within the last THEATRE_WINDOW_DAYS.
const isInTheatres = (
  releaseDate: string | undefined,
  movieId?: number,
  region: string = DEFAULT_WATCH_REGION,
): boolean => {
  if (movieId !== undefined) {
    const set = nowPlayingIdCache.get(region);
    if (set && set.has(movieId)) return true;
  }

  if (!releaseDate || releaseDate === 'TBA') return false;

  const release = new Date(releaseDate);
  const now = new Date();
  const daysSinceRelease = (now.getTime() - release.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceRelease >= 0 && daysSinceRelease <= THEATRE_WINDOW_DAYS;
};

// Fetch (and cache) the set of movie ids currently in theatres for a region.
// Pure/idempotent per region: subsequent calls reuse the cached set.
export const ensureNowPlayingSet = async (
  region: string = DEFAULT_WATCH_REGION,
): Promise<Set<number>> => {
  const cached = nowPlayingIdCache.get(region);
  if (cached) return cached;

  const ids = new Set<number>();
  try {
    // First two pages give a solid current-theatrical picture.
    for (let page = 1; page <= 2; page++) {
      const res = await tmdbFetch('/movie/now_playing', {
        language: 'en-US',
        page,
        region,
      });
      if (!res.ok) break;
      const data = await res.json();
      for (const item of data.results ?? []) {
        if (typeof item.id === 'number') ids.add(item.id);
      }
      if (!data.total_pages || page >= data.total_pages) break;
    }
  } catch (err) {
    console.error('Failed to fetch now_playing set', err);
  }

  nowPlayingIdCache.set(region, ids);
  return ids;
};

// Map a raw TMDB provider entry to our WatchProvider shape, applying the
// friendly PROVIDER_MAP name where we have one.
const toWatchProvider = (
  raw: any,
  kind: WatchProvider['kinds'][number],
): WatchProvider => ({
  name: PROVIDER_MAP[raw.provider_id] || raw.provider_name || 'Unknown',
  logoPath: raw.logo_path ?? null,
  kinds: [kind],
});

// Dedupe providers by name across buckets, merging their kinds. Subscription
// buckets are processed first so subscription-first ordering is preserved.
const dedupeProviders = (list: WatchProvider[]): WatchProvider[] => {
  const byName = new Map<string, WatchProvider>();
  for (const p of list) {
    const existing = byName.get(p.name);
    if (existing) {
      for (const k of p.kinds) {
        if (!existing.kinds.includes(k)) existing.kinds.push(k);
      }
      if (!existing.logoPath && p.logoPath) existing.logoPath = p.logoPath;
    } else {
      byName.set(p.name, { ...p, kinds: [...p.kinds] });
    }
  }
  return Array.from(byName.values());
};

const theatreResolution: ProviderResolution = { platform: 'Theatre', platforms: [] };
const rentBuyResolution = (platforms: WatchProvider[]): ProviderResolution => ({
  platform: 'Rent/Buy',
  platforms,
});
const emptyResolution: ProviderResolution = { platform: null, platforms: [] };

// Fetch watch providers for a single movie/TV show, returning the primary
// sentinel/name (backward compatible) plus the full ordered provider list.
const fetchWatchProvider = async (
  movieId: number,
  mediaType: 'movie' | 'tv' = 'movie',
  region: string = DEFAULT_WATCH_REGION,
  releaseDate?: string
): Promise<ProviderResolution> => {
  const cacheKey = `${mediaType}-${movieId}-${region}`;

  const cached = providerCache.get(cacheKey);
  if (cached) return cached;

  const theatreFallback = (): ProviderResolution => {
    if (mediaType === 'movie' && isInTheatres(releaseDate, movieId, region)) {
      providerCache.set(cacheKey, theatreResolution);
      return theatreResolution;
    }
    providerCache.set(cacheKey, emptyResolution);
    return emptyResolution;
  };

  try {
    const res = await tmdbFetch(`/${mediaType}/${movieId}/watch/providers`, { region });
    if (!res.ok) return theatreFallback();

    const data = await res.json();
    const regionData = data.results?.[region];
    if (!regionData) return theatreFallback();

    // Subscription-style buckets first (real streaming badge), then transactional.
    const subscription = dedupeProviders([
      ...(regionData.flatrate || []).map((p: any) => toWatchProvider(p, 'flatrate')),
      ...(regionData.free || []).map((p: any) => toWatchProvider(p, 'free')),
      ...(regionData.ads || []).map((p: any) => toWatchProvider(p, 'ads')),
    ]);
    const transactional = dedupeProviders([
      ...(regionData.rent || []).map((p: any) => toWatchProvider(p, 'rent')),
      ...(regionData.buy || []).map((p: any) => toWatchProvider(p, 'buy')),
    ]);

    // Merge for the full list (subscription first), keeping kinds merged across all.
    const allProviders = dedupeProviders([...subscription, ...transactional]);

    if (subscription.length > 0) {
      const resolution: ProviderResolution = {
        platform: subscription[0].name,
        platforms: allProviders,
      };
      providerCache.set(cacheKey, resolution);
      return resolution;
    }

    if (transactional.length > 0) {
      const resolution = rentBuyResolution(allProviders);
      providerCache.set(cacheKey, resolution);
      return resolution;
    }

    return theatreFallback();
  } catch (error) {
    console.error(`Failed to fetch watch provider for ${mediaType} ${movieId}:`, error);
    return theatreFallback();
  }
};

// Batch fetch watch providers for multiple movies.
const fetchWatchProvidersBatch = async (
  movies: Movie[],
  region: string = DEFAULT_WATCH_REGION
): Promise<Map<number, ProviderResolution>> => {
  const providerMap = new Map<number, ProviderResolution>();

  // Fetch providers in parallel (limit to 10 concurrent requests to avoid rate limiting)
  const batchSize = 10;
  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, i + batchSize);
    const promises = batch.map(async (movie) => {
      const provider = await fetchWatchProvider(
        movie.id,
        movie.media_type || 'movie',
        region,
        movie.release_date
      );
      return { id: movie.id, provider };
    });

    const results = await Promise.all(promises);
    results.forEach(({ id, provider }) => {
      providerMap.set(id, provider);
    });

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < movies.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return providerMap;
};

// Attach resolved provider data to a list of movies (keeps `platform`
// backward-compatible and adds the full `platforms` array).
const attachProviders = (
  movies: Movie[],
  providerMap: Map<number, ProviderResolution>,
): Movie[] =>
  movies.map((movie) => {
    const resolution = providerMap.get(movie.id);
    return {
      ...movie,
      platform: (resolution?.platform as any) || undefined,
      platforms: resolution?.platforms && resolution.platforms.length > 0
        ? resolution.platforms
        : undefined,
    };
  });

// Public: resolve providers for an arbitrary list of movies (used by
// FavoritesModal to refresh stale badges on open).
export const enrichMoviesWithProviders = async (
  movies: Movie[],
  region: string = DEFAULT_WATCH_REGION,
): Promise<Movie[]> => {
  if (movies.length === 0) return movies;
  await ensureNowPlayingSet(region);
  const providerMap = await fetchWatchProvidersBatch(movies, region);
  return attachProviders(movies, providerMap);
};

// Export function to fetch full provider resolution for a single movie
// (useful for detail views / deep links).
export const fetchMovieWatchProvider = async (
  movieId: number,
  mediaType: 'movie' | 'tv' = 'movie',
  region: string = DEFAULT_WATCH_REGION,
  releaseDate?: string,
): Promise<ProviderResolution> => {
  await ensureNowPlayingSet(region);
  return fetchWatchProvider(movieId, mediaType, region, releaseDate);
};

// Export function to clear provider cache (useful for region changes). Also
// clears the now_playing set so theatre detection re-resolves for the new region.
export const clearProviderCache = (): void => {
  providerCache.clear();
  nowPlayingIdCache.clear();
};

// Normalize a raw TMDB list item into our Movie shape.
const normalizeItem = (item: any, fallbackType?: 'movie' | 'tv'): Movie => ({
  id: item.id,
  title: item.title || item.name,
  poster_path: item.poster_path,
  backdrop_path: item.backdrop_path,
  overview: item.overview,
  vote_average: item.vote_average,
  release_date: item.release_date || item.first_air_date || 'TBA',
  genre_ids: item.genre_ids || [],
  media_type: item.media_type || fallbackType || 'movie',
});

export const fetchMovies = async (
  page: number,
  type: MediaType = 'all',
  genreId?: number,
  region: string = DEFAULT_WATCH_REGION,
): Promise<Movie[]> => {
  try {
    // Ensure now_playing set is warm so theatre detection is accurate for cards.
    await ensureNowPlayingSet(region);

    // "In Theaters" browse mode: current theatrical releases.
    if (type === 'now_playing') {
      const res = await tmdbFetch('/movie/now_playing', {
        language: 'en-US',
        page,
        region,
      });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data: ApiResponse<any> = await res.json();
      if (!data?.results || !Array.isArray(data.results)) return [];
      let normalized: Movie[] = data.results.map((item: any) => normalizeItem(item, 'movie'));
      if (genreId) {
        normalized = normalized.filter((m) => m.genre_ids.includes(genreId));
      }
      if (normalized.length === 0) return [];
      const providerMap = await fetchWatchProvidersBatch(normalized, region);
      return attachProviders(normalized, providerMap);
    }

    let endpoint = '';

    if (type === 'all') {
      if (genreId) {
        // When genre filter is active, use discover endpoint for both movies and TV
        const [movieRes, tvRes] = await Promise.all([
          tmdbFetch('/discover/movie', {
            include_adult: 'false',
            include_video: 'false',
            language: 'en-US',
            page,
            sort_by: 'popularity.desc',
            with_genres: genreId,
          }),
          tmdbFetch('/discover/tv', {
            include_adult: 'false',
            include_null_first_air_dates: 'false',
            language: 'en-US',
            page,
            sort_by: 'popularity.desc',
            with_genres: genreId,
          }),
        ]);

        if (!movieRes.ok || !tvRes.ok) {
          throw new Error(`API Error: ${movieRes.status} or ${tvRes.status}`);
        }

        const movieData: ApiResponse<any> = await movieRes.json();
        const tvData: ApiResponse<any> = await tvRes.json();

        const combinedResults = [
          ...movieData.results.map((item: any) => ({ ...item, media_type: 'movie' })),
          ...tvData.results.map((item: any) => ({ ...item, media_type: 'tv' })),
        ];

        const normalizedResults: Movie[] = combinedResults.map((item: any) =>
          normalizeItem(item, item.media_type));

        if (normalizedResults.length > 0) {
          const providerMap = await fetchWatchProvidersBatch(normalizedResults, region);
          return attachProviders(normalizedResults, providerMap);
        }
        return normalizedResults;
      } else {
        endpoint = `/trending/all/week`;
      }
    }

    let params: Record<string, string | number | undefined>;
    if (type === 'movie') {
      endpoint = '/discover/movie';
      params = {
        include_adult: 'false',
        include_video: 'false',
        language: 'en-US',
        page,
        sort_by: 'popularity.desc',
        with_genres: genreId,
      };
    } else if (type === 'tv') {
      endpoint = '/discover/tv';
      params = {
        include_adult: 'false',
        include_null_first_air_dates: 'false',
        language: 'en-US',
        page,
        sort_by: 'popularity.desc',
        with_genres: genreId,
      };
    } else {
      // trending/all
      params = { language: 'en-US', page };
    }

    if (!endpoint) return [];

    const res = await tmdbFetch(endpoint, params);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);

    const data: ApiResponse<any> = await res.json();
    if (!data || !data.results || !Array.isArray(data.results)) return [];

    const fallbackType = type === 'tv' ? 'tv' : 'movie';
    const normalizedResults: Movie[] = data.results.map((item: any) =>
      normalizeItem(item, fallbackType));

    if (normalizedResults.length > 0) {
      const providerMap = await fetchWatchProvidersBatch(normalizedResults, region);
      return attachProviders(normalizedResults, providerMap);
    }
    return normalizedResults;
  } catch (error) {
    console.error("Failed to fetch movies", error);
    return [];
  }
};

// Fetch a single title by id (for deep links) and enrich with providers.
export const fetchMovieById = async (
  id: number,
  mediaType: 'movie' | 'tv',
  region: string = DEFAULT_WATCH_REGION,
): Promise<Movie | null> => {
  try {
    const res = await tmdbFetch(`/${mediaType}/${id}`, { language: 'en-US' });
    if (!res.ok) return null;
    const item = await res.json();
    const movie = normalizeItem({ ...item, media_type: mediaType }, mediaType);
    const [enriched] = await enrichMoviesWithProviders([movie], region);
    return enriched || movie;
  } catch (error) {
    console.error('Failed to fetch movie by id', error);
    return null;
  }
};

// Helper function to calculate relevance score
const calculateRelevanceScore = (title: string, query: string): number => {
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    const titleWords = titleLower.split(/\s+/).filter(w => w.length > 0);
    
    // Exact match gets highest score
    if (titleLower === queryLower) return 1000;
    
    // Starts with query gets high score
    if (titleLower.startsWith(queryLower)) return 500;
    
    // Contains full query gets medium-high score
    if (titleLower.includes(queryLower)) return 300;
    
    // Check if all query words appear in title (for "john wick" -> "John Wick")
    const allWordsMatch = queryWords.every(qw => 
        titleWords.some(tw => tw.includes(qw) || qw.includes(tw))
    );
    if (allWordsMatch) return 200;
    
    // Check if any query word appears in title (for "john" or "wick" -> "John Wick")
    const anyWordMatch = queryWords.some(qw => 
        titleWords.some(tw => tw.includes(qw) || qw.includes(tw))
    );
    if (anyWordMatch) return 100;
    
    // Partial character match (fuzzy)
    let charMatches = 0;
    for (const char of queryLower) {
        if (titleLower.includes(char)) charMatches++;
    }
    if (charMatches > 0) return charMatches / queryLower.length * 50;
    
    return 0;
};

export const searchMovies = async (query: string, region: string = DEFAULT_WATCH_REGION): Promise<Movie[]> => {
    if (!query) return [];

    try {
        const queryTrimmed = query.trim();
        const queryWords = queryTrimmed.split(/\s+/).filter(w => w.length > 0);
        
        // Perform multiple searches: full query + individual words
        const searchQueries = [
            queryTrimmed, // Full query first
            ...queryWords // Then individual words
        ];
        
        // Remove duplicates
        const uniqueQueries = Array.from(new Set(searchQueries));
        
        // Fetch results for all queries in parallel
        const searchPromises = uniqueQueries.map(async (searchQuery) => {
            try {
                const res = await tmdbFetch('/search/multi', {
                    query: searchQuery,
                    include_adult: 'false',
                    language: 'en-US',
                    page: 1,
                });

                if (!res.ok) return [];

        const data = await res.json();

        // Filter out 'person' results and normalize
                return data.results
            .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
            .map((item: any) => ({
                id: item.id,
                title: item.title || item.name,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                overview: item.overview,
                vote_average: item.vote_average,
                release_date: item.release_date || item.first_air_date || 'TBA',
                genre_ids: item.genre_ids,
                media_type: item.media_type
                    }));
            } catch (error) {
                console.error(`Search error for query "${searchQuery}"`, error);
                return [];
            }
        });
        
        const allResults = await Promise.all(searchPromises);
        
        // Flatten and deduplicate by ID
        const movieMap = new Map<number, any>();
        
        allResults.flat().forEach((item: any) => {
            if (!movieMap.has(item.id)) {
                movieMap.set(item.id, item);
            }
        });
        
        // Convert to array and calculate relevance scores
        const moviesWithScores = Array.from(movieMap.values()).map((item: any) => ({
            ...item,
            relevanceScore: calculateRelevanceScore(item.title || item.name, queryTrimmed)
        }));
        
        // Sort by relevance score (descending), then by vote_average (descending)
        const sortedResults = moviesWithScores.sort((a, b) => {
            if (b.relevanceScore !== a.relevanceScore) {
                return b.relevanceScore - a.relevanceScore;
            }
            return (b.vote_average || 0) - (a.vote_average || 0);
        });
        
        // Remove relevanceScore before returning
        const normalizedResults: Movie[] = sortedResults.map(({ relevanceScore, ...item }) => item);
        
        // Fetch watch providers for search results (usually fewer results, so we can fetch all)
        if (normalizedResults.length > 0) {
          await ensureNowPlayingSet(region);
          const providerMap = await fetchWatchProvidersBatch(normalizedResults, region);
          return attachProviders(normalizedResults, providerMap);
        }

        return normalizedResults;

    } catch (error) {
        console.error("Search error", error);
        return [];
    }
};

// Fetch trailer video key from TMDB
export const fetchTrailer = async (movieId: number, mediaType: 'movie' | 'tv' = 'movie'): Promise<string | null> => {
    try {
        const res = await tmdbFetch(`/${mediaType}/${movieId}/videos`, { language: 'en-US' });

        if (!res.ok) {
            throw new Error(`Trailer API Error: ${res.status}`);
        }
        
        const data = await res.json();
        
        // Find the first trailer (prefer official trailers, then teasers, then any video)
        const trailer = data.results?.find((video: any) => 
            video.type === 'Trailer' && video.site === 'YouTube' && (video.official || true)
        ) || data.results?.find((video: any) => 
            video.type === 'Teaser' && video.site === 'YouTube'
        ) || data.results?.find((video: any) => 
            video.site === 'YouTube'
        );
        
        return trailer?.key || null;
    } catch (error) {
        console.error("Failed to fetch trailer", error);
        return null;
    }
};