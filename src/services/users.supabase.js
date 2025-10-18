import { supabase } from "../lib/supabase.js";

export const usersApi = {
  async all() {
    const { data, error } = await supabase.from("users").select("*").order("nombre", { ascending: true });
    if (error) throw error;
    // Normalizamos a { id, name, role } para que tu UI no cambie
    return data.map(u => ({ id: u.id, name: u.nombre, role: u.rol }));
  }
};
