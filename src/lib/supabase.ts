import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from '@/types/database';

const REMEMBER_KEY = 'studio.remember';

/**
 * Routes Supabase session storage between localStorage (remember-me checked)
 * and sessionStorage (unchecked = session dies when tab closes).
 * The flag is set by the login handler before signInWithPassword.
 */
const rememberAwareStorage: SupportedStorage = {
  getItem: (key) => {
    const remember = localStorage.getItem(REMEMBER_KEY) === '1';
    return remember ? localStorage.getItem(key) : sessionStorage.getItem(key);
  },
  setItem: (key, value) => {
    const remember = localStorage.getItem(REMEMBER_KEY) === '1';
    if (remember) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export function setRememberMe(remember: boolean): void {
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
}

export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    storage: rememberAwareStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
