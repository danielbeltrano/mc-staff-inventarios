import { createClient } from "@supabase/supabase-js";

// Asegúrate de tener tu archivo .env configurado correctamente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_INVENTARIO;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY_INVENTARIO;

// Verificación opcional
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: Falta configurar VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
