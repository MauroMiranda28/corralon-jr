import React, { useEffect } from "react"; // Asegúrate de importar useEffect

export default function TopTabs({ tab, setTab, currentUser }) {
  let tabs = [];
  let defaultTabKey = 'catalogo'; // Definimos una clave de pestaña por defecto general

  // --- 1. Determina las pestañas según el rol (sin hooks aquí) ---
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
    defaultTabKey = 'pedidos'; // La pestaña por defecto para deposito
  } else { // Vendedor or Admin
    tabs = [
      { key: "catalogo", label: "Catálogo" },
      { key: "pedidos", label: "Pedidos" },
    ];
    if (currentUser?.role === "vendedor" || currentUser?.role === "admin") {
      tabs.push({ key: "panel", label: "Panel Productos" });
    }
    if (currentUser?.role === "admin") {
       tabs.push({ key: "reportes", label: "Reportes" });
    }
    defaultTabKey = 'catalogo';
  }

  // --- 2. Hooks useEffect (SIEMPRE se llaman) ---

  // Efecto para asegurar que 'deposito' use la pestaña 'pedidos'
  useEffect(() => {
    // La condición va DENTRO del efecto
    if (currentUser?.role === "deposito" && tab !== 'pedidos' && tabs.some(t => t.key === 'pedidos')) {
      setTab('pedidos');
    }
    // Dependencias: el rol, la pestaña actual y la función para cambiarla
  }, [currentUser?.role, tab, setTab, tabs]); // Incluir 'tabs' porque su contenido afecta la lógica

  // Efecto para asegurar que la pestaña activa sea válida para el rol actual
  useEffect(() => {
    const currentTabExists = tabs.some(t => t.key === tab);
    // La condición va DENTRO del efecto
    if (!currentTabExists && tabs.length > 0) {
      // Si la pestaña actual no existe para este rol,
      // busca la pestaña por defecto definida arriba
      setTab(defaultTabKey);
    }
    // Dependencias: la pestaña actual, el array de pestañas calculado, la pestaña por defecto y la función
  }, [tab, tabs, defaultTabKey, setTab]);


  // --- 3. Lógica de Renderizado ---

  // Si no hay pestañas para el rol actual (poco probable, pero seguro)
  if (tabs.length === 0) {
      return null;
  }

  // Determina qué pestaña resaltar AHORA (antes de que los efectos actualicen 'tab')
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
              t.key === effectiveTabKey // Compara con la clave efectiva
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