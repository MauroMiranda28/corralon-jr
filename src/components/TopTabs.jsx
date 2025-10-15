import React, { useEffect, useMemo, useState } from "react";
import { ShoppingCart, LogIn, LogOut, Package, Truck, CheckCircle2, Settings, Plus, Minus, Trash2, Filter, BarChart3, User, RefreshCcw, Edit3, Save, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { LS_KEYS, ORDER_STATUSES, uid, toARS } from "../utils/utils.js";


export default function TopTabs({ tab, setTab, currentUser }) {
  const tabs = [
    { key: "catalogo", label: "Catálogo" },
    { key: "pedidos", label: "Pedidos" },
  ];
  if (currentUser?.role === "vendedor" || currentUser?.role === "admin") tabs.push({ key: "panel", label: "Panel" });
  if (currentUser && currentUser.role !== "cliente") tabs.push({ key: "reportes", label: "Reportes" });

  return (
    <div className="sticky top-[57px] z-20 -mx-4 border-b border-neutral-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm transition ${tab === t.key ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}