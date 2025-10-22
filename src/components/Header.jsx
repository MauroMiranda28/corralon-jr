import React, { useState } from "react";
import { ShoppingCart, LogIn, LogOut, Package, User, X, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TextField from "./TextField.jsx";

// --- Funciones de Validación ---
// Simple regex para validar formato de teléfono argentino (prefijo opcional + area + número)
// Ajusta este regex si necesitas ser más específico con prefijos/áreas válidas
const PHONE_REGEX = /^(?:(?:\+?54)?(?:0?11|[2368]\d{2,3})?)?[1-9]\d{6,7}$/;
// Regex para contraseña: mín 6, máx 30, al menos una letra, al menos un número, sin espacios.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,30}$/;

export default function Header({ currentUser, users, onLogin, onLogout, onSignUp, onPasswordResetRequest, cartCount, onOpenCart, onOpenNotifications, openLogin, setOpenLogin }) {
  // const [openLogin, setOpenLogin] = useState(false);

  // Estados del modal
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  // Nuevo estado para errores de validación del formulario
  const [formError, setFormError] = useState('');

  function resetForm() {
    setEmail(""); setPassword(""); setNombre(""); setApellido(""); setTelefono("");
    setLoading(false); setFormError(''); // Limpiar error de formulario
  }

  function handleCloseModal() {
    setOpenLogin(false); resetForm(); setView("login");
  }

  // --- MODIFICADO: handleSubmit con validaciones ---
  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setFormError(''); // Limpiar errores previos

    // --- Validaciones para Registro ---
    if (view === 'register') {
      // Validar teléfono
      if (!PHONE_REGEX.test(telefono)) {
        setFormError('El formato del teléfono no es válido. Ingresa prefijo + código de área + número (solo dígitos).');
        return; // Detiene el envío
      }
      // Validar contraseña
      if (password.length > 30) {
          setFormError('La contraseña no puede exceder los 30 caracteres.');
          return;
      }
      if (!PASSWORD_REGEX.test(password)) {
        setFormError('La contraseña debe tener entre 6 y 30 caracteres, incluir al menos una letra y un número, y no contener espacios.');
        return; // Detiene el envío
      }
      // Validar nombre/apellido (simple: no vacíos)
      if (!nombre.trim() || !apellido.trim()) {
         setFormError('Nombre y Apellido son obligatorios.');
         return;
      }
    }
    // --- Fin Validaciones ---

    setLoading(true); // Inicia carga después de validar

    try { // Usar try/finally para asegurar setLoading(false)
        if (view === "login") {
          await onLogin(email, password);
        } else if (view === "register") {
          await onSignUp(email, password, nombre, apellido, telefono);
        } else { // view === 'reset'
          await onPasswordResetRequest(email);
        }
        handleCloseModal(); // Cierra solo si la operación fue exitosa (sin error)
    } catch (error) {
        // Los errores de Supabase (ej: email ya existe) ya se muestran con alert en App.jsx
        // Si quisiéramos mostrarlos aquí, necesitaríamos que onLogin/onSignUp devuelvan el error
        console.error("Submit error:", error)
        // Podríamos poner un setFormError genérico si la llamada falla por otra razón
        // setFormError("Ocurrió un error inesperado.");
    } finally {
        setLoading(false); // Termina carga
    }
  }
  // --- FIN MODIFICACIÓN ---

  return (
    <div className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* --- Barra de Navegación (sin cambios) --- */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
         {/* ... (Logo, Título, Botones) ... */}
         <div className="flex items-center gap-3"> {/* Logo y Título */}
            <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white grid place-content-center font-bold">JR</div>
            <div><h1 className="text-lg font-semibold">Corralón JR</h1><p className="text-xs text-neutral-500">Lo necesario para tu construccion</p></div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2"> {/* Botones Derecha */}
            {/* Carrito */}
            <button className="relative rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2" onClick={onOpenCart} title="Carrito">
                <ShoppingCart className="h-5 w-5" /><span className="hidden sm:inline">Carrito</span>
                {cartCount > 0 && <span className="ml-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">{cartCount}</span>}
            </button>
            {/* Avisos */}
            {currentUser && (<button className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2" onClick={onOpenNotifications} title="Notificaciones"> <Package className="h-5 w-5" /><span className="hidden sm:inline">Avisos</span></button>)}
            <div className="h-6 w-px bg-neutral-200 mx-1 hidden sm:block" /> {/* Separador */}
            {/* Ingresar / User+Salir */}
            {!currentUser ? (<button className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800 flex items-center gap-2" onClick={() => setOpenLogin(true)}><LogIn className="h-5 w-5" /> Ingresar</button>)
            : (<div className="flex items-center gap-1 sm:gap-2"> {/* Info User */} <div className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs sm:text-sm text-neutral-700 flex items-center gap-2"><User className="h-4 w-4" /><span className="font-medium">{currentUser.name} {currentUser.apellido || ''}</span><span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] uppercase tracking-wide">{currentUser.role}</span></div> {/* Botón Salir */} <button className="rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2" onClick={onLogout}><LogOut className="h-5 w-5" /><span className="hidden sm:inline">Salir</span></button></div>)}
          </div>
      </div>

      {/* --- MODAL LOGIN / REGISTRO / RESETEO --- */}
      <AnimatePresence>
        {openLogin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4" onClick={handleCloseModal}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-2"> <LogIn className="h-5 w-5" /> <h2 className="text-lg font-semibold">{view === 'login' ? 'Inicia sesión' : view === 'register' ? 'Crea tu cuenta' : 'Restablecer Contraseña'}</h2></div>

              {/* --- FORMULARIO --- */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campos Registro */}
                {view === 'register' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                       <TextField label="Nombre" value={nombre} onChange={setNombre} placeholder="Tu nombre" required />
                       <TextField label="Apellido" value={apellido} onChange={setApellido} placeholder="Tu apellido" required />
                    </div>
                    {/* Input Teléfono con pattern opcional */}
                    <TextField label="Teléfono" value={telefono} onChange={setTelefono} placeholder="Ej: 3851234567" type="tel" required
                      // Opcional: añadir pattern para guiar al usuario, aunque validamos con JS
                      // pattern="^\+?[0-9]{10,15}$"
                     />
                  </>
                )}
                {/* Email */}
                <TextField label="Email" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" required />
                {/* Contraseña */}
                {(view === 'login' || view === 'register') && (
                  <div>
                    <label className="block text-sm">
                      <div className="mb-1 text-neutral-600">Contraseña</div>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={view === 'register' ? "6-30 chars, letra y número" : "••••••••"} className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10" minLength={6} maxLength={30} required />
                    </label>
                    {view === 'login' && (<div className="mt-1 text-right"><button type="button" onClick={() => { setView('reset'); resetForm(); }} className="text-xs text-emerald-600 hover:underline" disabled={loading}> ¿Olvidaste tu contraseña? </button></div>)}
                  </div>
                )}
                {/* Mensaje Reseteo */}
                {view === 'reset' && (<p className="text-sm text-neutral-600"> Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña. </p>)}

                {/* --- Mostrar Error de Formulario --- */}
                {formError && (
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{formError}</p>
                )}
                {/* --- Fin Mostrar Error --- */}

                {/* Botones Inferiores */}
                <div className="mt-6 flex items-center justify-between gap-2 pt-4 border-t border-neutral-100">
                  {/* Cambiar vista */}
                  <div> {view === 'login' ? ( <button type="button" onClick={() => { setView('register'); resetForm(); }} className="text-sm text-emerald-600 hover:underline" disabled={loading}> ¿No tenés cuenta? Registrate </button> ) : view === 'register' ? ( <button type="button" onClick={() => { setView('login'); resetForm(); }} className="text-sm text-emerald-600 hover:underline" disabled={loading}> ¿Ya tenés cuenta? Ingresá </button> ) : ( <button type="button" onClick={() => { setView('login'); resetForm(); }} className="text-sm text-emerald-600 hover:underline" disabled={loading}> Volver a Iniciar Sesión </button> )}</div>
                  {/* Acciones */}
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