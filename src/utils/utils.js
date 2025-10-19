// src/utils/utils.js
export const toARS = (n) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

// --- CORREGIDO: Añadir 'enviado' ---
export const ORDER_STATUSES = ["pendiente", "listo", "enviado", "entregado"];
// --- FIN CORRECCIÓN ---

export const LS_KEYS = {
  products: "jr_products",
  orders: "jr_orders",
  users: "jr_users",
  session: "jr_session",
  notifications: "jr_notifications",
};