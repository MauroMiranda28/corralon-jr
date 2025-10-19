import React, { useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import Catalog from "./components/Catalog.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import OrdersView from "./components/OrdersView.jsx";
import Panel from "./components/Panel.jsx";
import Reports from "./components/Reports.jsx";
import TopTabs from "./components/TopTabs.jsx";
import NotificationsDrawer from "./components/NotificationsDrawer.jsx";

// --- Imports de Supabase ---
import { productsApi as ProductsSB } from "./services/products.supabase.js";
import { ordersApi as OrdersSB } from "./services/orders.supabase.js";
import { usersApi as UsersSB } from "./services/users.supabase.js";
import { supabase } from "./lib/supabase.js";

import { toARS, uid } from "./utils/utils.js";

export default function App() {
  // Estado global (datos de la BD)
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  // --- Estado de Sesión ---
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [notifications, setNotifications] = useState([]);

  const canSeeStock = !!currentUser && currentUser.role !== "cliente";

  // UI
  const [cartOpen, setCartOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [tab, setTab] = useState("catalogo");

  // Carrito (en memoria)
  const [cart, setCart] = useState([]); // [{productId, qty}]
  const cartCount = useMemo(() => cart.reduce((a, b) => a + b.qty, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((sum, it) => sum + (products.find((p) => p.id === it.productId)?.price || 0) * it.qty, 0),
    [cart, products]
  );

  // Filtros catálogo
  const [q, setQ] = useState("");
  const [fCategory, setFCategory] = useState("todos");
  const [fBrand, setFBrand] = useState("todas");

  const categories = useMemo(() => ["todos", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const brands = useMemo(() => ["todas", ...Array.from(new Set(products.map((p) => p.brand)))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const okQ = q ? p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase()) : true;
      const okC = fCategory === "todos" ? true : p.category === fCategory;
      const okB = fBrand === "todas" ? true : p.brand === fBrand;
      return okQ && okC && okB;
    });
  }, [products, q, fCategory, fBrand]);

  // --- Carga inicial de datos ---
  useEffect(() => {
    (async () => {
      try {
        const [p, o, u] = await Promise.all([
          ProductsSB.all(),
          OrdersSB.all(), // Esta llamada SÍ trae los items
          UsersSB.all()
        ]);
        setProducts(p);
        setOrders(o);
        setUsers(u);
      } catch (err) {
        console.error("Error cargando datos:", err);
        alert("No pude cargar datos de la base.");
      }
    })();
  }, []);

  // --- GESTIÓN DE SESIÓN ---
  useEffect(() => {
    setLoadingSession(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); });
    return () => subscription.unsubscribe();
  }, []);

  // --- BUSCAR EL PERFIL ---
  useEffect(() => {
    if (session?.user && users.length > 0) {
      const profile = users.find((u) => u.id === session.user.id);
      setCurrentUser(profile || null);
    } else if (!session) {
      setCurrentUser(null);
    }
  }, [session, users]);


  // --- Helpers Carrito ---
  function addToCart(productId) {
    const p = products.find((p) => p.id === productId);
    if (!p) return;
    const item = cart.find((it) => it.productId === productId);
    if (item) {
      if (item.qty + 1 > p.stock) return alert("Stock insuficiente");
      setCart(cart.map((it) => (it.productId === productId ? { ...it, qty: it.qty + 1 } : it)));
    } else {
      if (p.stock < 1) return alert("Sin stock");
      setCart([...cart, { productId, qty: 1 }]);
    }
  }
  function changeQty(productId, delta) {
    setCart((prev) =>
      prev.flatMap((it) => {
        if (it.productId !== productId) return [it];
        const newQty = it.qty + delta;
        if (newQty <= 0) return []; // Elimina el item si la cantidad es 0 o menos
        const p = products.find((p) => p.id === productId);
        if (p && newQty > p.stock) {
          alert("Stock insuficiente");
          return [it]; // Devuelve el item sin cambios si no hay stock
        }
        return [{ ...it, qty: newQty }]; // Devuelve el item con la nueva cantidad
      })
    );
  }
  function removeFromCart(productId) {
    setCart(cart.filter((it) => it.productId !== productId));
  }
  // --- Fin Helpers Carrito ---

  // Crear pedido (BD)
  async function confirmOrder() {
    if (!currentUser || currentUser.role !== "cliente") return alert("Ingresá como Cliente para confirmar");
    if (!cart.length) return alert("Tu carrito está vacío");

    for (const it of cart) {
      const p = products.find((p) => p.id === it.productId);
      if (!p || p.stock < it.qty) return alert(`Sin stock suficiente para ${p?.name || it.productId}`);
    }

    try {
      const orderUi = {
        id: uid("ord"),
        clientId: currentUser.id,
        delivery: "retiro", // TODO: Permitir elegir
        payment: "transferencia", // TODO: Integrar MercadoPago
        address: "", // TODO: Pedir si es envío
        items: cart.map((it) => ({
          id: uid("itm"),
          productId: it.productId,
          qty: it.qty,
          price: products.find((p) => p.id === it.productId)?.price || 0,
        })),
      };
      await OrdersSB.create(orderUi);
      const [p, o] = await Promise.all([ProductsSB.all(), OrdersSB.all()]);
      setProducts(p);
      setOrders(o);
      setCart([]);
      setCartOpen(false);
      alert("Pedido creado. Estado: Pendiente");
    } catch (e) {
      console.error(e);
      alert("Error creando el pedido en la base: " + e.message);
    }
  }

  // Cambiar estado (BD) + notificación en memoria
  async function setOrderStatus(oid, newStatus) {
    console.log(`[App.jsx] Requesting status change for ${oid} to ${newStatus}`);
    try {
      // 1. Llama a la API (devuelve solo { id, status } si tiene éxito)
      const minimalUpdateResult = await OrdersSB.setStatus(oid, newStatus);

      console.log(`[App.jsx] API call for ${oid} seems successful.`);

      // 2. (Opcional) Actualiza 'delivery_confirmed_at'
      if (newStatus === 'entregado') {
        const { error: confirmError } = await supabase
          .from('orders')
          .update({ delivery_confirmed_at: new Date().toISOString() })
          .eq('id', oid);
        if (confirmError) console.warn(`[App.jsx] Could not update delivery_confirmed_at for ${oid}:`, confirmError);
      }

      // 3. Actualiza estado local PRESERVANDO items
      setOrders((prevOrders) => {
        const orderIndex = prevOrders.findIndex((o) => o.id === oid);
        if (orderIndex < 0) return prevOrders;

        const newOrders = [...prevOrders];
        const existingOrder = newOrders[orderIndex];

        newOrders[orderIndex] = {
          ...existingOrder,
          // Solo actualizamos el estado recibido de la API simplificada
          status: minimalUpdateResult.status,
          delivery_confirmed_at: newStatus === 'entregado' ? new Date().toISOString() : existingOrder.delivery_confirmed_at,
        };
        console.log(`[App.jsx] Local state updated for ${oid} to ${minimalUpdateResult.status}`);
        return newOrders;
      });

      // 4. Notificación
      setNotifications((prev) => {
        const text = `Tu pedido ${oid.slice(-6)} ahora está "${newStatus}".`;
        return [{ id: uid("ntf"), text, ts: Date.now(), read: false }, ...prev].slice(0, 50);
      });

    } catch (e) {
      console.error(`[App.jsx] Error caught updating status for order ${oid}:`, e); // Línea ~212
      alert("No pude actualizar el estado en la base");
    }
  }

  // Devuelve pedidos según rol
  function ordersForUser() {
    if (!currentUser) return [];
    if (currentUser.role === "cliente") return orders.filter((o) => o.clientId === currentUser.id);
    return orders;
   }

  // Función para exportar CSV
  function handleExportCSV() {
    const headers = ["id", "cliente", "estado", "fecha", "total"];
    const rows = orders.map((o) => [
      o.id,
      users.find((u) => u.id === o.clientId)?.name || o.clientId,
      o.status,
      new Date(o.createdAt).toLocaleString(),
      o.total,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pedidos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Reportes: Calcula ventas por producto
  const ventasPorProducto = useMemo(() => {
    const entregados = orders.filter((o) => o.status === "entregado");
    const acc = new Map();
    for (const o of entregados) {
      for (const it of o.items) {
        const p = products.find((x) => x.id === it.productId);
        const productName = p ? p.name : `ID: ${it.productId}`;
        const prevTotal = acc.get(productName) || 0;
        acc.set(productName, prevTotal + it.qty * it.price);
      }
    }
    return Array.from(acc.entries()).map(([name, total]) => ({ name, total }));
   }, [orders, products]);


  // --- FUNCIONES AUTH ---
  async function handleLogin(email, password) {
    try {
      setLoadingSession(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error("Error al iniciar sesión:", error.message);
      alert("Error: " + error.message);
    } finally {
      setLoadingSession(false);
    }
  }

  async function handleLogout() {
    try {
      setLoadingSession(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCart([]);
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message);
      alert("Error: " + error.message);
    } finally {
      setLoadingSession(false);
    }
  }

  async function handleSignUp(email, password, nombre) {
    try {
      setLoadingSession(true);
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: nombre } }
      });
      if (error) throw error;
      alert(`¡Registro exitoso! Revisa tu correo (${email}) para confirmar tu cuenta.`);
      const u = await UsersSB.all(); // Recarga usuarios
      setUsers(u);
    } catch (error) {
      console.error("Error al registrar:", error.message);
      alert("Error: " + error.message);
    } finally {
      setLoadingSession(false);
    }
  }
  // --- FIN FUNCIONES AUTH ---

  // Marca notificaciones como leídas
  function openNotifications() {
    setNotificationsOpen(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  // --- RENDERIZADO CONDICIONAL ---
  if (loadingSession) {
    return (
      <div className="grid h-screen place-content-center bg-neutral-50">
        <h1 className="text-lg font-semibold">Cargando Corralón JR...</h1>
      </div>
    );
   }

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      <Header
        currentUser={currentUser}
        users={users}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSignUp={handleSignUp}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        onOpenNotifications={openNotifications}
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
            onExportCSV={handleExportCSV}
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

        {tab === "reportes" && currentUser?.role === "admin" && (
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