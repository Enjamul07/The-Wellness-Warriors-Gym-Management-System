import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite env or admin local storage override
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('wwg_supabase_url') || '' : '';
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('wwg_supabase_key') || '' : '';

export const SUPABASE_URL = (storedUrl || envUrl).trim();
export const SUPABASE_ANON_KEY = (storedKey || envKey).trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL.startsWith('http') &&
    SUPABASE_ANON_KEY.length > 10
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export function saveCustomSupabaseConfig(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('wwg_supabase_url', url.trim());
      localStorage.setItem('wwg_supabase_key', key.trim());
    } else {
      localStorage.removeItem('wwg_supabase_url');
      localStorage.removeItem('wwg_supabase_key');
    }
  }
}
