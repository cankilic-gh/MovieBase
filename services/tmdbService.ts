import { Movie, ApiResponse, MediaType } from '../types';

const ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN || '';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

export const getImageUrl = (path: string | null) => 
  path ? `${IMAGE_BASE_URL}${path}` : 'https://placehold.co/500x750/1a0b0b/ffaa00?text=NO+IMAGE';

export const getBackdropUrl = (path: string | null) =>
  path ? `${BACKDROP_BASE_URL}${path}` : 'https://placehold.co/1920x1080/1a0b0b/ffaa00?text=NO+SIGNAL';

// Helper to assign random platform (since API doesn't provide this easily in list view)
const assignPlatform = (movie: Movie): Movie => {
  const platforms: Array<'Netflix' | 'Prime' | 'Disney+' | 'Hulu' | 'HBO'> = ['Netflix', 'Prime', 'Disney+', 'Hulu', 'HBO'];
  // Deterministic assignment based on ID so it doesn't change on re-render
  const index = movie.id % platforms.length;
  return {
    ...movie,
    platform: platforms[index]
  };
};

const headers = {
  'Authorization': `Bearer ${ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};

export const fetchMovies = async (page: number, type: MediaType = 'all', genreId?: number): Promise<Movie[]> => {
  try {
    let endpoint = '';
    
    if (type === 'all') {
      if (genreId) {
        // When genre filter is active, use discover endpoint for both movies and TV
        const [movieRes, tvRes] = await Promise.all([
          fetch(`${BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=${page}&sort_by=popularity.desc&with_genres=${genreId}`, { headers }),
          fetch(`${BASE_URL}/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page=${page}&sort_by=popularity.desc&with_genres=${genreId}`, { headers })
        ]);
        
        if (!movieRes.ok || !tvRes.ok) {
          throw new Error(`API Error: ${movieRes.status} or ${tvRes.status}`);
        }
        
        const movieData: ApiResponse<any> = await movieRes.json();
        const tvData: ApiResponse<any> = await tvRes.json();
        
        // Combine and normalize
        const combinedResults = [
          ...movieData.results.map((item: any) => ({ ...item, media_type: 'movie' })),
          ...tvData.results.map((item: any) => ({ ...item, media_type: 'tv' }))
        ];
        
        const normalizedResults: Movie[] = combinedResults.map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          overview: item.overview,
          vote_average: item.vote_average,
          release_date: item.release_date || item.first_air_date || 'TBA',
          genre_ids: item.genre_ids,
          media_type: item.media_type,
        })).map(assignPlatform);
        
        return normalizedResults;
      } else {
        endpoint = `/trending/all/week?language=en-US&page=${page}`;
      }
    } else if (type === 'movie') {
      endpoint = `/discover/movie?include_adult=false&include_video=false&language=en-US&page=${page}&sort_by=popularity.desc`;
      if (genreId) {
        endpoint += `&with_genres=${genreId}`;
      }
    } else if (type === 'tv') {
      endpoint = `/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page=${page}&sort_by=popularity.desc`;
      if (genreId) {
        endpoint += `&with_genres=${genreId}`;
      }
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
    
    if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
    }
    
    const data: ApiResponse<any> = await res.json();
    
    // Normalize data (TV shows use 'name' instead of 'title', 'first_air_date' instead of 'release_date')
    const normalizedResults: Movie[] = data.results.map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date || 'TBA',
        genre_ids: item.genre_ids,
        media_type: item.media_type || (type === 'tv' ? 'tv' : 'movie'), // Discover endpoints don't return media_type
    })).map(assignPlatform);

    return normalizedResults;

  } catch (error) {
    console.error("Failed to fetch movies", error);
    return [];
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

export const searchMovies = async (query: string): Promise<Movie[]> => {
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
                const endpoint = `/search/multi?query=${encodeURIComponent(searchQuery)}&include_adult=false&language=en-US&page=1`;
                const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
                
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
        
        // Remove relevanceScore before returning and assign platforms
        const normalizedResults: Movie[] = sortedResults.map(({ relevanceScore, ...item }) => 
            assignPlatform(item)
        );

        return normalizedResults;

    } catch (error) {
        console.error("Search error", error);
        return [];
    }
};

// Fetch trailer video key from TMDB
export const fetchTrailer = async (movieId: number, mediaType: 'movie' | 'tv' = 'movie'): Promise<string | null> => {
    try {
        const endpoint = `/${mediaType}/${movieId}/videos?language=en-US`;
        const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
        
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