import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom'; // Importar hook de navegación
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
  // --- Estados ---
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]); // Lista completa de perfiles de usuario
  const [session, setSession] = useState(null); // Sesión de Supabase Auth
  const [currentUser, setCurrentUser] = useState(null); // Perfil del usuario logueado (incluirá apellido/teléfono)
  const [loadingSession, setLoadingSession] = useState(true); // Estado de carga inicial
  const [notifications, setNotifications] = useState([]); // Notificaciones en memoria
  const [cartOpen, setCartOpen] = useState(false); // Estado del drawer del carrito
  const [notificationsOpen, setNotificationsOpen] = useState(false); // Estado del drawer de notificaciones
  const [tab, setTab] = useState("catalogo"); // Pestaña activa
  const [cart, setCart] = useState([]); // Contenido del carrito
  const [q, setQ] = useState(""); // Query de búsqueda en catálogo
  const [fCategory, setFCategory] = useState("todos"); // Filtro de categoría
  const [fBrand, setFBrand] = useState("todas"); // Filtro de marca

  // --- Memos (Valores calculados) ---
  // Determina si el usuario actual puede ver el stock exacto
  const canSeeStock = !!currentUser && currentUser.role !== "cliente";
  // Calcula la cantidad total de items en el carrito
  const cartCount = useMemo(() => cart.reduce((a, b) => a + b.qty, 0), [cart]);
  // Calcula el costo total del carrito
  const cartTotal = useMemo(() => cart.reduce((sum, it) => sum + (products.find(p => p.id === it.productId)?.price || 0) * it.qty, 0), [cart, products]);
  // Genera la lista de categorías únicas para el filtro
  const categories = useMemo(() => ["todos", ...Array.from(new Set(products.map(p => p.category)))], [products]);
  // Genera la lista de marcas únicas para el filtro
  const brands = useMemo(() => ["todas", ...Array.from(new Set(products.map(p => p.brand)))], [products]);
  // Filtra los productos según la búsqueda y filtros activos
  const filteredProducts = useMemo(() => products.filter(p => (q ? (p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase())) : true) && (fCategory === "todos" ? true : p.category === fCategory) && (fBrand === "todas" ? true : p.brand === fBrand)), [products, q, fCategory, fBrand]);

  // Hook de navegación para react-router-dom
  const navigate = useNavigate();

  // --- Effects ---
  // Carga inicial de productos, pedidos y usuarios
  useEffect(() => {
    (async () => {
      try {
        const [p, o, u] = await Promise.all([ProductsSB.all(), OrdersSB.all(), UsersSB.all()]);
        setProducts(p); setOrders(o); setUsers(u);
      } catch (err) { console.error("Error cargando datos:", err); alert("No pude cargar datos."); }
    })();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar

  // Gestión de la Sesión de Autenticación
  useEffect(() => {
    setLoadingSession(true);
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession); setLoadingSession(false); console.log("Initial session processed");
    });
    // Escucha cambios en el estado de autenticación (login, logout, recuperación, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth Event:", event, currentSession);
      // Si el evento es recuperación de contraseña y hay sesión, navega a la página de actualización
      if (event === 'PASSWORD_RECOVERY' && currentSession) {
        console.log("Password recovery event detected, navigating to /update-password");
        navigate('/update-password');
      } else {
        // Para cualquier otro evento, actualiza el estado de la sesión
        setSession(currentSession);
      }
    });
    // Limpia la suscripción al desmontar el componente
    return () => subscription.unsubscribe();
  }, [navigate]); // Depende de 'navigate' para poder usarlo dentro

  // Buscar y establecer el perfil completo del usuario actual cuando cambia la sesión o la lista de usuarios
  useEffect(() => {
    if (session?.user && users.length > 0) {
      // Busca el perfil en la lista cargada
      const profileFromDb = users.find((u) => u.id === session.user.id);
      if (profileFromDb) {
         // Construye el objeto currentUser con los datos disponibles
         // Asume que usersApi.all() ahora devuelve { id, name, role, apellido, telefono }
         // Si no los devuelve, apellido y telefono serían undefined aquí.
         setCurrentUser({
            id: profileFromDb.id,
            name: profileFromDb.name,     // Columna 'nombre'
            apellido: profileFromDb.apellido, // Columna 'apellido' (añadida)
            telefono: profileFromDb.telefono, // Columna 'telefono' (añadida)
            role: profileFromDb.role       // Columna 'rol'
         });
         console.log("Current user profile set:", profileFromDb);
      } else {
         setCurrentUser(null); // Perfil no encontrado en la lista
         console.warn("User profile not found in loaded users list for ID:", session.user.id);
      }
    } else if (!session) {
      setCurrentUser(null); // No hay sesión, no hay usuario
      console.log("No session, currentUser set to null");
    }
  }, [session, users]); // Se re-ejecuta si 'session' o 'users' cambian

  // --- Helpers Carrito ---
  function addToCart(productId) {
    const p = products.find((p) => p.id === productId); if (!p) return;
    const item = cart.find((it) => it.productId === productId);
    if (item) {
      if (item.qty + 1 > p.stock) return alert("Stock insuficiente");
      setCart(cart.map((it) => (it.productId === productId ? { ...it, qty: it.qty + 1 } : it)));
    } else { if (p.stock < 1) return alert("Sin stock"); setCart([...cart, { productId, qty: 1 }]); }
  }
  function changeQty(productId, delta) {
    setCart((prev) => prev.flatMap((it) => {
        if (it.productId !== productId) return [it];
        const newQty = it.qty + delta; if (newQty <= 0) return [];
        const p = products.find((p) => p.id === productId);
        if (p && newQty > p.stock) { alert("Stock insuficiente"); return [it]; }
        return [{ ...it, qty: newQty }];
      })
    );
  }
  function removeFromCart(productId) { setCart(cart.filter((it) => it.productId !== productId)); }

  // --- Funciones Pedido ---
  async function confirmOrder() {
    if (!currentUser || currentUser.role !== "cliente") return alert("Ingresá como Cliente");
    if (!cart.length) return alert("Carrito vacío");
    for (const it of cart) { const p = products.find(p => p.id === it.productId); if (!p || p.stock < it.qty) return alert(`Stock insuficiente para ${p?.name || it.productId}`); }
    try {
      const orderUi = { id: uid("ord"), clientId: currentUser.id, delivery: "retiro", payment: "transferencia", address: "", items: cart.map(it => ({ id: uid("itm"), productId: it.productId, qty: it.qty, price: products.find(p => p.id === it.productId)?.price || 0 })) };
      await OrdersSB.create(orderUi); const [p, o] = await Promise.all([ProductsSB.all(), OrdersSB.all()]);
      setProducts(p); setOrders(o); setCart([]); setCartOpen(false); alert("Pedido creado");
    } catch (e) { console.error("Error creando pedido:", e); alert("Error creando pedido: " + e.message); }
  }
  async function setOrderStatus(oid, newStatus) {
    console.log(`[App.jsx] Requesting status change for ${oid} to ${newStatus}`);
    try {
      const minimalUpdateResult = await OrdersSB.setStatus(oid, newStatus);
      console.log(`[App.jsx] API call for ${oid} successful.`);
      if (newStatus === 'entregado') {
        const { error: confirmError } = await supabase.from('orders').update({ delivery_confirmed_at: new Date().toISOString() }).eq('id', oid);
        if (confirmError) console.warn(`[App.jsx] Could not update delivery_confirmed_at for ${oid}:`, confirmError);
      }
      setOrders((prevOrders) => {
        const orderIndex = prevOrders.findIndex(o => o.id === oid); if (orderIndex < 0) return prevOrders;
        const newOrders = [...prevOrders]; const existingOrder = newOrders[orderIndex];
        newOrders[orderIndex] = { ...existingOrder, ...minimalUpdateResult, status: newStatus, delivery_confirmed_at: newStatus === 'entregado' ? new Date().toISOString() : existingOrder.delivery_confirmed_at };
        console.log(`[App.jsx] Local state updated for ${oid} to ${minimalUpdateResult.status}`); return newOrders;
      });
      setNotifications((prev) => [{ id: uid("ntf"), text: `Tu pedido ${oid.slice(-6)} ahora está "${newStatus}".`, ts: Date.now(), read: false }, ...prev].slice(0, 50));
    } catch (e) { console.error(`[App.jsx] Error updating status for ${oid}:`, e); alert("No pude actualizar el estado."); }
  }
  function ordersForUser() { if (!currentUser) return []; if (currentUser.role === "cliente") return orders.filter(o => o.clientId === currentUser.id); return orders; }

  // --- Exportar CSV ---
  function handleExportCSV() {
    const headers = ["id", "cliente", "estado", "fecha", "total"];
    const rows = orders.map(o => [ o.id, users.find(u => u.id === o.clientId)?.name || o.clientId, o.status, new Date(o.createdAt).toLocaleString(), o.total ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "pedidos.csv"; a.click(); URL.revokeObjectURL(url);
  }

  // --- Reportes ---
  const ventasPorProducto = useMemo(() => {
    const entregados = orders.filter(o => o.status === "entregado"); const acc = new Map();
    for (const o of entregados) { for (const it of o.items) { const p = products.find(x => x.id === it.productId); const productName = p ? p.name : `ID: ${it.productId}`; const prevTotal = acc.get(productName) || 0; acc.set(productName, prevTotal + it.qty * it.price); } }
    return Array.from(acc.entries()).map(([name, total]) => ({ name, total }));
   }, [orders, products]);

  // --- FUNCIONES AUTH ---
  async function handleLogin(email, password) {
    try { setLoadingSession(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; }
    catch (error) { console.error("Error login:", error.message); alert("Error: " + error.message); }
    finally { setLoadingSession(false); }
  }
  async function handleLogout() {
    try { setLoadingSession(true); const { error } = await supabase.auth.signOut(); if (error) throw error; setCart([]); }
    catch (error) { console.error("Error logout:", error.message); alert("Error: " + error.message); }
    finally { setLoadingSession(false); }
  }
  async function handleSignUp(email, password, nombre, apellido, telefono) { // Recibe nuevos args
    try {
      setLoadingSession(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nombre,   // Mapea a 'nombre' en el trigger
            last_name: apellido, // Mapea a 'apellido' en el trigger
            phone: telefono      // Mapea a 'telefono' en el trigger
          }
        }
      });
      if (error) throw error;
      alert(`¡Registro exitoso! Revisa tu correo (${email}) para confirmar tu cuenta.`);
      // Refrescar lista de usuarios después de un delay
      setTimeout(async () => {
         console.log("Refreshing users list after signup...");
         const updatedUsers = await UsersSB.all();
         setUsers(updatedUsers);
      }, 1500); // 1.5 segundos
    } catch (error) {
      console.error("Error al registrar:", error.message);
      alert("Error al registrar: " + error.message);
    } finally {
      setLoadingSession(false);
    }
  }
  async function handlePasswordResetRequest(email) {
    try {
      setLoadingSession(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/update-password` });
      if (error) throw error; alert(`Si ${email} está registrado, recibirás un correo.`);
    } catch (error) { console.error("Error reset request:", error.message); alert(`Error. Intenta de nuevo.`); }
    finally { setLoadingSession(false); }
  }
  // --- FIN FUNCIONES AUTH ---

  // Notificaciones
  function openNotifications() { setNotificationsOpen(true); setNotifications((prev) => prev.map(n => ({ ...n, read: true }))); }

  // --- RENDERIZADO ---
  if (loadingSession) { return <div className="grid h-screen place-content-center bg-neutral-50"><h1 className="text-lg font-semibold">Cargando...</h1></div>; }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      <Header
        currentUser={currentUser} users={users}
        onLogin={handleLogin} onLogout={handleLogout} onSignUp={handleSignUp}
        onPasswordResetRequest={handlePasswordResetRequest}
        cartCount={cartCount} onOpenCart={() => setCartOpen(true)} onOpenNotifications={openNotifications}
      />
      <main className="mx-auto max-w-7xl px-4 pb-24">
        <TopTabs tab={tab} setTab={setTab} currentUser={currentUser} />
        {tab === "catalogo" && <Catalog products={filteredProducts} allProducts={products} q={q} setQ={setQ} fCategory={fCategory} setFCategory={setFCategory} fBrand={fBrand} setFBrand={setFBrand} categories={categories} brands={brands} addToCart={addToCart} canSeeStock={canSeeStock} />}
        {tab === "pedidos" && <OrdersView orders={ordersForUser()} users={users} products={products} currentUser={currentUser} onStatusChange={setOrderStatus} onExportCSV={handleExportCSV} />}
        {tab === "panel" && (currentUser?.role === "vendedor" || currentUser?.role === "admin") && <Panel products={products} setProducts={setProducts} orders={orders} setOrderStatus={setOrderStatus} users={users} />}
        {tab === "reportes" && currentUser?.role === "admin" && <Reports ventasPorProducto={ventasPorProducto} />}
      </main>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} products={products} changeQty={changeQty} removeFromCart={removeFromCart} total={cartTotal} onConfirm={confirmOrder} canSeeStock={canSeeStock} />
      <NotificationsDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} items={notifications} />
    </div>
  );
}