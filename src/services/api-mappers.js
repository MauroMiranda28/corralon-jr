// Products
export const fromDBProduct = (p) => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  category: p.category,
  price: p.price,
  stock: p.stock,
  img: p.img || ""
});
export const toDBProduct = (p) => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  category: p.category,
  price: p.price,
  stock: p.stock,
  img: p.img || null
});

// Orders -> UI shape que usa tu App
export const fromDBOrder = (o) => ({
  id: o.id,
  clientId: o.user_id,                                    // snake → camel
  status: o.status,
  delivery: o.delivery || null,
  payment:  o.payment  || null,
  address:  o.address  || null,
  total: o.total,
  createdAt: o.created_at ? new Date(o.created_at).getTime() : Date.now(),
  items: (o.order_items || o.items || []).map(it => ({
    id: it.id,
    productId: it.product_id,
    qty: it.cantidad,                                     // normalizamos a qty
    price: it.precio                                      // normalizamos a price
  }))
});
