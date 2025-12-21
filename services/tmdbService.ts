import { Movie, ApiResponse, MediaType } from '../types';

const API_KEY = '0893e0e0ac70aa86ede89ce147d42782';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwODkzZTBlMGFjNzBhYTg2ZWRlODljZTE0N2Q0Mjc4MiIsIm5iZiI6MTc2NDY5MzY3Ny44MDQsInN1YiI6IjY5MmYxNmFkZWQzYTc0MTRiMjUxMjc3NCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.B2Fe3qLejRepgKxvc1oPcLkC_MT21l9lQUyiq3wbJ98';

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

export const fetchMovies = async (page: number, type: MediaType = 'all'): Promise<Movie[]> => {
  try {
    let endpoint = '';
    
    if (type === 'all') {
      endpoint = `/trending/all/week?language=en-US&page=${page}`;
    } else if (type === 'movie') {
      endpoint = `/discover/movie?include_adult=false&include_video=false&language=en-US&page=${page}&sort_by=popularity.desc`;
    } else if (type === 'tv') {
      endpoint = `/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page=${page}&sort_by=popularity.desc`;
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

export const searchMovies = async (query: string): Promise<Movie[]> => {
    if (!query) return [];
    
    try {
        const endpoint = `/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
        const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
        
        if (!res.ok) throw new Error("Search failed");

        const data = await res.json();

        // Filter out 'person' results and normalize
        const normalizedResults: Movie[] = data.results
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
            })).map(assignPlatform);

        return normalizedResults;

    } catch (error) {
        console.error("Search error", error);
        return [];
    }
};