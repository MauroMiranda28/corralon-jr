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

  // orderUi esperado por la UI:
  // { id, clientId, delivery, payment, address, items:[{ id, productId, qty, price }] }
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
    if (error) throw error;
    return fromDBOrder(data);
  },

  async setStatus(id, status) {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select("*, order_items(*)")
      .single();
    if (error) throw error;
    return fromDBOrder(data);
  }
};
