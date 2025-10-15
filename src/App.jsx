import React, { useEffect, useMemo, useState } from "react";
import { ShoppingCart, LogIn, LogOut, Package, Truck, CheckCircle2, Settings, Plus, Minus, Trash2, Filter, BarChart3, User, RefreshCcw, Edit3, Save, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { storage } from "./services/storage.js";
import { products } from "./services/products.js"; 
import Header from "./components/Header.jsx";
import Catalog from "./components/Catalog.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import OrdersView from "./components/OrdersView.jsx";
import PrintOrderButton from "./components/PrintOrderButton.jsx";
import StatusBadge from "./components/StatusBadge.jsx";
import StatusChanger from "./components/StatusChanger.jsx";
import TopTabs from "./components/TopTabs.jsx";
import NumberField from "./components/NumberField.jsx";
import TextField from "./components/TextField.jsx";
import NotificationsDrawer from "./components/NotificationsDrawer.jsx";
import Panel from "./components/Panel.jsx";
import Reports from "./components/Reports.jsx";
import { LS_KEYS, ORDER_STATUSES, uid, toARS } from "./utils/utils.js";


// --- Datos semilla ---
const seedProducts = () => ([
  { id: uid("prd"), name: "Cemento Portland x50kg", category: "Cementos", brand: "Loma Negra", price: 9500, stock: 42, img: "/products/cemento.jpg" },
  { id: uid("prd"), name: "Cal hidratada x25kg", category: "Cal", brand: "Cacique", price: 5200, stock: 35, img: "/products/cal.jpg" },
  { id: uid("prd"), name: "Arena fina m³", category: "Áridos", brand: "Bolson", price: 18000, stock: 12, img: "/products/arena.jpg" },
  { id: uid("prd"), name: "Ladrillo común", category: "Ladrillos", brand: "Rojo 18x18x33", price: 600, stock: 2000, img: "/products/ladrillo.jpg" },
  { id: uid("prd"), name: "Hierro 8mm barra 12m", category: "Hierros", brand: "Acindar", price: 7800, stock: 100, img: "/products/hierro.jpg" },
  { id: uid("prd"), name: "Chapa sinusoidal N°25 3m", category: "Chapas", brand: "Zinc", price: 31000, stock: 24, img: "/products/chapa.jpg" },
]);

const seedUsers = () => ([
  { id: uid("usr"), name: "Juan Gómez", role: "cliente" },
  { id: uid("usr"), name: "María Herrera", role: "vendedor" },
  { id: uid("usr"), name: "Pedro Suárez", role: "admin" },
]);

// --- Hooks de almacenamiento, persisten entre f5c
// src/hooks/useLocalState.js  (o donde lo tengas)
 // <-- usa el wrapper

export function useLocalState(key, initialFactory) {
  const [state, setState] = useState(() => {
    const saved = storage.get(key);
    if (saved != null) return saved;
    const initial =
      typeof initialFactory === "function" ? initialFactory() : initialFactory;
    storage.set(key, initial);
    return initial;
  });

  useEffect(() => {
    storage.set(key, state);
  }, [key, state]);

  return [state, setState];
}

// --- Notificaciones por usuario ---
function pushNotification(userId, text) {
  const all = storage.get(LS_KEYS.notifications, {}); // <- ya viene objeto
  const list = all[userId] || [];
  const item = { id: uid("ntf"), text, ts: Date.now(), read: false };
  all[userId] = [item, ...list].slice(0, 50);
  storage.set(LS_KEYS.notifications, all); // <- NO stringify
}

function popUserNotifications(userId) {
  const all = storage.get(LS_KEYS.notifications, {});
  return all[userId] || [];
}
function markAllRead(userId) {
  const all = storage.get(LS_KEYS.notifications, {});
  if (all[userId]) {
    all[userId] = all[userId].map((n) => ({ ...n, read: true }));
    storage.set(LS_KEYS.notifications, all);
  }
}

// --- App principal ---
export default function App() {
  const [products, setProducts] = useLocalState(LS_KEYS.products, () => seedProducts());
  const [orders, setOrders] = useLocalState(LS_KEYS.orders, () => []);
  const [users, setUsers] = useLocalState(LS_KEYS.users, () => seedUsers());
  const [session, setSession] = useLocalState(LS_KEYS.session, () => ({ userId: users[0]?.id || null }));
  const currentUser = useMemo(() => users.find((u) => u.id === session?.userId) || null, [users, session]);
  const canSeeStock = !!currentUser && currentUser.role !== "cliente";
  const isAdmin = currentUser?.role === "admin"

  const [cartOpen, setCartOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [tab, setTab] = useState("catalogo");

  // Carrito simple en estado (no en LS para simplificar la demo entre usuarios)
  const [cart, setCart] = useState([]); // [{productId, qty}]
  const cartCount = useMemo(() => cart.reduce((a, b) => a + b.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, it) => sum + (products.find(p => p.id === it.productId)?.price || 0) * it.qty, 0), [cart, products]);

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

  // Notificaciones del usuario actual
  const [userNtf, setUserNtf] = useState([]);
  useEffect(() => {
    if (currentUser) setUserNtf(popUserNotifications(currentUser.id));
  }, [currentUser, orders]);


function resetDemo() {
  ["jr_products","jr_orders","jr_users","jr_session","jr_notifications","jr_stock_movs"]
    .forEach(k => storage.remove(k));
  location.reload();
}

  function loginAs(userId) { setSession({ userId }); setNotificationsOpen(false); }
  function logout() { setSession({ userId: null }); setCart([]); }

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

  function confirmOrder() {
    if (!currentUser || currentUser.role !== "cliente") return alert("Ingresá como Cliente para confirmar");
    if (cart.length === 0) return alert("Tu carrito está vacío");
    // Validar stock
    for (const it of cart) {
      const p = products.find(p => p.id === it.productId);
      if (!p || p.stock < it.qty) {
        return alert(`Sin stock suficiente para ${p?.name || it.productId}`);
      }
    }
    // Crear pedido
    const order = {
      id: uid("ord"),
      clientId: currentUser.id,
      items: cart.map(it => ({ productId: it.productId, qty: it.qty, price: products.find(p => p.id === it.productId)?.price || 0 })),
      total: cart.reduce((s, it) => s + (products.find(p => p.id === it.productId)?.price || 0) * it.qty, 0),
      status: "pendiente",
      createdAt: Date.now(),
      delivery: "retiro", // demo
      payment: "transferencia", // demo
    };
    setOrders([order, ...orders]);
    // Descontar stock
    const updated = products.map(p => {
      const it = cart.find(i => i.productId === p.id);
      return it ? { ...p, stock: p.stock - it.qty } : p;
    });
    setProducts(updated);
    setCart([]);
    setCartOpen(false);
    alert("Pedido creado. Estado: pendiente");
  }

  function setOrderStatus(oid, newStatus) {
    setOrders((prev) => prev.map(o => o.id === oid ? { ...o, status: newStatus } : o));
    const ord = orders.find(o => o.id === oid);
    if (ord) pushNotification(ord.clientId, `Tu pedido ${oid.slice(-6)} ahora está "${newStatus}".`);
  }

  function ordersForUser() {
    if (!currentUser) return [];
    if (currentUser.role === "cliente") return orders.filter(o => o.clientId === currentUser.id);
    return orders; // vendedor/admin ven todos
  }

  const ventasPorProducto = useMemo(() => {
    // solo pedidos entregados
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

  function exportOrdersCSV() {
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
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      <Header
        currentUser={currentUser}
        users={users}
        onLogin={loginAs}
        onLogout={logout}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        onOpenNotifications={() => { setNotificationsOpen(true); markAllRead(currentUser?.id); setUserNtf(popUserNotifications(currentUser?.id)); }}
        onResetDemo={resetDemo}
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
            onExportCSV={exportOrdersCSV}
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
        items={userNtf}
      />
    </div>
  );
}





