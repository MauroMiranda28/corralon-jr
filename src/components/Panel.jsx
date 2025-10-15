import React, { useEffect, useMemo, useState } from "react";
import { ShoppingCart, LogIn, LogOut, Package, Truck, CheckCircle2, Settings, Plus, Minus, Trash2, Filter, BarChart3, User, RefreshCcw, Edit3, Save, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { LS_KEYS, ORDER_STATUSES, uid, toARS } from "../utils/utils.js";
import TextField from "./TextField.jsx";
import NumberField from "./NumberField.jsx";

export default function Panel({ products, setProducts, orders, setOrderStatus, users }) {
  const [editing, setEditing] = useState(null); // id o null
  const [form, setForm] = useState({ name: "", brand: "", category: "", price: 0, stock: 0 });

  function startEdit(p) { setEditing(p.id); setForm({ name: p.name, brand: p.brand, category: p.category, price: p.price, stock: p.stock }); }
  function cancelEdit() { setEditing(null); setForm({ name: "", brand: "", category: "", price: 0, stock: 0 }); }

  function saveProduct() {
    if (!form.name || !form.category || !form.brand) return alert("Completá nombre, marca y categoría");
    if (form.price <= 0) return alert("Precio inválido");
    if (form.stock < 0) return alert("Stock inválido");
    if (editing) {
      setProducts(products.map(p => p.id === editing ? { ...p, ...form } : p));
      cancelEdit();
    } else {
      setProducts([{ id: uid("prd"), img: "", ...form }, ...products]);
      cancelEdit();
    }
  }

  function deleteProduct(id) {
    if (!confirm("¿Eliminar producto?")) return;
    setProducts(products.filter(p => p.id !== id));
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
                    <button onClick={() => startEdit(p)} className="rounded-lg border px-2 py-1 text-xs hover:bg-neutral-50"><Edit3 className="mr-1 inline h-3 w-3"/> Editar</button>
                    <button onClick={() => deleteProduct(p.id)} className="ml-2 rounded-lg border px-2 py-1 text-xs hover:bg-neutral-50 text-red-700">Eliminar</button>
                  </td>
                </tr>
              ))}
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
            {editing && <button onClick={cancelEdit} className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100">Cancelar</button>}
            <button onClick={saveProduct} className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800">
              <Save className="mr-1 inline h-4 w-4"/> Guardar
            </button>
          </div>
        </div>
      
        <h3 className="mb-3 mt-6 text-lg font-semibold">Flujo de pedidos</h3>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          <ol className="list-inside list-decimal space-y-1">
            <li>Cliente crea pedido (pendiente)</li>
            <li>Vendedor cambia a <span className="rounded bg-sky-50 px-1">en preparación</span></li>
            <li>Cuando está listo: <span className="rounded bg-purple-50 px-1">listo</span></li>
            <li>Al entregar: <span className="rounded bg-emerald-50 px-1">entregado</span></li>
          </ol>
          <p className="mt-2">Los cambios notifican automáticamente al cliente.</p>
        </div>
      </div>
      
    </section>
  );
}