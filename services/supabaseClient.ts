import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate URL format
const isValidUrl = supabaseUrl && (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://'));
const isValidKey = supabaseAnonKey && supabaseAnonKey.length > 20;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Authentication features will not work.');
} else if (!isValidUrl || !isValidKey) {
  console.error('Invalid Supabase credentials format. Please check your .env file.');
}

// Create Supabase client with proper error handling
export const supabase = supabaseUrl && supabaseAnonKey && isValidUrl && isValidKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key'); // Fallback to prevent crashes

