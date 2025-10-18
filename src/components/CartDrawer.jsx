import React from "react";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toARS } from "../utils/utils.js";

export default function CartDrawer({ open, onClose, cart, products, changeQty, removeFromCart, total, onConfirm, canSeeStock }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="w-full flex-1 bg-black/30" onClick={onClose} />
          <motion.div initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full w-full max-w-md overflow-auto bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tu carrito</h3>
              <button onClick={onClose} className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100"><X className="h-4 w-4" /></button>
            </div>
            {cart.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-600">No agregaste productos aún.</div>
            ) : (
              <div className="space-y-3">
                {cart.map((it) => {
                  const p = products.find(p => p.id === it.productId);
                  if (!p) return null;
                  return (
                    <div key={it.productId} className="flex items-center justify-between rounded-2xl border border-neutral-200 p-3">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-neutral-500">{toARS(p.price)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => changeQty(it.productId, -1)} className="rounded-lg border px-2 py-1"><Minus className="h-4 w-4" /></button>
                        <span className="min-w-[2ch] text-center">{it.qty}</span>
                        <button onClick={() => changeQty(it.productId, 1)} className="rounded-lg border px-2 py-1"><Plus className="h-4 w-4" /></button>
                        <button onClick={() => removeFromCart(it.productId)} className="rounded-lg border px-2 py-1"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4 font-semibold">
                  <span>Total</span>
                  <span>{toARS(total)}</span>
                </div>
                <button onClick={onConfirm} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700">
                  Confirmar pedido
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
