import React, { useState } from "react";
import { ShoppingCart, LogIn, LogOut, Package, RefreshCcw, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header({ currentUser, users, onLogin, onLogout, cartCount, onOpenCart, onOpenNotifications, onResetDemo }) {
  const [openLogin, setOpenLogin] = useState(false);
  return (
    <div className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white grid place-content-center font-bold">JR</div>
          <div>
            <h1 className="text-lg font-semibold">Corralón JR</h1>
            <p className="text-xs text-neutral-500">Lo necesario para tu construccion</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="relative rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2" onClick={onOpenCart} title="Carrito">
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden sm:inline">Carrito</span>
            {cartCount > 0 && <span className="ml-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">{cartCount}</span>}
          </button>

          {currentUser && (
            <button className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2" onClick={onOpenNotifications} title="Notificaciones">
              <Package className="h-5 w-5" />
              <span className="hidden sm:inline">Avisos</span>
            </button>
          )}

          <div className="h-6 w-px bg-neutral-200 mx-1 hidden sm:block" />

          {!currentUser ? (
            <button className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800 flex items-center gap-2" onClick={() => setOpenLogin(true)}>
              <LogIn className="h-5 w-5" /> Ingresar
            </button>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs sm:text-sm text-neutral-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{currentUser.name}</span>
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] uppercase tracking-wide">{currentUser.role}</span>
              </div>
              <button className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2" onClick={onLogout}>
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          )}

          <button className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2" onClick={onResetDemo} title="Recargar BD">
            <RefreshCcw className="h-5 w-5" />
            <span className="hidden sm:inline">Recargar</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {openLogin && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4" onClick={() => setOpenLogin(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="mb-4 flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Inicia sesión</h2>
              </div>
              <p className="text-sm text-neutral-600 mb-4">Elegí un usuario</p>
              <div className="space-y-2">
                {users.map(u => (
                  <button key={u.id} onClick={() => { onLogin(u.id); setOpenLogin(false); }}
                    className="w-full rounded-xl border border-neutral-200 p-3 text-left hover:bg-neutral-50 flex items-center justify-between">
                    <span className="font-medium">{u.name}</span>
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] uppercase tracking-wide">{u.role}</span>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2" onClick={() => setOpenLogin(false)}>
                  <X className="h-4 w-4" /> Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
