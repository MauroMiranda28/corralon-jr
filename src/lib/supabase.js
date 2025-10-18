import { createClient } from "@supabase/supabase-js";

// Flag para activar/desactivar Supabase desde .env.local
export const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === "true";

export const supabase = USE_SUPABASE
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  : null;
