// supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL; // Get this from your Supabase dashboard
const supabaseAnonKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY; // Get this from your Supabase dashboard


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: localStorage,
    },
  });
  
