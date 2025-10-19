import React, { useState } from "react";
import { ShoppingCart, LogIn, LogOut, Package, RefreshCcw, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TextField from "./TextField.jsx";

export default function Header({ currentUser, users, onLogin, onLogout, onSignUp, cartCount, onOpenCart, onOpenNotifications }) {
  const [openLogin, setOpenLogin] = useState(false);

  // --- ESTADO DEL MODAL ---
  const [view, setView] = useState("login"); // 'login' o 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState(""); // <--- Nuevo campo para registro
  const [loading, setLoading] = useState(false);

  // Limpiar formulario al cambiar de vista o cerrar
  function resetForm() {
    setEmail("");
    setPassword("");
    setNombre("");
    setLoading(false);
  }

  function handleCloseModal() {
    setOpenLogin(false);
    resetForm();
    setView("login"); // Resetea a login al cerrar
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    if (view === "login") {
      await onLogin(email, password);
    } else {
      // Estamos en registro
      await onSignUp(email, password, nombre); // <--- Llamamos a la nueva función
    }
    
    setLoading(false);
    // Asumimos que la función de App (onLogin/onSignUp) maneja
    // los errores con un alert(), y cerramos el modal.
    handleCloseModal(); 
  }

  return (
    <div className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* ... (Logo y Título - sin cambios) ... */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white grid place-content-center font-bold">JR</div>
          <div>
            <h1 className="text-lg font-semibold">Corralón JR</h1>
            <p className="text-xs text-neutral-500">Lo necesario para tu construccion</p>
          </div>
        </div>

        {/* ... (Botones de la derecha - sin cambios en su lógica) ... */}
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
          
          {/* El botón de recargar ya no está */}
        </div>
      </div>

      {/* --- MODAL DE LOGIN / REGISTRO --- */}
      <AnimatePresence>
        {openLogin && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4" onClick={handleCloseModal}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="mb-4 flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  {view === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
                </h2>
              </div>
              
              {/* --- FORMULARIO (LOGIN O REGISTRO) --- */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Campo de Nombre (solo en registro) */}
                {view === 'register' && (
                  <TextField 
                    label="Nombre Completo" 
                    value={nombre} 
                    onChange={setNombre} 
                    placeholder="Tu nombre"
                  />
                )}

                <TextField 
                  label="Email" 
                  value={email} 
                  onChange={setEmail} 
                  placeholder="tu@correo.com"
                />
                <div>
                  <label className="block text-sm">
                    <div className="mb-1 text-neutral-600">Contraseña</div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••••• (mín. 6 caracteres)"
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10"
                    />
                  </label>
                </div>

                <div className="mt-6 flex items-center justify-between gap-2">
                  {/* Botón para cambiar de vista */}
                  <div>
                    {view === 'login' ? (
                      <button 
                        type="button" 
                        onClick={() => { setView('register'); resetForm(); }}
                        className="text-sm text-emerald-600 hover:underline"
                        disabled={loading}
                      >
                        ¿No tenés cuenta? Registrate
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => { setView('login'); resetForm(); }}
                        className="text-sm text-emerald-600 hover:underline"
                        disabled={loading}
                      >
                        ¿Ya tenés cuenta? Ingresá
                      </button>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2" 
                      onClick={handleCloseModal}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" /> Cerrar
                    </button>
                    <button 
                      type="submit" 
                      className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800 flex items-center gap-2 disabled:opacity-50"
                      disabled={loading || (view === 'register' && (!nombre || !email || !password))}
                    >
                      <LogIn className="h-4 w-4" /> 
                      {view === 'login' 
                        ? (loading ? "Ingresando..." : "Ingresar")
                        : (loading ? "Registrando..." : "Registrarse")
                      }
                    </button>
                  </div>
                </div>
              </form>
              
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}