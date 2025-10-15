import React, { useEffect, useMemo, useState } from "react";
import { ShoppingCart, LogIn, LogOut, Package, Truck, CheckCircle2, Settings, Plus, Minus, Trash2, Filter, BarChart3, User, RefreshCcw, Edit3, Save, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { LS_KEYS, ORDER_STATUSES, uid, toARS } from "../utils/utils.js";

 
export default function StatusChanger({ status, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {ORDER_STATUSES.map((s) => (
        <button key={s} onClick={() => onChange(s)}
          className={`rounded-full px-2 py-1 text-xs ${s === status ? "bg-neutral-900 text-white" : "bg-neutral-100 hover:bg-neutral-200"}`}>{s}</button>
      ))}
    </div>
  );
}