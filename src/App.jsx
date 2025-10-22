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
import AdminPanel from "./components/AdminPanel.jsx"; // --- NUEVO ---

// --- Imports de Supabase ---
import { productsApi as ProductsSB } from "./services/products.supabase.js";
import { ordersApi as OrdersSB } from "./services/orders.supabase.js";
import { usersApi as UsersSB } from "./services/users.supabase.js";
import { supabase } from "./lib/supabase.js";

import { toARS, uid } from "./utils/utils.js";

// --- NUEVO: Imports de Reportes ---
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// --- FIN NUEVO ---

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
  
  // --- MODIFICADO: Costo de envío ahora es un estado ---
  const [shippingCostBase, setShippingCostBase] = useState(500); 
  
  const [openLogin, setOpenLogin] = useState(false);

  // --- NUEVO: Estados para filtros de reporte ---
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);

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
    switch (sortBy) { case 'price-asc': sorted.sort((a, b) => a.price - b.price); break; case 'price-desc': sorted.sort((a, b) => b.price - b.price); break; case 'name-asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break; case 'name-desc': sorted.sort((a, b) => b.name.localeCompare(a.name)); break; default: break; }
    return sorted;
  }, [products, q, fCategory, fBrand, sortBy]);

  // Hook de navegación
  const navigate = useNavigate();

  // --- Effects ---
  // MODIFICADO: Carga inicial (incluye costo de envío)
  useEffect(() => {
    (async () => {
      try {
        const [p, o, u] = await Promise.all([ProductsSB.all(), OrdersSB.all(), UsersSB.all()]);
        setProducts(p); setOrders(o); setUsers(u);

        // --- NUEVO: Cargar costo de envío ---
        const { data: configData, error: configError } = await supabase
          .from('configuracion')
          .select('value')
          .eq('key', 'costo_envio')
          .single();
        
        if (configError && configError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error("Error cargando config:", configError);
        } else if (configData) {
            setShippingCostBase(Number(configData.value) || 500);
        }
        // --- FIN NUEVO ---

      } catch (err) { console.error("Error cargando datos:", err); alert("No pude cargar datos."); }
    })();
  }, []);
  // Gestión Sesión
  useEffect(() => {
    setLoadingSession(true); supabase.auth.getSession().then(({ data: { session: i } }) => { setSession(i); setLoadingSession(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (e, cSess) => { if (e === 'PASSWORD_RECOVERY' && cSess) { navigate('/update-password'); } else { setSession(cSess); } });
    return () => subscription.unsubscribe();
  }, [navigate]);
  // Buscar Perfil (sin cambios)
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

  // --- Helpers Carrito (sin cambios) ---
  function addToCart(productId) { const p = products.find(p => p.id === productId); if (!p) return; const i = cart.find(it => it.productId === productId); if (i) { if (i.qty + 1 > p.stock) return alert("Stock insuficiente"); setCart(cart.map(it => (it.productId === productId ? { ...it, qty: it.qty + 1 } : it))); } else { if (p.stock < 1) return alert("Sin stock"); setCart([...cart, { productId, qty: 1 }]); } }
  function changeQty(productId, delta) { setCart(prev => prev.flatMap(it => { if (it.productId !== productId) return [it]; const nQ = it.qty + delta; if (nQ <= 0) return []; const p = products.find(p => p.id === productId); if (p && nQ > p.stock) { alert("Stock insuficiente"); return [it]; } return [{ ...it, qty: nQ }]; })); }
  function removeFromCart(productId) { setCart(cart.filter(it => it.productId !== productId)); }

  // --- Funciones Pedido (sin cambios) ---
  async function confirmOrder(deliveryDetails) {
    if (!currentUser || currentUser.role !== "cliente") {
        setCartOpen(false)
        setTimeout(() => setOpenLogin(true), 100); // Abre el modal de login
        return; 
    }
    if (!cart.length) return alert("Carrito vacío");

    if (deliveryDetails.method === 'domicilio' && (
        !deliveryDetails.address?.ciudad?.trim() ||
        !deliveryDetails.address?.calle?.trim() ||
        !deliveryDetails.address?.numero?.trim() ||
        !deliveryDetails.address?.recibeNombre?.trim() ||
        !deliveryDetails.address?.recibeApellido?.trim() ||
        !deliveryDetails.address?.recibeDni?.trim()
        )) {
        throw new Error("Completa todos los campos obligatorios (*) de la dirección y quién recibe.");
    }
    for (const it of cart) { const p = products.find(p => p.id === it.productId); if (!p || p.stock < it.qty) throw new Error(`Stock insuficiente: ${p?.name || it.productId}`); }

    let orderAddressString = null;
    if (deliveryDetails.method === 'domicilio') {
        const addr = deliveryDetails.address;
        orderAddressString = `Ciudad: ${addr.ciudad}, Calle: ${addr.calle} ${addr.numero}. Referencia: ${addr.referencia || '-'}. Recibe: ${addr.recibeNombre} ${addr.recibeApellido} (DNI: ${addr.recibeDni})`;
    }

    try {
      if (deliveryDetails.method === 'domicilio' && deliveryDetails.saveAddress) {
        await saveUserAddress({
            ciudad: deliveryDetails.address.ciudad,
            calle: deliveryDetails.address.calle,
            numero: deliveryDetails.address.numero,
            referencia: deliveryDetails.address.referencia
        });
        setCurrentUser(prev => ({
            ...prev,
            direccion_ciudad: deliveryDetails.address.ciudad,
            direccion_calle: deliveryDetails.address.calle,
            direccion_numero: deliveryDetails.address.numero,
            direccion_referencia: deliveryDetails.address.referencia
        }));
      }

      const orderUi = {
        id: uid("ord"),
        clientId: currentUser.id,
        delivery: deliveryDetails.method,
        payment: "transferencia", // Placeholder
        address: orderAddressString,
        items: cart.map(it => ({ id: uid("itm"), productId: it.productId, qty: it.qty, price: products.find(p => p.id === it.productId)?.price || 0 }))
      };
      const createdOrder = await OrdersSB.create(orderUi);
      const updatedProducts = await ProductsSB.all();
      setProducts(updatedProducts);
      setOrders(prevOrders => [createdOrder, ...prevOrders]);
      setCart([]);
      setCartOpen(false);
      alert("Pedido creado");

    } catch (e) {
      console.error("Error confirmando pedido:", e);
      throw new Error("Error al confirmar el pedido: " + e.message);
    }
  }
  async function saveUserAddress(addressToSave) {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('users')
      .update({
        direccion_ciudad: addressToSave.ciudad,
        direccion_calle: addressToSave.calle,
        direccion_numero: addressToSave.numero,
        direccion_referencia: addressToSave.referencia,
      })
      .eq('id', currentUser.id)
      .select() 
      .single(); 
    if (error) {
      console.error("Error saving user address:", error);
    } else {
        console.log("User address saved successfully.");
        setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? {...u, ...data} : u));
        setCurrentUser(prev => ({...prev, ...data}));
    }
  }
  async function setOrderStatus(oid, newStatus) { try { const r = await OrdersSB.setStatus(oid, newStatus); if (newStatus === 'entregado') { await supabase.from('orders').update({ delivery_confirmed_at: new Date().toISOString() }).eq('id', oid); } setOrders(prev => { const i = prev.findIndex(o => o.id === oid); if (i < 0) return prev; const nO = [...prev]; const eO = nO[i]; nO[i] = { ...eO, ...r, status: newStatus, delivery_confirmed_at: newStatus === 'entregado' ? new Date().toISOString() : eO.delivery_confirmed_at }; return nO; }); setNotifications(prev => [{ id: uid("ntf"), text: `Pedido ${oid.slice(-6)} ${newStatus}`, ts: Date.now(), read: false }, ...prev].slice(0, 50)); } catch (e) { console.error(`Error status ${oid}:`, e); alert("No pude actualizar estado."); } }
  function ordersForUser() { if (!currentUser) return []; if (currentUser.role === "cliente") return orders.filter(o => o.clientId === currentUser.id); return orders; }
  
  // --- MODIFICADO: Memos de Reportes (RF08.3) ---
  
  // 1. Filtra pedidos por fecha
  const filteredOrdersByDate = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      // Filtro "Desde"
      if (fechaDesde) {
        const fromDate = new Date(fechaDesde);
        fromDate.setHours(0, 0, 0, 0); // Inicio del día
        if (orderDate < fromDate) return false;
      }
      // Filtro "Hasta"
      if (fechaHasta) {
        const toDate = new Date(fechaHasta);
        toDate.setHours(23, 59, 59, 999); // Fin del día
        if (orderDate > toDate) return false;
      }
      return true;
    });
  }, [orders, fechaDesde, fechaHasta]);
  
  // 2. Reporte: Ventas por producto (usa pedidos filtrados)
  const ventasPorProducto = useMemo(() => { 
    const e = filteredOrdersByDate.filter(o => o.status === "entregado"); 
    const a = new Map(); 
    for (const o of e) { for (const it of o.items) { const p = products.find(x => x.id === it.productId); const k = p ? p.name : `ID: ${it.productId}`; const v = a.get(k) || 0; a.set(k, v + it.qty * it.price); } } 
    return Array.from(a.entries()).map(([name, total]) => ({ name, total: Number(total.toFixed(2)) })); 
  }, [filteredOrdersByDate, products]);
  
  // 3. Reporte: Picos de demanda (usa pedidos filtrados)
  const picosDeDemanda = useMemo(() => {
    const e = filteredOrdersByDate; // Todos los pedidos en el rango
    const a = new Map();
    for (const o of e) {
      const dia = new Date(o.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const v = a.get(dia) || { pedidos: 0, total: 0 };
      v.pedidos += 1;
      v.total += o.total;
      a.set(dia, v);
    }
    return Array.from(a.entries())
      .map(([name, data]) => ({ name, pedidos: data.pedidos, total: Number(data.total.toFixed(2)) }))
      .sort((a, b) => new Date(a.name.split('/').reverse().join('-')) - new Date(b.name.split('/').reverse().join('-')));
  }, [filteredOrdersByDate]);
  
  // --- FIN MODIFICACIÓN ---

  // --- Funciones de Autenticación (sin cambios) ---
  async function handleLogin(email, password) { try { setLoadingSession(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; } catch (error) { console.error("Login Error:", error.message); alert("Error: " + error.message); } finally { setLoadingSession(false); } }
  async function handleLogout() { try { setLoadingSession(true); const { error } = await supabase.auth.signOut(); if (error) throw error; setCart([]); } catch (error) { console.error("Logout Error:", error.message); alert("Error: " + error.message); } finally { setLoadingSession(false); } }
  async function handleSignUp(email, password, nombre, apellido, telefono) { try { setLoadingSession(true); const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: nombre, last_name: apellido, phone: telefono } } }); if (error) throw error; alert(`Registro exitoso! Confirma tu correo (${email}).`); setTimeout(async () => { const u = await UsersSB.all(); setUsers(u); }, 1500); } catch (error) { console.error("Signup Error:", error.message); alert("Error: " + error.message); } finally { setLoadingSession(false); } }
  async function handlePasswordResetRequest(email) { try { setLoadingSession(true); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/update-password` }); if (error) throw error; alert(`Si ${email} está registrado, recibirás correo.`); } catch (error) { console.error("Reset Request Error:", error.message); alert(`Error. Intenta de nuevo.`); } finally { setLoadingSession(false); } }
  function openNotifications() { setNotificationsOpen(true); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }
  
  // --- NUEVAS FUNCIONES: Admin y Reportes (RF08.1, RF08.2, RF08.3) ---

  async function handleSaveShippingCost(newValue) {
    try {
      // Asumimos que solo hay una fila con key 'costo_envio'
      const { error } = await supabase
        .from('configuracion')
        .update({ value: newValue })
        .eq('key', 'costo_envio');
      if (error) throw error;
      setShippingCostBase(newValue);
      alert('Costo de envío actualizado');
    } catch (e) {
      console.error("Error guardando costo de envío:", e);
      alert("No se pudo guardar el costo de envío.");
      throw e; // Lanza para que el componente sepa que falló
    }
  }

  async function handleUpdateUserRole(userId, newRole) {
    try {
      const updatedUser = await UsersSB.adminUpdateUserRole(userId, newRole);
      // Actualizar el estado local 'users'
      setUsers(prevUsers => prevUsers.map(u => 
        u.id === userId ? { ...u, role: updatedUser.rol } : u
      ));
      alert('Rol de usuario actualizado');
    } catch (e) {
      console.error("Error actualizando rol:", e);
      alert("No se pudo actualizar el rol.");
      throw e; // Lanza para que el componente sepa que falló
    }
  }

  function handleExportExcel(data, fileName) {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reporte");
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } catch(e) {
      console.error("Error exportando a Excel:", e);
      alert("No se pudo generar el archivo Excel.");
    }
  }

  // --- Restaurar función Exportar CSV para OrdersView ---
  function handleExportCSV() {
    const h = ["id", "cliente", "estado", "fecha", "total", "metodo_entrega", "direccion_envio"]; // Añadir columnas
    const r = ordersForUser().map(o => { // Usar ordersForUser() para respetar el rol
      const clientName = users.find(u => u.id === o.clientId)?.name || o.clientId;
      return [
        o.id,
        clientName,
        o.status,
        new Date(o.createdAt).toLocaleString(),
        o.total,
        o.delivery === 'domicilio' ? 'A Domicilio' : 'Retiro en Corralón', // Mapear valor
        o.address || '' // Incluir dirección o vacío
      ];
    });
    // Formatear valores para CSV (escapar comas si existen en los nombres o direcciones)
    const formatRow = (row) => row.map(val => {
      const strVal = String(val);
      // Si el valor contiene comas, comillas dobles o saltos de línea, encerrarlo entre comillas dobles
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        // Escapar comillas dobles existentes duplicándolas
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    }).join(",");

    const c = [formatRow(h), ...r.map(formatRow)].join("\n");
    const b = new Blob(["\uFEFF" + c], { type: "text/csv;charset=utf-8;" }); // Añadir BOM para Excel
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = "pedidos.csv";
    document.body.appendChild(a); // Necesario en algunos navegadores
    a.click();
    document.body.removeChild(a); // Limpiar
    URL.revokeObjectURL(u);
  }

  function handleExportPDF(data, title, columns) {
   try {
     const doc = new jsPDF();
     doc.text(title, 14, 15);
     doc.autoTable({
       startY: 20,
       head: [columns.map(c => c.header)],
       body: data.map(row => columns.map(c => {
         const value = row[c.dataKey];
         // Formatear si es número (ej. total)
         if (typeof value === 'number') return toARS(value);
         return value;
       })),
     });
     doc.save(`${title.replace(/ /g, '_')}.pdf`);
   } catch(e) {
     console.error("Error exportando a PDF:", e);
     alert("No se pudo generar el archivo PDF.");
   }
}

// Dentro de App.jsx
async function handleAdminCreateUser(email, password, nombre, apellido, telefono, role) {
  if (!['vendedor', 'deposito', 'admin'].includes(role)) {
     alert('Rol inválido seleccionado.');
     throw new Error('Rol inválido');
  }

  console.log("Intentando crear usuario:", { email, nombre, apellido, telefono, role }); // <-- LOG 1

  setLoadingSession(true);
  try {
    console.log("Llamando a supabase.auth.signUp..."); // <-- LOG 2
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: nombre,
          last_name: apellido,
          phone: telefono,
          role: role
        }
      }
    });

    console.log("Respuesta de signUp:", { data, error }); // <-- LOG 3

    if (error) {
       console.error("Error DETECTADO en signUp:", error); // <-- LOG 4
       throw error; // Esto debería lanzar el error al catch
    }

    // Si llega aquí, signUp no devolvió un error explícito
    console.log("signUp parece haber funcionado, data:", data); // <-- LOG 5
    alert(`Cuenta de empleado creada (aparentemente) para ${email}. Verifica en Supabase Auth.`); // Mensaje más cauto

    setTimeout(async () => {
      console.log("Refrescando lista de usuarios..."); // <-- LOG 6
      const u = await UsersSB.all();
      setUsers(u);
    }, 1500);

    return data;

  } catch (error) { // Este catch debería atrapar el 'throw error'
    console.error("ERROR CAPTURADO en handleAdminCreateUser:", error); // <-- LOG 7
    // El alert original ya está aquí
    alert("Error creando cuenta: " + error.message);
    throw error; // Re-lanzar para AdminPanel si es necesario
  } finally {
    console.log("Finalizando handleAdminCreateUser."); // <-- LOG 8
    setLoadingSession(false);
  }
}
  // --- Fin Restaurar ---
  
  // --- FIN NUEVAS FUNCIONES ---

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
        
        {/* --- MODIFICADO: Renderizado de Reportes --- */}
        {tab === "reportes" && currentUser?.role === "admin" && (
          <Reports 
            ventasPorProducto={ventasPorProducto} 
            picosDeDemanda={picosDeDemanda}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            fechaDesde={fechaDesde}
            setFechaDesde={setFechaDesde}
            fechaHasta={fechaHasta}
            setFechaHasta={setFechaHasta}
          />
        )}
        {/* --- FIN MODIFICACIÓN --- */}

        {/* --- NUEVO: Renderizado de Panel Admin --- */}
        {tab === "admin" && currentUser?.role === "admin" && (
          <AdminPanel
            users={users}
            onUpdateUserRole={handleUpdateUserRole}
            shippingCostBase={shippingCostBase}
            onSaveShippingCost={handleSaveShippingCost}
            onAdminCreateUser={handleAdminCreateUser}
          />
        )}
        {/* --- FIN NUEVO --- */}

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