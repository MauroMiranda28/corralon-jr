import React from "react";
import { ShoppingCart, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toARS } from "../utils/utils.js";

export default function Catalog({ products, allProducts, q, setQ, fCategory, setFCategory, fBrand, setFBrand, categories, brands, addToCart, canSeeStock }) {
  return (
    <section className="mt-6">
      {/* --- Filtros (sin cambios) --- */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2">
            <Filter className="h-5 w-5 text-neutral-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o marca…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400" />
          </div>
        </div>
        <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm">
          {(categories || []).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={fBrand} onChange={(e) => setFBrand(e.target.value)} className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm">
          {(brands || []).map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Mensaje si no hay productos */}
      {(!products || products.length === 0) && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600">No hay resultados. Probá cambiar los filtros.</div>
      )}

      {/* Grid de Productos */}
      <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {(products || []).map((p) => (
            <motion.div key={p.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"> {/* Añadido flex flex-col */}
              {/* Imagen */}
              <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 flex-shrink-0"> {/* Añadido flex-shrink-0 */}
                {p.img ? (
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                ) : <div className="h-full w-full grid place-content-center text-neutral-400 text-xs">Sin imagen</div>} {/* Placeholder si no hay imagen */}
              </div>
              {/* Contenido */}
              <div className="p-4 flex flex-col flex-grow"> {/* Añadido flex flex-col flex-grow */}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium leading-tight">{p.name}</h3>
                    <div className="mt-1 text-xs text-neutral-500">{p.brand} · {p.category}</div>
                  </div>
                  <div className="text-right font-semibold whitespace-nowrap">{toARS(p.price)}</div> {/* Evita que el precio se rompa */}
                </div>

                {/* --- NUEVO: Mostrar Descripción --- */}
                {/* Mostramos solo si existe, con un límite de líneas */}
                {p.descripcion && (
                  <p className="mt-1 text-xs text-neutral-600 line-clamp-2 flex-grow"> {/* line-clamp-2 limita a 2 líneas, flex-grow para empujar botones abajo */}
                    {p.descripcion}
                  </p>
                )}
                {/* --- FIN NUEVO --- */}

                {/* Botones y Stock (empujados abajo) */}
                <div className="mt-auto pt-2 flex items-center justify-between"> {/* mt-auto empuja esto al final, pt-2 añade espacio */}
                  {/* Stock / Disponibilidad */}
                  {canSeeStock ? (
                    <span className={`rounded-full px-2 py-1 text-xs ${p.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      Stock: {p.stock}
                    </span>
                  ) : (
                    <span className={`rounded-full px-2 py-1 text-xs ${p.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {p.stock > 0 ? "Disponible" : "Agotado"}
                    </span>
                  )}
                  {/* Botón Agregar */}
                  <button
                    disabled={p.stock <= 0}
                    onClick={() => addToCart(p.id)}
                    className={`rounded-xl px-3 py-2 text-sm transition ${p.stock <= 0 ? "cursor-not-allowed bg-neutral-200 text-neutral-500" : "bg-neutral-900 text-white hover:bg-neutral-800"}`}
                  >
                    <ShoppingCart className="mr-1 inline h-4 w-4" /> Agregar
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}