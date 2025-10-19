import React, { useState } from "react";
import { Edit3, Save } from "lucide-react";
import TextField from "./TextField.jsx";
import NumberField from "./NumberField.jsx";
import { toARS, uid } from "../utils/utils.js";
import { productsApi } from "../services/products.supabase.js";

export default function Panel({ products, setProducts /*, orders, setOrderStatus, users */ }) {
  const [editing, setEditing] = useState(null); // id o null
  const [form, setForm] = useState({ name: "", brand: "", category: "", price: 0, stock: 0 });
  const [busy, setBusy] = useState(false);

  function startEdit(p) {
    setEditing(p.id);
    setForm({ name: p.name, brand: p.brand, category: p.category, price: p.price, stock: p.stock });
  }
  function cancelEdit() {
    setEditing(null);
    setForm({ name: "", brand: "", category: "", price: 0, stock: 0 });
  }

  async function saveProduct() {
    if (!form.name || !form.category || !form.brand) return alert("Completá nombre, marca y categoría");
    if (form.price <= 0) return alert("Precio inválido");
    if (form.stock < 0) return alert("Stock inválido");

    try {
      setBusy(true);
      const payload = editing
        ? { id: editing, ...form }
        : { id: uid("prd"), img: "", ...form };

      await productsApi.save(payload);               // upsert en Supabase
      const fresh = await productsApi.all();         // refrescar grilla
      setProducts(fresh);

      cancelEdit();
    } catch (e) {
      console.error(e);
      alert("No pude guardar el producto en la base");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(id) {
    if (!confirm("¿Eliminar producto?")) return;
    try {
      setBusy(true);
      await productsApi.remove(id);
      const fresh = await productsApi.all();
      setProducts(fresh);
      if (editing === id) cancelEdit();
    } catch (e) {
      console.error(e);
      alert("No pude eliminar el producto en la base");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h3 className="mb-3 text-lg font-semibold">Productos</h3>
        <div className="overflow-hidden rounded-2xl border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">Marca</th>
                <th className="p-2 text-left">Categoría</th>
                <th className="p-2 text-right">Precio</th>
                <th className="p-2 text-right">Stock</th>
                <th className="p-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.brand}</td>
                  <td className="p-2">{p.category}</td>
                  <td className="p-2 text-right">{toARS(p.price)}</td>
                  <td className="p-2 text-right">{p.stock}</td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => startEdit(p)}
                      className="rounded-lg border px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
                      disabled={busy}
                    >
                      <Edit3 className="mr-1 inline h-3 w-3" /> Editar
                    </button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="ml-2 rounded-lg border px-2 py-1 text-xs text-red-700 hover:bg-neutral-50 disabled:opacity-50"
                      disabled={busy}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-neutral-500" colSpan={6}>
                    No hay productos cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">{editing ? "Editar producto" : "Nuevo producto"}</h3>
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <TextField label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Marca" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
            <TextField label="Categoría" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Precio" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
            <NumberField label="Stock" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
          </div>
          <div className="flex items-center justify-end gap-2">
            {editing && (
              <button
                onClick={cancelEdit}
                className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 disabled:opacity-50"
                disabled={busy}
              >
                Cancelar
              </button>
            )}
            <button
              onClick={saveProduct}
              className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-50"
              disabled={busy}
            >
              <Save className="mr-1 inline h-4 w-4" /> {busy ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
