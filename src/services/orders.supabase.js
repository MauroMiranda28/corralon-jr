import { supabase } from "../lib/supabase.js";
import { fromDBOrder } from "./api-mappers.js";

export const ordersApi = {
  async all() {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(fromDBOrder);
  },

  async create(orderUi) {
    const payload = {
      id: orderUi.id,
      user_id: orderUi.clientId,
      delivery: orderUi.delivery || null,
      payment:  orderUi.payment  || null,
      address:  orderUi.address  || null,
      items: orderUi.items.map(it => ({
        id: it.id,
        product_id: it.productId,
        cantidad: it.qty,
        precio: it.price
      }))
    };
     const { data, error } = await supabase.rpc("create_order", { order_json: payload });
     if (error) {
         console.error("Error calling create_order RPC:", error);
         throw error;
     }
     return fromDBOrder(data);
  },

  // --- FUNCIÓN setStatus SUPER SIMPLIFICADA (PARA DEBUG) ---
  async setStatus(id, status) {
    console.log(`[orders.supabase.js] Attempting to update order ${id} to status ${status}`); // Log
    const { error } = await supabase // Quitamos 'data' porque no esperamos respuesta
      .from("orders")
      .update({ status: status })
      .eq("id", id);
      // >>> HEMOS QUITADO .select().single() COMPLETAMENTE <<<

    if (error) {
      // Este es el error que ves en la consola (orders.supabase.js:50)
      console.error(`[orders.supabase.js] Error updating order ${id} to ${status}:`, error);
      throw error; // Propaga el error para que App.jsx muestre el alert
    }

    // Si llegamos aquí, el UPDATE funcionó, pero no tenemos la data actualizada.
    // Devolvemos un objeto simple para que App.jsx sepa que funcionó.
    console.log(`[orders.supabase.js] Update for order ${id} to ${status} seems successful.`);
    return { id: id, status: status }; // Devuelve solo ID y el nuevo estado
  }
  // --- FIN FUNCIÓN setStatus SUPER SIMPLIFICADA ---
};