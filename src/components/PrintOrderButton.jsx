import React, { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toARS } from "../utils/utils.js";

export default function PrintOrderButton({ order, products, user }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50">Resumen para facturación</button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Resumen de Pedido</h3>
                <button onClick={() => window.print()} className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800">Imprimir / PDF</button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">Cliente</div>
                  <div className="text-sm">{user?.name}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">Pedido</div>
                  <div className="text-sm font-mono">{order.id}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">Fecha</div>
                  <div className="text-sm">{new Date(order.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-neutral-200">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="p-2 text-left">Producto</th>
                      <th className="p-2 text-right">Cant.</th>
                      <th className="p-2 text-right">Precio</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((it, idx) => {
                      const p = products.find(x => x.id === it.productId);
                      return (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{p?.name || it.productId}</td>
                          <td className="p-2 text-right">{it.qty}</td>
                          <td className="p-2 text-right">{toARS(it.price)}</td>
                          <td className="p-2 text-right">{toARS(it.price * it.qty)}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t font-semibold">
                      <td className="p-2 text-right" colSpan={3}>Total</td>
                      <td className="p-2 text-right">{toARS(order.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2"><X className="h-4 w-4"/> Cerrar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
