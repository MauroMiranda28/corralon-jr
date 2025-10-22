import React, { useState } from "react";
// Quitamos UploadCloud, X ya que volvimos a la versión sin subida de imagen por ahora
import { Edit3, Save, Eye, EyeOff } from "lucide-react";
import TextField from "./TextField.jsx";
import NumberField from "./NumberField.jsx";
import { toARS, uid } from "../utils/utils.js";
import { productsApi } from "../services/products.supabase.js";
// Quitamos import de supabase si no se usa para Storage
// import { supabase } from "../lib/supabase.js";

export default function Panel({ products, setProducts }) {
  const [editing, setEditing] = useState(null);
  // --- Añadir 'descripcion' al estado del formulario ---
  const [form, setForm] = useState({ name: "", brand: "", category: "", price: 0, stock: 0, descripcion: "", is_active: true });
  const [busy, setBusy] = useState(false);

  // Resetea el formulario
  function resetFormAndState() {
    setEditing(null);
    setForm({ name: "", brand: "", category: "", price: 0, stock: 0, descripcion: "", is_active: true });
  }

  // Carga datos al empezar a editar
  function startEdit(p) {
    setEditing(p.id);
    setForm({
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      stock: p.stock,
      descripcion: p.descripcion || "",
      is_active: p.is_active === undefined ? true : p.is_active 
    });
  }

  function cancelEdit() {
    resetFormAndState();
  }

  // Guarda el producto
  async function saveProduct() {
    // Validaciones
    if (!form.name || !form.category || !form.brand) return alert("Completá nombre, marca y categoría");
    if (form.price <= 0) return alert("Precio inválido");
    if (form.stock < 0) return alert("Stock inválido");
    // Nota: No validamos descripción vacía, puede ser opcional

    setBusy(true);
    try {
      const payload = {
        id: editing || uid("prd"),
        name: form.name,
        brand: form.brand,
        category: form.category,
        price: form.price,
        stock: form.stock,
        descripcion: form.descripcion, // Incluir descripcion en el payload
        is_active: form.is_active, // Incluir is_active en el payload
        img: editing ? products.find(p => p.id === editing)?.img || "" : "", // Mantiene img si editaba
      };

      await productsApi.save(payload); // Llama a la API que usa toDBProduct (que debería incluir descripcion)
      const fresh = await productsApi.all(); // Recarga productos
      setProducts(fresh);
      resetFormAndState(); // Limpia formulario

    } catch (e) {
      console.error("Error al guardar el producto:", e);
      alert("No pude guardar el producto en la base: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  // Elimina un producto
  async function deleteProduct(id) {
    if (!confirm("¿Eliminar producto permanentemente?")) return;
    setBusy(true);
    try {
      await productsApi.remove(id);
      const fresh = await productsApi.all();
      setProducts(fresh);
      if (editing === id) cancelEdit();
    } catch (e) {
      console.error("Error al eliminar el producto:", e);
      alert("No pude eliminar el producto: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* --- Tabla de Productos (sin cambios visuales) --- */}
      <div className="lg:col-span-2">
        <h3 className="mb-3 text-lg font-semibold">Productos</h3>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-neutral-50 text-neutral-600">
               <tr>
                <th className="p-2 text-left font-medium">Nombre</th>
                <th className="p-2 text-left font-medium">Marca</th>
                <th className="p-2 text-left font-medium">Categoría</th>
                <th className="p-2 text-right font-medium">Precio</th>
                <th className="p-2 text-right font-medium">Stock</th>
                <th className="p-2 text-center font-medium">Estado</th> {/* Nueva Columna Estado */}
                <th className="p-2 text-right font-medium">Acciones</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.brand}</td>
                  <td className="p-2">{p.category}</td>
                  <td className="p-2 text-right">{toARS(p.price)}</td>
                  <td className="p-2 text-right">{p.stock}</td>
                  {/* Mostrar Estado Activo/Inactivo */}
                  <td className="p-2 text-center">
                    {p.is_active === false ? <span title="Inactivo"><EyeOff className="h-4 w-4 text-red-500 inline"/></span>
                     : <span title="Activo"><Eye className="h-4 w-4 text-emerald-500 inline"/></span>
                    }
                  </td>
                  <td className="p-2 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(p)} className="rounded-lg border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50" disabled={busy}>
                      <Edit3 className="mr-1 inline h-3 w-3" /> Editar
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="ml-2 rounded-lg border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50" disabled={busy}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td className="p-4 text-center text-neutral-500" colSpan={7}>No hay productos cargados.</td></tr> 
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Formulario de Producto --- */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">{editing ? "Editar producto" : "Nuevo producto"}</h3>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <TextField label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Marca" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
            <TextField label="Categoría" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Precio" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
            <NumberField label="Stock" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
          </div>

          {/* --- NUEVO: Campo Descripción --- */}
          <div>
            <label className="block text-sm">
                <div className="mb-1 text-neutral-600">Descripción</div>
                <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Detalles del producto..."
                    rows={3} // Ajusta la altura inicial
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10 text-sm"
                />
            </label>
          </div>
          {/* --- FIN NUEVO CAMPO --- */}
          <div className="flex items-center pt-2">
              <input id="is_active" type="checkbox" checked={form.is_active}
                     onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                     className="form-checkbox h-4 w-4 text-emerald-600 rounded border-neutral-300 focus:ring-offset-0 focus:ring-emerald-500 cursor-pointer"/>
              <label htmlFor="is_active" className="ml-2 block text-sm text-neutral-700 cursor-pointer select-none">Producto activo (visible en catálogo)</label>
          </div>
          {/* Botones Guardar/Cancelar */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
            {editing && (
              <button type="button" onClick={cancelEdit} className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 disabled:opacity-50" disabled={busy}>
                Cancelar
              </button>
            )}
            <button type="button" onClick={saveProduct} className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-50" disabled={busy}>
              <Save className="mr-1 inline h-4 w-4" />
              {busy ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}