import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
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
  const [users, setUsers] = useState([]); // Ahora contendrá la dirección
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // Ahora contendrá la dirección
  const [loadingSession, setLoadingSession] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [tab, setTab] = useState("catalogo");
  const [cart, setCart] = useState([]);
  const [q, setQ] = useState("");
  const [fCategory, setFCategory] = useState("todos");
  const [fBrand, setFBrand] = useState("todas");
  const [sortBy, setSortBy] = useState("default");
  const [shippingCostBase] = useState(500);
  const [openLogin, setOpenLogin] = useState(false);

  // --- Memos ---
  const canSeeStock = !!currentUser && currentUser.role !== "cliente";
  const cartCount = useMemo(() => cart.reduce((a, b) => a + b.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, it) => sum + (products.find(p => p.id === it.productId)?.price || 0) * it.qty, 0), [cart, products]);
  const categories = useMemo(() => ["todos", ...Array.from(new Set(products.map(p => p.category)))], [products]);
  const brands = useMemo(() => ["todas", ...Array.from(new Set(products.map(p => p.brand)))], [products]);
  const filteredProducts = useMemo(() => {
  const query = q.toLowerCase();
  let filtered = products.filter(p =>
        (p.is_active !== false) && // Solo productos activos (o donde is_active no esté definido como false)
       (query ? (
           p.name.toLowerCase().includes(query) ||
            p.brand.toLowerCase().includes(query) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(query)) // Añadir chequeo de descripción
        ) : true) &&
        (fCategory === "todos" ? true : p.category === fCategory) &&
        (fBrand === "todas" ? true : p.brand === fBrand)
    );
    const sorted = [...filtered];
    switch (sortBy) { case 'price-asc': sorted.sort((a, b) => a.price - b.price); break; case 'price-desc': sorted.sort((a, b) => b.price - a.price); break; case 'name-asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break; case 'name-desc': sorted.sort((a, b) => b.name.localeCompare(a.name)); break; default: break; }
    return sorted;
  }, [products, q, fCategory, fBrand, sortBy]);

  // Hook de navegación
  const navigate = useNavigate();

  // --- Effects ---
  // Carga inicial (ahora UsersSB.all() trae todo)
  useEffect(() => {
    (async () => {
      try {
        const [p, o, u] = await Promise.all([ProductsSB.all(), OrdersSB.all(), UsersSB.all()]);
        setProducts(p); setOrders(o); setUsers(u);
      } catch (err) { console.error("Error cargando datos:", err); alert("No pude cargar datos."); }
    })();
  }, []);
  // Gestión Sesión
  useEffect(() => {
    setLoadingSession(true); supabase.auth.getSession().then(({ data: { session: i } }) => { setSession(i); setLoadingSession(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (e, cSess) => { if (e === 'PASSWORD_RECOVERY' && cSess) { navigate('/update-password'); } else { setSession(cSess); } });
    return () => subscription.unsubscribe();
  }, [navigate]);
  // Buscar Perfil (ahora debería encontrar la dirección en 'users')
  useEffect(() => {
    if (session?.user && users.length > 0) {
      const profileFromList = users.find((u) => u.id === session.user.id);
      if (profileFromList) {
         // Asigna todos los campos que UsersSB.all() devuelve
         setCurrentUser({
            id: profileFromList.id,
            name: profileFromList.name,
            apellido: profileFromList.apellido,
            telefono: profileFromList.telefono,
            role: profileFromList.role,
            direccion_ciudad: profileFromList.direccion_ciudad,
            direccion_calle: profileFromList.direccion_calle,
            direccion_numero: profileFromList.direccion_numero,
            direccion_referencia: profileFromList.direccion_referencia,
         });
      } else { setCurrentUser(null); }
    } else if (!session) { setCurrentUser(null); }
  }, [session, users]);

  // --- Helpers Carrito ---
  function addToCart(productId) { const p = products.find(p => p.id === productId); if (!p) return; const i = cart.find(it => it.productId === productId); if (i) { if (i.qty + 1 > p.stock) return alert("Stock insuficiente"); setCart(cart.map(it => (it.productId === productId ? { ...it, qty: it.qty + 1 } : it))); } else { if (p.stock < 1) return alert("Sin stock"); setCart([...cart, { productId, qty: 1 }]); } }
  function changeQty(productId, delta) { setCart(prev => prev.flatMap(it => { if (it.productId !== productId) return [it]; const nQ = it.qty + delta; if (nQ <= 0) return []; const p = products.find(p => p.id === productId); if (p && nQ > p.stock) { alert("Stock insuficiente"); return [it]; } return [{ ...it, qty: nQ }]; })); }
  function removeFromCart(productId) { setCart(cart.filter(it => it.productId !== productId)); }

  // --- Funciones Pedido ---
  // --- MODIFICADO: confirmOrder recibe datos de entrega ---
  async function confirmOrder(deliveryDetails) {
    // deliveryDetails = { method: 'retiro' | 'domicilio', address: { ciudad, calle, numero, referencia, recibeNombre, recibeApellido, recibeDni }, saveAddress: boolean }
    if (!currentUser || currentUser.role !== "cliente") {
        setCartOpen(false)
        setTimeout(() => setOpenLogin(true), 100); // Abre el modal de login
        return; // Detiene la ejecución
    }
    if (!cart.length) return alert("Carrito vacío");

    // Validar campos obligatorios de dirección si es envío a domicilio
    if (deliveryDetails.method === 'domicilio' && (
        !deliveryDetails.address?.ciudad?.trim() ||
        !deliveryDetails.address?.calle?.trim() ||
        !deliveryDetails.address?.numero?.trim() ||
        !deliveryDetails.address?.recibeNombre?.trim() ||
        !deliveryDetails.address?.recibeApellido?.trim() ||
        !deliveryDetails.address?.recibeDni?.trim()
        )) {
        // Devuelve el error para que CartDrawer lo muestre
        throw new Error("Completa todos los campos obligatorios (*) de la dirección y quién recibe.");
    }

    // (Validación de stock - sin cambios)
    for (const it of cart) { const p = products.find(p => p.id === it.productId); if (!p || p.stock < it.qty) throw new Error(`Stock insuficiente: ${p?.name || it.productId}`); }

    // Formatear dirección para guardar en el pedido (incluye quién recibe)
    let orderAddressString = null;
    if (deliveryDetails.method === 'domicilio') {
        const addr = deliveryDetails.address;
        orderAddressString = `Ciudad: ${addr.ciudad}, Calle: ${addr.calle} ${addr.numero}. Referencia: ${addr.referencia || '-'}. Recibe: ${addr.recibeNombre} ${addr.recibeApellido} (DNI: ${addr.recibeDni})`;
    }

    try {
      // 1. Guardar dirección en perfil si se marcó
      if (deliveryDetails.method === 'domicilio' && deliveryDetails.saveAddress) {
        // Solo guardamos la dirección del domicilio, no quién recibe
        await saveUserAddress({
            ciudad: deliveryDetails.address.ciudad,
            calle: deliveryDetails.address.calle,
            numero: deliveryDetails.address.numero,
            referencia: deliveryDetails.address.referencia
        });
        // Actualizar currentUser localmente para reflejar el guardado
        setCurrentUser(prev => ({
            ...prev,
            direccion_ciudad: deliveryDetails.address.ciudad,
            direccion_calle: deliveryDetails.address.calle,
            direccion_numero: deliveryDetails.address.numero,
            direccion_referencia: deliveryDetails.address.referencia
        }));
      }

      // 2. Crear el pedido
      const orderUi = {
        id: uid("ord"),
        clientId: currentUser.id,
        delivery: deliveryDetails.method,
        payment: "transferencia", // Placeholder
        address: orderAddressString,
        items: cart.map(it => ({ id: uid("itm"), productId: it.productId, qty: it.qty, price: products.find(p => p.id === it.productId)?.price || 0 }))
      };
      const createdOrder = await OrdersSB.create(orderUi);

      // 3. Refrescar datos y limpiar carrito
      const updatedProducts = await ProductsSB.all();
      setProducts(updatedProducts);
      setOrders(prevOrders => [createdOrder, ...prevOrders]);
      setCart([]);
      setCartOpen(false);
      alert("Pedido creado");

    } catch (e) {
      console.error("Error confirmando pedido:", e);
      // Lanza el error para que CartDrawer lo pueda atrapar si es necesario
      throw new Error("Error al confirmar el pedido: " + e.message);
    }
  }
  // --- FIN MODIFICACIÓN ---

  // --- NUEVA FUNCIÓN: Guardar dirección en perfil ---
  async function saveUserAddress(addressToSave) {
    if (!currentUser) return;
    console.log("Saving address for user:", currentUser.id, addressToSave);
    const { data, error } = await supabase
      .from('users')
      .update({
        direccion_ciudad: addressToSave.ciudad,
        direccion_calle: addressToSave.calle,
        direccion_numero: addressToSave.numero,
        direccion_referencia: addressToSave.referencia,
      })
      .eq('id', currentUser.id)
      .select() // Pedimos la fila actualizada
      .single(); // Esperamos solo una

    if (error) {
      console.error("Error saving user address:", error);
      // Considera no mostrar alert aquí para no interrumpir el flujo del pedido
      // alert("Hubo un problema al guardar tu dirección, pero el pedido continúa.");
      // Lanza el error para que confirmOrder lo sepa (opcional)
      // throw new Error("Error al guardar la dirección.");
    } else {
        console.log("User address saved successfully.");
        // Actualizar la lista 'users' localmente
        setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? {...u, ...data} : u));
        // Actualizar currentUser directamente también
        setCurrentUser(prev => ({...prev, ...data}));
    }
  }
  // --- FIN NUEVA FUNCIÓN ---

  // Otras funciones
  async function setOrderStatus(oid, newStatus) { try { const r = await OrdersSB.setStatus(oid, newStatus); if (newStatus === 'entregado') { await supabase.from('orders').update({ delivery_confirmed_at: new Date().toISOString() }).eq('id', oid); } setOrders(prev => { const i = prev.findIndex(o => o.id === oid); if (i < 0) return prev; const nO = [...prev]; const eO = nO[i]; nO[i] = { ...eO, ...r, status: newStatus, delivery_confirmed_at: newStatus === 'entregado' ? new Date().toISOString() : eO.delivery_confirmed_at }; return nO; }); setNotifications(prev => [{ id: uid("ntf"), text: `Pedido ${oid.slice(-6)} ${newStatus}`, ts: Date.now(), read: false }, ...prev].slice(0, 50)); } catch (e) { console.error(`Error status ${oid}:`, e); alert("No pude actualizar estado."); } }
  function ordersForUser() { if (!currentUser) return []; if (currentUser.role === "cliente") return orders.filter(o => o.clientId === currentUser.id); return orders; }
  function handleExportCSV() { const h = ["id", "cliente", "estado", "fecha", "total"]; const r = orders.map(o => [ o.id, users.find(u => u.id === o.clientId)?.name || o.clientId, o.status, new Date(o.createdAt).toLocaleString(), o.total ]); const c = [h.join(","), ...r.map(r => r.join(","))].join("\n"); const b = new Blob([c], { type: "text/csv;charset=utf-8;" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "pedidos.csv"; a.click(); URL.revokeObjectURL(u); }
  const ventasPorProducto = useMemo(() => { const e = orders.filter(o => o.status === "entregado"); const a = new Map(); for (const o of e) { for (const it of o.items) { const p = products.find(x => x.id === it.productId); const k = p ? p.name : `ID: ${it.productId}`; const v = a.get(k) || 0; a.set(k, v + it.qty * it.price); } } return Array.from(a.entries()).map(([name, total]) => ({ name, total })); }, [orders, products]);
  async function handleLogin(email, password) { try { setLoadingSession(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; } catch (error) { console.error("Login Error:", error.message); alert("Error: " + error.message); } finally { setLoadingSession(false); } }
  async function handleLogout() { try { setLoadingSession(true); const { error } = await supabase.auth.signOut(); if (error) throw error; setCart([]); } catch (error) { console.error("Logout Error:", error.message); alert("Error: " + error.message); } finally { setLoadingSession(false); } }
  async function handleSignUp(email, password, nombre, apellido, telefono) { try { setLoadingSession(true); const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: nombre, last_name: apellido, phone: telefono } } }); if (error) throw error; alert(`Registro exitoso! Confirma tu correo (${email}).`); setTimeout(async () => { const u = await UsersSB.all(); setUsers(u); }, 1500); } catch (error) { console.error("Signup Error:", error.message); alert("Error: " + error.message); } finally { setLoadingSession(false); } }
  async function handlePasswordResetRequest(email) { try { setLoadingSession(true); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/update-password` }); if (error) throw error; alert(`Si ${email} está registrado, recibirás correo.`); } catch (error) { console.error("Reset Request Error:", error.message); alert(`Error. Intenta de nuevo.`); } finally { setLoadingSession(false); } }
  function openNotifications() { setNotificationsOpen(true); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }

  // --- RENDERIZADO ---
  if (loadingSession) { return <div className="grid h-screen place-content-center bg-neutral-50"><h1 className="text-lg font-semibold">Cargando...</h1></div>; }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      <Header currentUser={currentUser} users={users} onLogin={handleLogin} onLogout={handleLogout} onSignUp={handleSignUp} onPasswordResetRequest={handlePasswordResetRequest} cartCount={cartCount} onOpenCart={() => setCartOpen(true)} onOpenNotifications={openNotifications} openLogin={openLogin} setOpenLogin={setOpenLogin} />
      <main className="mx-auto max-w-7xl px-4 pb-24">
        <TopTabs tab={tab} setTab={setTab} currentUser={currentUser} />
        {tab === "catalogo" && <Catalog products={filteredProducts} allProducts={products} q={q} setQ={setQ} fCategory={fCategory} setFCategory={setFCategory} fBrand={fBrand} setFBrand={setFBrand} categories={categories} brands={brands} addToCart={addToCart} canSeeStock={canSeeStock} sortBy={sortBy} setSortBy={setSortBy} />}
        {tab === "pedidos" && <OrdersView orders={ordersForUser()} users={users} products={products} currentUser={currentUser} onStatusChange={setOrderStatus} onExportCSV={handleExportCSV} />}
        {tab === "panel" && (currentUser?.role === "vendedor" || currentUser?.role === "admin") && <Panel products={products} setProducts={setProducts} orders={orders} setOrderStatus={setOrderStatus} users={users} />}
        {tab === "reportes" && currentUser?.role === "admin" && <Reports ventasPorProducto={ventasPorProducto} />}
      </main>
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        products={products}
        changeQty={changeQty}
        removeFromCart={removeFromCart}
        total={cartTotal} // Subtotal
        onConfirm={confirmOrder} // Pasa la función modificada
        canSeeStock={canSeeStock}
        shippingCostBase={shippingCostBase}
        // Pasamos la dirección guardada del usuario para pre-rellenar
        savedAddress={ currentUser ? { // Solo si currentUser existe
            ciudad: currentUser.direccion_ciudad,
            calle: currentUser.direccion_calle,
            numero: currentUser.direccion_numero,
            referencia: currentUser.direccion_referencia
        } : null}
      />
      <NotificationsDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} items={notifications} />
    </div>
  );
}