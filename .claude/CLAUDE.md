# MovieBase - Claude Code Configuration

## Project Overview

Movie and TV show discovery app with a cyberpunk/retro-neon aesthetic. Browse trending content, search TMDB, filter by genre or media type (movie/TV/all), view streaming platform availability, watch trailers, and manage favorites via Supabase auth. Deployed on Vercel.

## Tech Stack

- **Framework:** React 18.2, TypeScript 5.2, Vite 5
- **Styling:** Tailwind CSS 3.3 with custom cyberpunk theme (no separate CSS modules)
- **Animation:** Framer Motion 10.16
- **Icons:** Lucide React
- **Routing:** React Router DOM 6.20 (HashRouter)
- **API:** TMDB API v3 (Bearer token auth)
- **Auth & DB:** Supabase (email/password auth, favorites table with realtime subscriptions)
- **Deploy:** Vercel (SPA with catch-all rewrite)

## Architecture

### Flat source structure (no `src/` directory)
```
MovieBase/
  App.tsx              # Root component, routing, genre map, background effects
  index.tsx            # React entry point
  types.ts             # Movie, Genre, ApiResponse, MediaType types
  index.css            # Tailwind + custom neon text-stroke, scrollbar, VHS effects
  components/
    Navbar.tsx         # Top nav with media type filter, login/favorites buttons
    HeroSection.tsx    # Hero banner with search + category pills
    InfiniteScrollGrid.tsx  # Paginated movie grid with intersection observer
    MovieCard.tsx      # Individual card with poster, rating, platform badge
    MovieDetailModal.tsx    # Detail overlay with trailer embed, cast, providers
    LoginModal.tsx     # Supabase email/password auth modal
    FavoritesModal.tsx # User's saved favorites list
  context/
    AuthContext.tsx     # Supabase auth state (isLoggedIn, checkSession)
  services/
    supabaseClient.ts  # Supabase client init with env validation
    tmdbService.ts     # TMDB API: fetch, search, trailers, watch providers
  hooks/
    useFavorites.ts    # Realtime favorite IDs via Supabase postgres_changes
  utils/
    userHelpers.ts     # User-related utility functions
```

### Data flow
- TMDB API provides movie/TV data, images, trailers, and watch provider info
- Watch providers fetched per-movie via TMDB `/watch/providers` endpoint, cached in-memory Map
- Supabase handles auth (email/password) and favorites persistence (realtime subscriptions)
- No local-first pattern -- all data fetched live from APIs

### Key patterns
- **Infinite scroll:** IntersectionObserver triggers next page fetch
- **Provider caching:** In-memory Map keyed by `{mediaType}-{movieId}-{region}`, batched fetches (10 concurrent max)
- **Search relevance:** Multi-query search (full phrase + individual words), custom scoring algorithm (exact > starts-with > contains > word match > fuzzy)
- **Theatre detection:** Movies released within 60 days with no streaming provider show "Theatre" badge

## Design Language (Cyberpunk/Retro Neon)

- **Background:** `#030005` (cyber-black) with cyan grid overlay
- **Accent colors:** `#00F3FF` (cyan primary), `#FF00FF` (magenta), `#DC143C` (crimson red), `#FF4D00` (orange), `#0066FF` (blue), `#00FF88` (green)
- **Fonts:** Inter (sans), Orbitron (mono/display), Bungee/Bebas Neue (retro display)
- **Effects:** Neon glow box-shadows, glitch animations, VHS scanlines, meteor particles, neon text-stroke outlines, pulse-neon keyframes
- **Scrollbar:** Dark track (`#0f0505`), dark thumb (`#331111`), cyan glow on hover
- **Cards:** Holographic gradients, neon-cyan/red/purple shadow variants

## Environment Variables

```
VITE_TMDB_API_KEY          # TMDB v3 API key
VITE_TMDB_ACCESS_TOKEN     # TMDB v4 Bearer token (used for API calls)
VITE_SUPABASE_URL          # Supabase project URL
VITE_SUPABASE_ANON_KEY     # Supabase anonymous/public key
```

## Conventions

- Default export for App component; named exports preferred elsewhere
- `const Component: React.FC = () => {}` pattern
- Tailwind classes inline, custom CSS only for effects that can't be done with Tailwind (text-stroke, VHS scanlines)
- TMDB image URLs built via helper functions (`getImageUrl`, `getBackdropUrl`)
- All movie/TV items normalized to `Movie` type (TV `name` -> `title`, `first_air_date` -> `release_date`)

## Known Gotchas

- **HashRouter, not BrowserRouter:** App uses `HashRouter` for Vercel SPA compatibility
- **TMDB rate limiting:** Watch provider batch requests throttled to 10 concurrent + 100ms delay between batches
- **Supabase fallback client:** If env vars missing/invalid, a placeholder Supabase client is created to prevent crashes (auth won't work but app loads)
- **Provider cache is in-memory only:** Cleared on page refresh; no localStorage persistence
- **Genre filter + "all" type:** When genre is active with "all" media type, both movie and TV discover endpoints are called and merged
- **index.css text-stroke specificity:** Hero title outlines use high-specificity selectors with `!important` -- be careful when modifying hero section styles
- **Tailwind content glob:** Uses `./**/*.{js,ts,jsx,tsx}` which includes all files in root (no src/ prefix)

## Commands

```bash
npm run dev      # Vite dev server
npm run build    # tsc + vite build
npm run preview  # Preview production build
```

## Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Root component, genre map, routing, background effects |
| `services/tmdbService.ts` | All TMDB API integration (fetch, search, trailers, providers) |
| `services/supabaseClient.ts` | Supabase client initialization |
| `hooks/useFavorites.ts` | Realtime favorites with Supabase subscriptions |
| `context/AuthContext.tsx` | Auth state management |
| `tailwind.config.js` | Cyberpunk color palette, neon shadows, glitch animations |
| `index.css` | Text-stroke effects, VHS scanlines, custom scrollbar |
| `types.ts` | Core TypeScript interfaces |
| `vercel.json` | Vercel deployment config (SPA rewrite) |

## Don't

- Don't remove the in-memory provider cache -- TMDB rate limits will break the app
- Don't switch from HashRouter to BrowserRouter without updating Vercel config
- Don't use `networkidle` wait strategies for TMDB fetches -- they can hang
- Don't add loading spinners for cached provider data -- show stale data immediately
- Don't change the Tailwind content glob without accounting for the flat directory structure
