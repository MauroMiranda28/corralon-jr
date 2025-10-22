// src/services/api-mappers.js

// Products
export const fromDBProduct = (p) => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  category: p.category,
  price: p.price,
  stock: p.stock,
  img: p.img || "",
  descripcion: p.descripcion || "" // --- AÑADIDO ---
});

export const toDBProduct = (p) => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  category: p.category,
  price: p.price,
  stock: p.stock,
  img: p.img || null,
  descripcion: p.descripcion || null // --- AÑADIDO --- (guarda null si está vacío)
});

// Orders -> UI shape
export const fromDBOrder = (o) => ({
  id: o.id,
  clientId: o.user_id,
  status: o.status,
  delivery: o.delivery || null,
  payment:  o.payment  || null,
  address:  o.address  || null,
  total: o.total,
  createdAt: o.created_at ? new Date(o.created_at).getTime() : Date.now(),
  // Si 'items' no viene (ej: en setStatus simplificado), devuelve array vacío
  items: (o.order_items || o.items || []).map(it => ({
    id: it.id,
    productId: it.product_id,
    qty: it.cantidad,
    price: it.precio
  }))
});