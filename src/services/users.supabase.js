// src/services/users.supabase.js
import { supabase } from "../lib/supabase.js";

export const usersApi = {
  async all() {
    // --- MODIFICACIÓN: Seleccionar todos los campos ('*') ---
    const { data, error } = await supabase
      .from("users")
      .select("*") // Trae id, nombre, rol, apellido, telefono Y los campos de dirección
      .order("nombre", { ascending: true });
    // --- FIN MODIFICACIÓN ---

    if (error) {
        console.error("Error fetching users:", error);
        throw error;
    }

    // El mapeo ahora debería funcionar porque 'data' contiene todos los campos
    // Asegúrate que los nombres de propiedad coincidan con las columnas de tu tabla
    return data.map(u => ({
         id: u.id,
         name: u.nombre, // Columna 'nombre'
         apellido: u.apellido, // Columna 'apellido'
         telefono: u.telefono,   // Columna 'telefono'
         role: u.rol, // Columna 'rol'
         // Campos de dirección
         direccion_ciudad: u.direccion_ciudad,
         direccion_calle: u.direccion_calle,
         direccion_numero: u.direccion_numero,
         direccion_referencia: u.direccion_referencia,
         email: u.email // <-- Necesitamos añadir esto si tu tabla 'users' lo tiene
       }));
  },

  // --- NUEVA FUNCIÓN ---
  async adminUpdateUserRole(userId, newRole) {
    const { data, error } = await supabase
      .from("users")
      .update({ rol: newRole })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating role for user ${userId}:`, error);
      throw error;
    }
    return data;
  }
  // --- FIN NUEVA FUNCIÓN ---
};