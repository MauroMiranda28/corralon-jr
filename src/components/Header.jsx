import React, { useState } from "react";
// Keep other imports: ShoppingCart, LogIn, LogOut, User, X, Mail
// Remove Package if it's no longer used anywhere else after this change
import { ShoppingCart, LogIn, LogOut, User, X, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TextField from "./TextField.jsx";

// --- Keep Validation Functions ---
const PHONE_REGEX = /^(?:(?:\+?54)?(?:0?11|[2368]\d{2,3})?)?[1-9]\d{6,7}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,30}$/;

export default function Header({ currentUser, users, onLogin, onLogout, onSignUp, onPasswordResetRequest, cartCount, onOpenCart, onOpenNotifications /* <-- Keep prop for now, though unused */, openLogin, setOpenLogin }) {
  // Keep component state (view, email, password, etc.)
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Keep helper functions (resetForm, handleCloseModal, handleSubmit)
  function resetForm() {
    setEmail(""); setPassword(""); setNombre(""); setApellido(""); setTelefono("");
    setLoading(false); setFormError('');
  }

  function handleCloseModal() {
    setOpenLogin(false); resetForm(); setView("login");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setFormError('');

    if (view === 'register') {
      if (!PHONE_REGEX.test(telefono)) {
        setFormError('El formato del teléfono no es válido. Ingresa prefijo + código de área + número (solo dígitos).');
        return;
      }
      if (password.length > 30) {
          setFormError('La contraseña no puede exceder los 30 caracteres.');
          return;
      }
      if (!PASSWORD_REGEX.test(password)) {
        setFormError('La contraseña debe tener entre 6 y 30 caracteres, incluir al menos una letra y un número, y no contener espacios.');
        return;
      }
      if (!nombre.trim() || !apellido.trim()) {
         setFormError('Nombre y Apellido son obligatorios.');
         return;
      }
    }

    setLoading(true);

    try {
        if (view === "login") {
          await onLogin(email, password);
        } else if (view === "register") {
          await onSignUp(email, password, nombre, apellido, telefono);
        } else { // view === 'reset'
          await onPasswordResetRequest(email);
        }
        handleCloseModal();
    } catch (error) {
        console.error("Submit error:", error)
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* --- Barra de Navegación --- */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
         {/* Logo y Título (sin cambios) */}
         <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white grid place-content-center font-bold">JR</div>
            <div><h1 className="text-lg font-semibold">Corralón JR</h1><p className="text-xs text-neutral-500">Lo necesario para tu construccion</p></div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2"> {/* Botones Derecha */}
            {/* Carrito (sin cambios) */}
            <button className="relative rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2" onClick={onOpenCart} title="Carrito">
                <ShoppingCart className="h-5 w-5" /><span className="hidden sm:inline">Carrito</span>
                {cartCount > 0 && <span className="ml-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">{cartCount}</span>}
            </button>

            {/* --- ELIMINAR O COMENTAR ESTE BLOQUE --- */}
            {/* {currentUser && (<button className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2" onClick={onOpenNotifications} title="Notificaciones"> <Package className="h-5 w-5" /><span className="hidden sm:inline">Avisos</span></button>)} */}
            {/* --- FIN DEL BLOQUE ELIMINADO --- */}

            <div className="h-6 w-px bg-neutral-200 mx-1 hidden sm:block" /> {/* Separador */}
            {/* Ingresar / User+Salir (sin cambios) */}
            {!currentUser ? (<button className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800 flex items-center gap-2" onClick={() => setOpenLogin(true)}><LogIn className="h-5 w-5" /> Ingresar</button>)
            : (<div className="flex items-center gap-1 sm:gap-2"> <div className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs sm:text-sm text-neutral-700 flex items-center gap-2"><User className="h-4 w-4" /><span className="font-medium">{currentUser.name} {currentUser.apellido || ''}</span><span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] uppercase tracking-wide">{currentUser.role}</span></div> <button className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2" onClick={onLogout}><LogOut className="h-5 w-5" /><span className="hidden sm:inline">Salir</span></button></div>)}
          </div>
      </div>

      {/* --- MODAL LOGIN / REGISTRO / RESETEO (sin cambios) --- */}
      <AnimatePresence>
        {openLogin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4" onClick={handleCloseModal}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-2"> <LogIn className="h-5 w-5" /> <h2 className="text-lg font-semibold">{view === 'login' ? 'Inicia sesión' : view === 'register' ? 'Crea tu cuenta' : 'Restablecer Contraseña'}</h2></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {view === 'register' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                       <TextField label="Nombre" value={nombre} onChange={setNombre} placeholder="Tu nombre" required />
                       <TextField label="Apellido" value={apellido} onChange={setApellido} placeholder="Tu apellido" required />
                    </div>
                    <TextField label="Teléfono" value={telefono} onChange={setTelefono} placeholder="Ej: 3851234567" type="tel" required />
                  </>
                )}
                <TextField label="Email" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" required />
                {(view === 'login' || view === 'register') && (
                  <div>
                    <label className="block text-sm">
                      <div className="mb-1 text-neutral-600">Contraseña</div>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={view === 'register' ? "6-30 chars, letra y número" : "••••••••"} className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10" minLength={6} maxLength={30} required />
                    </label>
                    {view === 'login' && (<div className="mt-1 text-right"><button type="button" onClick={() => { setView('reset'); resetForm(); }} className="text-xs text-emerald-600 hover:underline" disabled={loading}> ¿Olvidaste tu contraseña? </button></div>)}
                  </div>
                )}
                {view === 'reset' && (<p className="text-sm text-neutral-600"> Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña. </p>)}
                {formError && ( <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{formError}</p> )}
                <div className="mt-6 flex items-center justify-between gap-2 pt-4 border-t border-neutral-100">
                  <div> {view === 'login' ? ( <button type="button" onClick={() => { setView('register'); resetForm(); }} className="text-sm text-emerald-600 hover:underline" disabled={loading}> ¿No tenés cuenta? Registrate </button> ) : view === 'register' ? ( <button type="button" onClick={() => { setView('login'); resetForm(); }} className="text-sm text-emerald-600 hover:underline" disabled={loading}> ¿Ya tenés cuenta? Ingresá </button> ) : ( <button type="button" onClick={() => { setView('login'); resetForm(); }} className="text-sm text-emerald-600 hover:underline" disabled={loading}> Volver a Iniciar Sesión </button> )}</div>
                  <div className="flex gap-2">
                    <button type="button" className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2" onClick={handleCloseModal} disabled={loading}><X className="h-4 w-4" /> Cerrar</button>
                    <button type="submit" className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800 flex items-center gap-2 disabled:opacity-50"
                      disabled={loading || !email || (view !== 'reset' && !password) || (view === 'register' && (!nombre || !apellido || !telefono))}>
                      {view === 'login' ? <LogIn className="h-4 w-4" /> : view === 'register' ? <User className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                      {view === 'login' ? (loading ? "Ingresando..." : "Ingresar") : view === 'register' ? (loading ? "Registrando..." : "Registrarse") : (loading ? "Enviando..." : "Enviar Enlace")}
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