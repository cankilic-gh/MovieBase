# 🎬 MovieBase

**Your personal movie collection, powered by TMDB.** Discover, explore, and save your favorite films with a sleek cyberpunk-inspired interface.

[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.89-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## ✨ Features

### 🎥 Movie Discovery
- **Infinite Scroll Grid** - Browse thousands of movies seamlessly
- **TMDB Integration** - Access to comprehensive movie database
- **Genre Filtering** - Filter by Action, Comedy, Drama, Horror, Romance, Adventure, Kids
- **Search Functionality** - Find movies by title
- **Trailer Playback** - Watch trailers directly in the app

### 💾 Personal Collection
- **Favorites System** - Save movies to your personal collection
- **User Authentication** - Secure login with Supabase Auth
- **Cloud Sync** - Your favorites saved to Supabase database
- **Favorites Modal** - Quick access to your saved movies

### 🎨 Cyberpunk Design
- **Dark Theme** - Eye-friendly dark interface
- **Smooth Animations** - Framer Motion powered transitions
- **Responsive Layout** - Works on all screen sizes
- **Modern UI** - Clean, futuristic design aesthetic

### 📱 User Experience
- **Hero Section** - Featured movie showcase
- **Movie Cards** - Beautiful card design with backdrop images
- **Platform Indicators** - See where movies are available (Netflix, Prime, etc.)
- **Loading States** - Smooth loading animations

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **TMDB API Key** - Get one at [TMDB](https://www.themoviedb.org/settings/api)
- **Supabase Account** - For authentication and favorites storage

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/MovieBase.git
   cd MovieBase
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # TMDB API
   VITE_TMDB_API_KEY=your_tmdb_api_key
   
   # Supabase
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   
   Run the SQL script in `supabase-setup.sql` to create the favorites table:
   ```sql
   -- Create favorites table
   CREATE TABLE favorites (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     movie_id INTEGER NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Enable RLS
   ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
   
   -- RLS Policies
   CREATE POLICY "Users can view own favorites"
     ON favorites FOR SELECT
     USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can insert own favorites"
     ON favorites FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   
   CREATE POLICY "Users can delete own favorites"
     ON favorites FOR DELETE
     USING (auth.uid() = user_id);
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
MovieBase/
├── components/              # React components
│   ├── FavoritesModal.tsx  # Favorites collection view
│   ├── HeroSection.tsx     # Featured movie hero
│   ├── InfiniteScrollGrid.tsx # Movie grid with infinite scroll
│   ├── LoginModal.tsx      # Authentication modal
│   ├── MovieCard.tsx       # Individual movie card
│   └── Navbar.tsx          # Navigation bar
├── hooks/                   # Custom React hooks
│   └── useFavorites.ts     # Favorites management hook
├── services/                # API services
│   ├── supabaseClient.ts   # Supabase client setup
│   └── tmdbService.ts      # TMDB API client
├── utils/                   # Utility functions
│   └── userHelpers.ts      # User authentication helpers
├── types.ts                 # TypeScript type definitions
└── App.tsx                  # Main application component
```

---

## 🛠 Tech Stack

### Frontend
- **Vite 5.0** - Build tool and dev server
- **React 18.2** - UI library
- **TypeScript 5.2** - Type safety
- **React Router DOM** - Client-side routing
- **Tailwind CSS 3.3** - Utility-first CSS
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Backend & Database
- **Supabase** - PostgreSQL database and authentication
- **TMDB API** - Movie database and metadata

### Build & Deploy
- **Vite** - Fast HMR and optimized builds
- **Vercel** - Deployment platform (configured)

---

## 📖 Usage

### Browsing Movies

1. **Scroll down** to load more movies (infinite scroll)
2. **Click genre buttons** to filter by category
3. **Use search** to find specific movies
4. **Click movie cards** to view details and trailer

### Saving Favorites

1. **Sign up/Login** using the login modal
2. **Click the heart icon** on any movie card
3. **View favorites** by clicking the favorites button in navbar
4. **Remove favorites** by clicking the heart again

### Watching Trailers

1. **Click a movie card** to open details
2. **Click the play button** to watch trailer
3. **Close modal** to return to browsing

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with HMR

# Production
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Adding New Genres

Edit `App.tsx` to add genre mappings:

```typescript
const GENRE_MAP: Record<string, number> = {
  'Action': 28,
  'Comedy': 35,
  'Your Genre': genre_id, // Add TMDB genre ID
};
```

### TMDB API Integration

The app uses TMDB API v3 for:
- Movie discovery
- Movie details
- Backdrop images
- Trailer videos
- Genre information

**Rate Limits:** TMDB API has rate limits. The app implements proper error handling.

---

## 🚢 Deployment

### Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_TMDB_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

The project includes `vercel.json` for optimal configuration.

### Environment Variables

Make sure to set all required environment variables in your deployment platform.

---

## 🎨 Design Philosophy

**Cyberpunk Aesthetic:**
- Dark backgrounds with neon accents
- High contrast for readability
- Smooth, futuristic animations
- Grid-based layouts

**User Experience:**
- Infinite scroll for seamless browsing
- Quick access to favorites
- Minimal clicks to watch trailers
- Responsive on all devices

---

## 📝 License

This project is private and proprietary.

---

## 👤 Author

**Can Kilic**

- Portfolio: [cankilic.com](https://cankilic.com)
- GitHub: [@yourusername](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- Movie data powered by [TMDB](https://www.themoviedb.org)
- Database and auth by [Supabase](https://supabase.com)
- Built with [Vite](https://vitejs.dev)
- Animations by [Framer Motion](https://www.framer.com/motion/)

---

## 🎬 Future Enhancements

- [ ] TV Shows support
- [ ] Watchlist functionality
- [ ] Ratings and reviews
- [ ] Social features (share, recommend)
- [ ] Advanced filtering (year, rating, etc.)
- [ ] Movie recommendations based on favorites
- [ ] Export favorites list
