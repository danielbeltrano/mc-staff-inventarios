// src/core/config/supabase/supabaseCampusStudentClient.js

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL_CAMPUS_STUDENT; // Get this from your Supabase dashboard
const supabaseAnonKey = import.meta.env
  .VITE_APP_SUPABASE_ANON_KEY_CAMPUS_STUDENT; // Get this from your Supabase dashboard

export const supabaseStudentClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  }
});

// export const supabaseStucenClientBienestar = createClient(
//   supabaseUrl,
//   supabaseAnonKey,{
//   auth: {
//     persistSession: true,
//     autoRefreshToken: true,
//     detectSessionInUrl: true,
//     storage: localStorage,
//   }
// });
