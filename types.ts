export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
  platform?: 'Netflix' | 'Prime' | 'Disney+' | 'Hulu' | 'HBO'; // Mocked for UI demo
}

export interface Genre {
  id: number;
  name: string;
}

export interface ApiResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export type SortOption = 'popularity.desc' | 'vote_average.desc' | 'release_date.desc';
export type MediaType = 'all' | 'movie' | 'tv';