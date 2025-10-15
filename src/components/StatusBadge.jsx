import React, { useEffect, useMemo, useState } from "react";
import { ShoppingCart, LogIn, LogOut, Package, Truck, CheckCircle2, Settings, Plus, Minus, Trash2, Filter, BarChart3, User, RefreshCcw, Edit3, Save, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { LS_KEYS, ORDER_STATUSES, uid, toARS } from "../utils/utils.js";


export default function StatusBadge({ status }) {
  const color = {
    "pendiente": "bg-amber-50 text-amber-700",
    "en preparación": "bg-sky-50 text-sky-700",
    "listo": "bg-purple-50 text-purple-700",
    "entregado": "bg-emerald-50 text-emerald-700",
  }[status] || "bg-neutral-100 text-neutral-700";
  const Icon = {
    "pendiente": Package,
    "en preparación": Settings,
    "listo": Truck,
    "entregado": CheckCircle2,
  }[status] || Package;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${color}`}><Icon className="h-4 w-4" /> {status}</span>;
}
