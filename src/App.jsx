import React, { useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import Catalog from "./components/Catalog.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import OrdersView from "./components/OrdersView.jsx";
import Panel from "./components/Panel.jsx";
import Reports from "./components/Reports.jsx";
import TopTabs from "./components/TopTabs.jsx";
import NotificationsDrawer from "./components/NotificationsDrawer.jsx";

import { productsApi as ProductsSB } from "./services/products.supabase.js";
import { ordersApi   as OrdersSB   } from "./services/orders.supabase.js";
import { toARS, uid } from "./utils/utils.js";

export default function App() {
  // Estado global (todo viene de la BD)
  const [products, setProducts] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [users, setUsers]       = useState([]);
  const [session, setSession]   = useState({ userId: null }); // sesión en memoria

  // Notificaciones en memoria (ya no persisten en LS)
  const [notifications, setNotifications] = useState([]);

  const currentUser = useMemo(() => users.find((u) => u.id === session?.userId) || null, [users, session]);
  const canSeeStock = !!currentUser && currentUser.role !== "cliente";

  // UI
  const [cartOpen, setCartOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [tab, setTab] = useState("catalogo");

  // Carrito (en memoria)
  const [cart, setCart] = useState([]); // [{productId, qty}]
  const cartCount = useMemo(() => cart.reduce((a, b) => a + b.qty, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((sum, it) => sum + (products.find(p => p.id === it.productId)?.price || 0) * it.qty, 0),
    [cart, products]
  );

  // Filtros catálogo
  const [q, setQ] = useState("");
  const [fCategory, setFCategory] = useState("todos");
  const [fBrand, setFBrand] = useState("todas");

  const categories = useMemo(() => ["todos", ...Array.from(new Set(products.map(p => p.category)))], [products]);
  const brands = useMemo(() => ["todas", ...Array.from(new Set(products.map(p => p.brand)))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const okQ = q ? (p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase())) : true;
      const okC = fCategory === "todos" ? true : p.category === fCategory;
      const okB = fBrand === "todas" ? true : p.brand === fBrand;
      return okQ && okC && okB;
    });
  }, [products, q, fCategory, fBrand]);

  // --- Carga inicial: productos, pedidos, usuarios (desde BD) ---
  useEffect(() => {
    (async () => {
      try {
        const [p, o] = await Promise.all([ProductsSB.all(), OrdersSB.all()]);
        setProducts(p);
        setOrders(o);
      } catch (err) {
        console.error("Error cargando productos/pedidos:", err);
        alert("No pude cargar datos de la base.");
      }
    })();
  }, []);

  // Cargar usuarios (para el modal simple de login) — desde tabla `users`
  useEffect(() => {
    (async () => {
      try {
        const mod = await import("./services/users.supabase.js");      // carga perezosa
        const list = await mod.usersApi.all();
        setUsers(list);
        // si querés autologin del primero:
        if (!session.userId && list[0]) setSession({ userId: list[0].id });
      } catch (e) {
        console.error("Error cargando usuarios:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helpers carrito
  function addToCart(productId) {
    const p = products.find(p => p.id === productId);
    if (!p) return;
    const item = cart.find(it => it.productId === productId);
    if (item) {
      if (item.qty + 1 > p.stock) return alert("Stock insuficiente");
      setCart(cart.map(it => it.productId === productId ? { ...it, qty: it.qty + 1 } : it));
    } else {
      if (p.stock < 1) return alert("Sin stock");
      setCart([...cart, { productId, qty: 1 }]);
    }
  }
  function changeQty(productId, delta) {
    setCart((prev) => prev.flatMap((it) => {
      if (it.productId !== productId) return [it];
      const newQty = it.qty + delta;
      if (newQty <= 0) return [];
      const p = products.find(p => p.id === productId);
      if (p && newQty > p.stock) { alert("Stock insuficiente"); return [it]; }
      return [{ ...it, qty: newQty }];
    }));
  }
  function removeFromCart(productId) { setCart(cart.filter(it => it.productId !== productId)); }

  // Crear pedido (BD)
  async function confirmOrder() {
    if (!currentUser || currentUser.role !== "cliente") return alert("Ingresá como Cliente para confirmar");
    if (!cart.length) return alert("Tu carrito está vacío");

    // Validación rápida UI
    for (const it of cart) {
      const p = products.find(p => p.id === it.productId);
      if (!p || p.stock < it.qty) return alert(`Sin stock suficiente para ${p?.name || it.productId}`);
    }

    try {
      const orderUi = {
        id: uid("ord"),
        clientId: currentUser.id,
        delivery: "retiro",
        payment: "transferencia",
        address: "",
        items: cart.map(it => ({
          id: uid("itm"),
          productId: it.productId,
          qty: it.qty,
          price: products.find(p => p.id === it.productId)?.price || 0
        }))
      };
      await OrdersSB.create(orderUi);                       // RPC transaccional
      const [p, o] = await Promise.all([ProductsSB.all(), OrdersSB.all()]);
      setProducts(p);
      setOrders(o);
      setCart([]);
      setCartOpen(false);
      alert("Pedido creado. Estado: Pendiente");
    } catch (e) {
      console.error(e);
      alert("Error creando el pedido en la base");
    }
  }

  // Cambiar estado (BD) + notificación en memoria
  async function setOrderStatus(oid, newStatus) {
    try {
      const updated = await OrdersSB.setStatus(oid, newStatus);
      setOrders(prev => {
        const i = prev.findIndex(o => o.id === oid);
        if (i < 0) return prev;
        const cp = [...prev]; cp[i] = updated; return cp;
      });

      // Notificación (en memoria)
      setNotifications((prev) => {
        const text = `Tu pedido ${oid.slice(-6)} ahora está "${newStatus}".`;
        return [{ id: uid("ntf"), text, ts: Date.now(), read: false }, ...prev].slice(0, 50);
      });
    } catch (e) {
      console.error(e);
      alert("No pude actualizar el estado en la base");
    }
  }

  function ordersForUser() {
    if (!currentUser) return [];
    if (currentUser.role === "cliente") return orders.filter(o => o.clientId === currentUser.id);
    return orders;
  }

  // Reportes: ventas por producto (solo entregados)
  const ventasPorProducto = useMemo(() => {
    const entregados = orders.filter(o => o.status === "entregado");
    const acc = new Map();
    for (const o of entregados) {
      for (const it of o.items) {
        const p = products.find(x => x.id === it.productId);
        const k = p ? p.name : it.productId;
        const prev = acc.get(k) || 0;
        acc.set(k, prev + it.qty * it.price);
      }
    }
    return Array.from(acc.entries()).map(([name, total]) => ({ name, total }));
  }, [orders, products]);

  // Reset: solo re-fetch desde BD (sin LS)
  async function resetFromDB() {
    try {
      const [p, o] = await Promise.all([ProductsSB.all(), OrdersSB.all()]);
      setProducts(p);
      setOrders(o);
      setCart([]);
      setNotifications([]);
      alert("Datos recargados desde la base.");
    } catch (e) {
      console.error(e);
      alert("No pude recargar desde la base.");
    }
  }

  function loginAs(userId) { setSession({ userId }); setNotificationsOpen(false); }
  function logout() { setSession({ userId: null }); setCart([]); }

  // Abrir notificaciones marca como leídas (en memoria)
  function openNotifications() {
    setNotificationsOpen(true);
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      <Header
        currentUser={currentUser}
        users={users}
        onLogin={(id)=>loginAs(id)}
        onLogout={logout}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        onOpenNotifications={openNotifications}
        onResetDemo={resetFromDB}
      />

      <main className="mx-auto max-w-7xl px-4 pb-24">
        <TopTabs tab={tab} setTab={setTab} currentUser={currentUser} />

        {tab === "catalogo" && (
          <Catalog
            products={filteredProducts}
            allProducts={products}
            q={q} setQ={setQ}
            fCategory={fCategory} setFCategory={setFCategory}
            fBrand={fBrand} setFBrand={setFBrand}
            categories={categories} brands={brands}
            addToCart={addToCart}
            canSeeStock={canSeeStock}
          />
        )}

        {tab === "pedidos" && (
          <OrdersView
            orders={ordersForUser()}
            users={users}
            products={products}
            currentUser={currentUser}
            onStatusChange={setOrderStatus}
            onExportCSV={()=>{
              const headers = ["id","cliente","estado","fecha","total"];
              const rows = orders.map(o => [
                o.id,
                users.find(u => u.id === o.clientId)?.name || o.clientId,
                o.status,
                new Date(o.createdAt).toLocaleString(),
                o.total,
              ]);
              const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "pedidos.csv"; a.click();
              URL.revokeObjectURL(url);
            }}
          />
        )}

        {tab === "panel" && (currentUser?.role === "vendedor" || currentUser?.role === "admin") && (
          <Panel
            products={products}
            setProducts={setProducts}
            orders={orders}
            setOrderStatus={setOrderStatus}
            users={users}
          />
        )}

        {tab === "reportes" && (currentUser?.role !== "cliente") && (
          <Reports ventasPorProducto={ventasPorProducto} />
        )}
      </main>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        products={products}
        changeQty={changeQty}
        removeFromCart={removeFromCart}
        total={cartTotal}
        onConfirm={confirmOrder}
        canSeeStock={canSeeStock}
      />

      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        items={notifications}
      />
    </div>
  );
}
