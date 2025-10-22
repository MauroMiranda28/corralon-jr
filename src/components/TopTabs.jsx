import React, { useEffect } from "react";

export default function TopTabs({ tab, setTab, currentUser }) {
  let tabs = [];
  let defaultTabKey = 'catalogo'; // Clave por defecto general

  // --- 1. Determina las pestañas según el rol ---
  if (!currentUser || currentUser.role === "cliente") {
    tabs = [
      { key: "catalogo", label: "Catálogo" },
      { key: "pedidos", label: "Mis Pedidos" },
    ];
    defaultTabKey = 'catalogo';
  } else if (currentUser.role === "deposito") {
    tabs = [
      { key: "pedidos", label: "Gestionar Pedidos" },
    ];
    defaultTabKey = 'pedidos';
  } else if (currentUser.role === "vendedor") { // Vendedor ahora solo ve Catálogo y Panel
     tabs = [
      { key: "catalogo", label: "Catálogo" },
      // Eliminamos la pestaña de pedidos para el vendedor
      { key: "panel", label: "Panel Productos" },
    ];
    defaultTabKey = 'catalogo'; // Mantenemos catálogo como la pestaña por defecto
  } else if (currentUser.role === "admin") { // Admin solo ve Reportes y Administración
    tabs = [
       { key: "reportes", label: "Reportes" },
       { key: "admin", label: "Administración" },
    ];
    defaultTabKey = 'reportes';
  }
  // Si hubiera otros roles, irían aquí...

  // --- 2. Hooks useEffect (sin cambios aquí) ---
  useEffect(() => {
    if (currentUser?.role === "deposito" && tab !== 'pedidos' && tabs.some(t => t.key === 'pedidos')) {
      setTab('pedidos');
    }
  }, [currentUser?.role, tab, setTab, tabs]);

  useEffect(() => {
    const currentTabExists = tabs.some(t => t.key === tab);
    if (!currentTabExists && tabs.length > 0) {
      setTab(defaultTabKey);
    }
  }, [tab, tabs, defaultTabKey, setTab]);

  // --- 3. Lógica de Renderizado (sin cambios aquí) ---
  if (tabs.length === 0) {
      return null;
  }

  const currentTabExistsNow = tabs.some(t => t.key === tab);
  const effectiveTabKey = currentTabExistsNow ? tab : defaultTabKey;

  return (
    <div className="sticky top-[57px] z-20 -mx-4 border-b border-neutral-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
              t.key === effectiveTabKey
               ? "bg-neutral-900 text-white"
               : "hover:bg-neutral-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}