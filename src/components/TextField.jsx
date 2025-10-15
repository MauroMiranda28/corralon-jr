import React, { useEffect, useMemo, useState } from "react";
import { ShoppingCart, LogIn, LogOut, Package, Truck, CheckCircle2, Settings, Plus, Minus, Trash2, Filter, BarChart3, User, RefreshCcw, Edit3, Save, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { LS_KEYS, ORDER_STATUSES, uid, toARS } from "../utils/utils.js";


export default function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-neutral-600">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10" />
    </label>
  );
}