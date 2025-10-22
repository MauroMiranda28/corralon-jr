import React, { useEffect } from "react";

export default function TopTabs({ tab, setTab, currentUser }) {
  let tabs = [];
  let defaultTabKey = 'catalogo'; // Clave por defecto general

  // --- 1. Determina las pestañas según el rol ---

  // Si NO hay usuario logueado, solo mostrar Catálogo
  if (!currentUser) {
    tabs = [
      { key: "catalogo", label: "Catálogo" },
    ];
    defaultTabKey = 'catalogo';
  }
  // Si es cliente, mostrar Catálogo y Mis Pedidos
  else if (currentUser.role === "cliente") {
    tabs = [
      { key: "catalogo", label: "Catálogo" },
      { key: "pedidos", label: "Mis Pedidos" }, // Solo se añade si currentUser existe y es cliente
    ];
    defaultTabKey = 'catalogo';
  }
  // Si es empleado de depósito
  else if (currentUser.role === "deposito") {
    tabs = [
      { key: "pedidos", label: "Gestionar Pedidos" },
    ];
    defaultTabKey = 'pedidos';
  }
  // Si es vendedor
  else if (currentUser.role === "vendedor") {
     tabs = [
      { key: "catalogo", label: "Catálogo" },
      { key: "panel", label: "Panel Productos" }, // Vendedor no ve pedidos
    ];
    defaultTabKey = 'catalogo';
  }
  // Si es administrador
  else if (currentUser.role === "admin") {
    tabs = [
       { key: "reportes", label: "Reportes" },
       { key: "admin", label: "Administración" }, // Admin no ve catálogo, pedidos ni panel
    ];
    defaultTabKey = 'reportes';
  }
  // Si hubiera otros roles, irían aquí...

  // --- 2. Hooks useEffect ---

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
      // busca la pestaña por defecto definida arriba según el rol
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