import { supabase } from "../lib/supabase.js";
import { fromDBProduct, toDBProduct } from "./api-mappers.js";

export const productsApi = {
  async all() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return data.map(fromDBProduct);
  },

  // Para cuando conectes el Panel a DB (crear/editar)
  async save(p) {
    const row = toDBProduct(p);
    // si no tenés id y los generás en el front:
    row.id = row.id || `prd_${Math.random().toString(36).slice(2, 9)}`;

    const { data, error } = await supabase
      .from("products")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();
    if (error) throw error;
    return fromDBProduct(data);
  },

  async remove(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },
};
