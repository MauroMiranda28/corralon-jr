import React, { useEffect, useMemo, useState } from "react";
import { ShoppingCart, LogIn, LogOut, Package, Truck, CheckCircle2, Settings, Plus, Minus, Trash2, Filter, BarChart3, User, RefreshCcw, Edit3, Save, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { LS_KEYS, ORDER_STATUSES, uid, toARS } from "../utils/utils.js";


export default function NotificationsDrawer({ open, onClose, items }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="w-full flex-1 bg-black/30" onClick={onClose} />
          <motion.div initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full w-full max-w-md overflow-auto bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notificaciones</h3>
              <button onClick={onClose} className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100"><X className="h-4 w-4" /></button>
            </div>
            {(!items || items.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-600">No tenés avisos.</div>
            ) : (
              <div className="space-y-2">
                {items.map((n) => (
                  <div key={n.id} className="rounded-2xl border border-neutral-200 p-3 text-sm">
                    <div>{n.text}</div>
                    <div className="mt-1 text-xs text-neutral-500">{new Date(n.ts).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}