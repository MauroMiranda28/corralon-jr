import React from "react";
import { ShoppingCart, Filter, ArrowDownUp } from "lucide-react"; // Añadir icono de ordenamiento
import { motion, AnimatePresence } from "framer-motion";
import { toARS } from "../utils/utils.js";

// Recibe sortBy y setSortBy como props
export default function Catalog({
  products, allProducts, q, setQ, fCategory, setFCategory, fBrand, setFBrand,
  categories, brands, addToCart, canSeeStock, sortBy, setSortBy // Nuevas props
}) {
  return (
    <section className="mt-6">
      {/* --- Contenedor de Filtros y Ordenamiento --- */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
        {/* Búsqueda */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 h-full">
            <Filter className="h-5 w-5 text-neutral-500 flex-shrink-0" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o marca…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400" />
          </div>
        </div>
        {/* Filtro Categoría */}
        <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm h-full cursor-pointer">
          {(categories || []).map(c => <option key={c} value={c}>{c === 'todos' ? 'Todas las Categorías' : c}</option>)}
        </select>
        {/* Filtro Marca */}
        <select value={fBrand} onChange={(e) => setFBrand(e.target.value)} className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm h-full cursor-pointer">
          {(brands || []).map(b => <option key={b} value={b}>{b === 'todas' ? 'Todas las Marcas' : b}</option>)}
        </select>

        {/* --- NUEVO: Select de Ordenamiento --- */}
        <div className="relative"> {/* Contenedor relativo para iconos */}
           <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none w-full rounded-2xl border border-neutral-200 bg-white pl-8 pr-8 py-2 text-sm h-full focus:outline-none focus:ring-2 focus:ring-neutral-900/10 cursor-pointer" // Aumentado padding derecho
              aria-label="Ordenar productos por"
           >
              <option value="default">Relevancia</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="name-asc">Nombre: A-Z</option>
              <option value="name-desc">Nombre: Z-A</option>
           </select>
           {/* Icono de ordenamiento */}
           <ArrowDownUp className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
           {/* Flecha desplegable (chevron) */}
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
        </div>
        {/* --- FIN NUEVO --- */}

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
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              {/* Imagen */}
              <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 flex-shrink-0">
                 {p.img ? <img src={p.img} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  : <div className="h-full w-full grid place-content-center text-neutral-400 text-xs">Sin imagen</div>}
              </div>
              {/* Contenido */}
              <div className="p-4 flex flex-col flex-grow">
                 {/* Nombre, Marca, Cat, Precio */}
                 <div className="mb-2 flex items-start justify-between gap-2">
                    <div> <h3 className="font-medium leading-tight group-hover:text-emerald-700">{p.name}</h3> <div className="mt-1 text-xs text-neutral-500">{p.brand} · {p.category}</div> </div>
                    <div className="text-right font-semibold whitespace-nowrap">{toARS(p.price)}</div>
                 </div>
                 {/* Descripción */}
                 {p.descripcion && ( <p className="mt-1 text-xs text-neutral-600 line-clamp-2 flex-grow min-h-[2.5em]"> {p.descripcion} </p> )}
                 {!p.descripcion && (<div className="flex-grow min-h-[2.5em]"></div>)} {/* Espacio si no hay descripción */}
                 {/* Stock y Botón Agregar */}
                 <div className="mt-auto pt-2 flex items-center justify-between">
                    {canSeeStock ? (<span className={`rounded-full px-2 py-1 text-xs ${p.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}> Stock: {p.stock} </span>)
                     : (<span className={`rounded-full px-2 py-1 text-xs ${p.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}> {p.stock > 0 ? "Disponible" : "Agotado"} </span>)}
                    <button disabled={p.stock <= 0} onClick={() => addToCart(p.id)} className={`rounded-xl px-3 py-2 text-sm transition ${p.stock <= 0 ? "cursor-not-allowed bg-neutral-200 text-neutral-500" : "bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-700"}`}> <ShoppingCart className="mr-1 inline h-4 w-4" /> Agregar </button>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}