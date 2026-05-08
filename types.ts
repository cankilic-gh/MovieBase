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
  // Real subscription platform name from TMDB watch providers API
  // (e.g. 'Netflix', 'Prime Video'), or sentinel values:
  //   'Rent/Buy' -> only available transactionally (rent or buy)
  //   'Theatre'  -> released within last 60 days, no streaming yet
  // undefined -> no availability info known
  platform?: string;
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