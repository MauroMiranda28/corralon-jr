export const toARS = (n) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
export const ORDER_STATUSES = ["pendiente", "en preparación", "listo", "entregado"];
export const LS_KEYS = {
  products: "jr_products",
  orders: "jr_orders",
  users: "jr_users",
  session: "jr_session",
  notifications: "jr_notifications", // por usuarioId
};