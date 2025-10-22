import React, { useState, useEffect } from "react";
import { Minus, Plus, Trash2, X, Home, Store } from "lucide-react"; // Añadir iconos
import { motion, AnimatePresence } from "framer-motion";
import { toARS } from "../utils/utils.js"; // Importa la función de formato
import TextField from "./TextField"; // Importar TextField
import axios from 'axios'; // Importa axios para llamadas HTTP
import { loadMercadoPago } from "@mercadopago/sdk-js"; // Importa el SDK JS de MercadoPago

export default function CartDrawer({
  open,
  onClose,
  cart,
  products,
  changeQty,
  removeFromCart,
  total, // Este 'total' es el subtotal de los productos
  onConfirm, // Mantenemos onConfirm por si se usa para otras cosas post-pago, pero la lógica principal cambia
  canSeeStock,
  savedAddress,
  shippingCostBase, // Costo base de envío
  currentUser, // Necesario para saber si está logueado
  // Ya no se necesita onConfirm como antes, pero puede usarse para lógica post-pago
}) {
  // --- Estados para Entrega y Dirección ---
  const [deliveryMethod, setDeliveryMethod] = useState('retiro'); // 'retiro' o 'domicilio'
  const [address, setAddress] = useState({ ciudad: '', calle: '', numero: '', referencia: '' });
  const [receiver, setReceiver] = useState({ recibeNombre: '', recibeApellido: '', recibeDni: ''}); // Datos de quién recibe
  const [saveAddress, setSaveAddress] = useState(false);
  const [formError, setFormError] = useState(''); // Errores locales del form
  const [isConfirming, setIsConfirming] = useState(false); // Estado para deshabilitar botón mientras se crea preferencia
  const [preferenceId, setPreferenceId] = useState(null); // Estado para guardar el ID de preferencia de MP

  // Efecto para pre-rellenar la dirección del domicilio si existe una guardada
  useEffect(() => {
    if (deliveryMethod === 'domicilio' && savedAddress && (savedAddress.ciudad || savedAddress.calle)) {
      setAddress({
        ciudad: savedAddress.ciudad || '',
        calle: savedAddress.calle || '',
        numero: savedAddress.numero || '',
        referencia: savedAddress.referencia || '',
      });
      setSaveAddress(true); // Marca el checkbox si precarga
    } else if (deliveryMethod === 'retiro') {
        // Limpia la dirección si cambia a retiro
        setAddress({ ciudad: '', calle: '', numero: '', referencia: '' });
        setReceiver({ recibeNombre: '', recibeApellido: '', recibeDni: ''});
        setSaveAddress(false);
    }
  }, [deliveryMethod, savedAddress]);

  // Efecto para cargar el SDK de MercadoPago
  useEffect(() => {
    if (open) { // Carga el SDK solo cuando el drawer está abierto
        // Carga el SDK de MercadoPago usando tu PUBLIC KEY de las variables de entorno
        // Asegúrate de tener VITE_MP_PUBLIC_KEY en tu archivo .env
        const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
        if (publicKey) {
            loadMercadoPago();
        } else {
            console.error("Error: VITE_MP_PUBLIC_KEY no está definida en las variables de entorno.");
            setFormError("Error de configuración de pago. Contacta al soporte.");
        }
    }
  }, [open]); // Depende de 'open' para recargar si se cierra y abre

  // Efecto para limpiar preferencia si el carrito cambia o se cierra el drawer
  useEffect(() => {
    if (!open || cart.length === 0) {
      setPreferenceId(null);
      // Limpia también el contenedor del botón si existe
      const container = document.getElementById('wallet_container');
      if (container) {
          container.innerHTML = '';
      }
    }
  }, [open, cart]);

  // Manejar cambio en los inputs de dirección del domicilio
  const handleAddressChange = (field, value) => { setAddress(prev => ({ ...prev, [field]: value })); setFormError(''); };
  // Manejar cambio en los inputs de quién recibe
  const handleReceiverChange = (field, value) => { setReceiver(prev => ({ ...prev, [field]: value })); setFormError(''); };

  // Manejar cambio de método de entrega
  const handleMethodChange = (method) => {
    setDeliveryMethod(method); setFormError(''); setPreferenceId(null); // Limpia preferencia al cambiar método
    const container = document.getElementById('wallet_container');
    if (container) container.innerHTML = ''; // Limpia botón MP

    if (method === 'retiro') {
      // No necesita dirección, limpia estados relacionados
      setAddress({ ciudad: '', calle: '', numero: '', referencia: '' });
      setReceiver({ recibeNombre: '', recibeApellido: '', recibeDni: ''});
      setSaveAddress(false);
    } else { // 'domicilio'
      // El useEffect se encargará de pre-rellenar si hay dirección guardada
       if (savedAddress && (savedAddress.ciudad || savedAddress.calle)) {
          setSaveAddress(true);
       } else {
          setSaveAddress(false);
       }
    }
  };

  // Calcula el costo de envío
  const shippingCost = deliveryMethod === 'domicilio' ? shippingCostBase : 0;
  // Calcula el total final a pagar
  const finalTotal = total + shippingCost;

  // --- MODIFICADO: Función para llamar al backend y crear la preferencia ---
  const handleConfirmClick = async () => {
    setFormError('');
    setIsConfirming(true); // Inicia estado de carga
    setPreferenceId(null); // Limpia preferencia anterior

    // --- Validaciones ---
    if (!currentUser) {
        setFormError("Debes iniciar sesión para realizar un pedido.");
        setIsConfirming(false);
        // Aquí podrías llamar a una función para abrir el modal de login
        onClose(); // Cierra el carrito
        // Idealmente, App.jsx debería manejar la apertura del login modal
        return;
    }
    if (cart.length === 0) {
        setFormError("Tu carrito está vacío.");
        setIsConfirming(false);
        return;
    }
    // Validación de campos de domicilio (si aplica)
    if (deliveryMethod === 'domicilio' && ( !address.ciudad?.trim() || !address.calle?.trim() || !address.numero?.trim() || !receiver.recibeNombre?.trim() || !receiver.recibeApellido?.trim() || !receiver.recibeDni?.trim() )) {
      setFormError("Completa todos los campos obligatorios (*) de dirección y quién recibe.");
      const errorElement = document.getElementById('cart-error-message');
      if (errorElement) errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsConfirming(false); // Termina estado de carga
      return;
    }
     // Validación de stock (importante hacerla ANTES de llamar a MP)
     for (const it of cart) {
         const p = products.find(prod => prod.id === it.productId);
         if (!p || p.stock < it.qty) {
             setFormError(`Stock insuficiente para: ${p?.name || it.productId}. Máximo: ${p?.stock || 0}.`);
             setIsConfirming(false);
             return; // Detiene el proceso
         }
     }

    // 1. Prepara los datos para el backend
    // Genera un ID único para esta orden potencial AHORA. Lo usarás como external_reference.
    const potentialOrderId = `CJR_${Date.now()}_${currentUser.id.slice(-4)}`;

    const backendPayload = {
      orderId: potentialOrderId, // Envía el ID generado
      items: cart.map(cartItem => {
        const product = products.find(p => p.id === cartItem.productId);
        return {
          productId: cartItem.productId,
          name: product?.name || 'Producto desconocido',
          qty: cartItem.qty,
          price: product?.price || 0
        };
      }),
      shippingCost: shippingCost // Envía el costo de envío calculado
    };

    try {
      // 2. Llama a tu backend para crear la preferencia
      console.log("Enviando a backend:", backendPayload);
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
          throw new Error("La URL del API no está configurada.");
      }

      const response = await axios.post(
        `${apiUrl}/crear-preferencia`, // Usa la variable de entorno
        backendPayload
      );

      const { preferenceId: receivedPreferenceId } = response.data;
      console.log("Preferencia recibida:", receivedPreferenceId);

      if (receivedPreferenceId) {
         setPreferenceId(receivedPreferenceId); // Guarda el ID de preferencia

         // --- Renderiza el botón de pago ---
         // Pequeño delay para asegurar que el estado se actualice antes de renderizar
         setTimeout(() => renderCheckoutButton(receivedPreferenceId), 50);

         // NOTA: La orden en TU base de datos (Supabase) NO se crea aquí.
         // Se debería crear/confirmar cuando MercadoPago notifique el pago exitoso (webhook).
         // Podrías crearla con estado "pendiente_pago" aquí si quieres,
         // pero lo ideal es esperar la confirmación.

      } else {
        throw new Error('No se recibió el ID de preferencia del backend');
      }

    } catch (error) {
      console.error("Error al crear preferencia:", error.response?.data || error.message);
      const specificError = error.response?.data?.error || "Error al iniciar el pago. Intenta de nuevo.";
      setFormError(specificError);
      setIsConfirming(false); // Detiene el estado de carga en error
    }
    // No ponemos setIsConfirming(false) aquí si todo fue bien, porque el control pasa al botón de MP.
  };

  // --- NUEVO: Función para renderizar el botón de Checkout ---
  const renderCheckoutButton = (prefId) => {
    const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
    if (!publicKey || !window.MercadoPago) {
        setFormError("Error al cargar la interfaz de pago.");
        setIsConfirming(false); // Asegura quitar loading si falla aquí
        return;
    }

    const mp = new window.MercadoPago(publicKey, {
        locale: 'es-AR' // Localización
    });

    // Limpia el contenedor si ya existe un botón previo
    const container = document.getElementById('wallet_container');
    if (container) {
        container.innerHTML = ''; // Limpia contenido previo
    } else {
        console.error("Error: Contenedor #wallet_container no encontrado en el DOM.");
        setFormError("Error al mostrar el botón de pago.");
        setIsConfirming(false);
        return;
    }

    // Crea el botón de pago (Checkout Bricks - Wallet Button)
    mp.bricks().create("wallet", "wallet_container", {
        initialization: {
            preferenceId: prefId,
        },
        customization: {
             texts: {
                 valueProp: 'smart_option', // Puedes ajustar esto
             },
        }
    })
    .then(() => {
        console.log("Botón de Mercado Pago renderizado.");
        setIsConfirming(false); // Quita el estado de carga una vez renderizado
    })
    .catch((error) => {
        console.error("Error al renderizar botón de Mercado Pago:", error);
        setFormError("Error al mostrar el botón de pago.");
        setIsConfirming(false);
    });
  };


  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Fondo Oscuro */}
          <div className="w-full flex-1 bg-black/30" onClick={() => { onClose(); setPreferenceId(null); setFormError(''); }} /> {/* Limpia al cerrar */}

          {/* Panel del Carrito */}
          <motion.div initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full w-full max-w-md flex flex-col overflow-hidden bg-white shadow-xl">
            {/* Encabezado */}
            <div className="p-4 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tu carrito</h3>
                <button onClick={() => { onClose(); setPreferenceId(null); setFormError(''); }} className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"><X className="h-5 w-5" /></button> {/* Limpia al cerrar */}
              </div>
            </div>

            {/* Cuerpo (scrollable) */}
            <div className="flex-grow overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-600">No agregaste productos aún.</div>
              ) : (
                <div className="space-y-3">
                  {/* Listado de Productos */}
                  {cart.map((it) => {
                     const p = products.find(prod => prod.id === it.productId);
                     if (!p) return null; // O muestra un placeholder si el producto no se encuentra
                     return (
                      <div key={it.productId} className="flex items-center justify-between rounded-xl border border-neutral-200 p-3 gap-2">
                        {p.img ? (
                          <img src={p.img} alt={p.name} className="h-12 w-12 rounded-md object-cover flex-shrink-0 border border-neutral-100"/>
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-neutral-100 flex-shrink-0 border border-neutral-100 grid place-content-center text-xs text-neutral-400">Sin img</div>
                        )}
                        <div className="flex-grow overflow-hidden mr-2">
                          <div className="font-medium text-sm truncate">{p.name}</div>
                          <div className="text-xs text-neutral-500">{toARS(p.price)} c/u</div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => changeQty(it.productId, -1)} className="rounded-md border p-1 text-neutral-600 hover:bg-neutral-100 disabled:opacity-50" disabled={it.qty <= 1 || !!preferenceId}><Minus className="h-4 w-4" /></button> {/* Deshabilita si ya hay pref */}
                          <span className="min-w-[2ch] text-center font-medium text-sm">{it.qty}</span>
                          <button onClick={() => changeQty(it.productId, 1)} className="rounded-md border p-1 text-neutral-600 hover:bg-neutral-100 disabled:opacity-50" disabled={it.qty >= p.stock || !!preferenceId}><Plus className="h-4 w-4" /></button> {/* Deshabilita si ya hay pref */}
                          <button onClick={() => removeFromCart(it.productId)} className="rounded-md border p-1 text-red-600 hover:bg-red-50 ml-1 disabled:opacity-50" disabled={!!preferenceId}><Trash2 className="h-4 w-4" /></button> {/* Deshabilita si ya hay pref */}
                        </div>
                      </div>
                     );
                  })}

                  {/* Selección Método de Entrega */}
                  <div className="space-y-2 pt-4 border-t border-neutral-200 mt-4">
                     <h4 className="text-sm font-medium text-neutral-800">Método de Entrega</h4>
                     <div className="flex gap-3">
                         <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${deliveryMethod === 'retiro' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-neutral-200 hover:bg-neutral-50'} ${preferenceId ? 'opacity-50 cursor-not-allowed' : ''}`} >
                             <input type="radio" name="deliveryMethod" value="retiro" checked={deliveryMethod === 'retiro'} onChange={() => handleMethodChange('retiro')} className="form-radio text-emerald-600 focus:ring-emerald-500 h-4 w-4" disabled={!!preferenceId}/> {/* Deshabilita si ya hay pref */}
                             <Store className={`h-5 w-5 ${deliveryMethod === 'retiro' ? 'text-emerald-700' : 'text-neutral-500'}`} />
                             <span className={`text-sm font-medium ${deliveryMethod === 'retiro' ? 'text-emerald-800' : 'text-neutral-700'}`}>Retiro en Corralón</span>
                         </label>
                         <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${deliveryMethod === 'domicilio' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-neutral-200 hover:bg-neutral-50'} ${preferenceId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                             <input type="radio" name="deliveryMethod" value="domicilio" checked={deliveryMethod === 'domicilio'} onChange={() => handleMethodChange('domicilio')} className="form-radio text-emerald-600 focus:ring-emerald-500 h-4 w-4" disabled={!!preferenceId}/> {/* Deshabilita si ya hay pref */}
                             <Home className={`h-5 w-5 ${deliveryMethod === 'domicilio' ? 'text-emerald-700' : 'text-neutral-500'}`} />
                             <span className={`text-sm font-medium ${deliveryMethod === 'domicilio' ? 'text-emerald-800' : 'text-neutral-700'}`}>Envío a Domicilio</span>
                         </label>
                     </div>
                  </div>

                  {/* Formulario de Dirección (Condicional) */}
                  {deliveryMethod === 'domicilio' && (
                    <motion.div layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`space-y-3 border-t border-neutral-200 pt-4 mt-4 ${preferenceId ? 'opacity-50' : ''}`}> {/* Opacidad si ya hay pref */}
                       <fieldset disabled={!!preferenceId}> {/* Deshabilita todo el fieldset */}
                           <h4 className="text-sm font-medium text-neutral-800">Dirección de Envío</h4>
                           <TextField label="Ciudad *" value={address.ciudad} onChange={(v) => handleAddressChange('ciudad', v)} placeholder="Tu ciudad" required />
                           <div className="grid grid-cols-3 gap-3">
                               <div className="col-span-2"> <TextField label="Calle *" value={address.calle} onChange={(v) => handleAddressChange('calle', v)} placeholder="Nombre de la calle" required/> </div>
                               <div> <TextField label="Número *" value={address.numero} onChange={(v) => handleAddressChange('numero', v)} placeholder="123" required/> </div>
                           </div>
                           <TextField label="Referencias Adicionales" value={address.referencia} onChange={(v) => handleAddressChange('referencia', v)} placeholder="Ej: Casa verde, entre X e Y" />

                           <h4 className="text-sm font-medium text-neutral-800 pt-3 border-t border-neutral-100 mt-3">¿Quién recibe el pedido? *</h4>
                           <div className="grid grid-cols-2 gap-3">
                               <TextField label="Nombre *" value={receiver.recibeNombre} onChange={(v) => handleReceiverChange('recibeNombre', v)} placeholder="Nombre" required />
                               <TextField label="Apellido *" value={receiver.recibeApellido} onChange={(v) => handleReceiverChange('recibeApellido', v)} placeholder="Apellido" required />
                           </div>
                            <TextField label="DNI *" value={receiver.recibeDni} onChange={(v) => handleReceiverChange('recibeDni', v)} placeholder="Documento" type="number" required />

                           {/* Checkbox Guardar Dirección */}
                           <div className="flex items-center pt-3">
                              <input id="saveAddress" type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="form-checkbox h-4 w-4 text-emerald-600 rounded border-neutral-300 focus:ring-offset-0 focus:ring-emerald-500 cursor-pointer"/>
                              <label htmlFor="saveAddress" className="ml-2 block text-sm text-neutral-700 cursor-pointer select-none">Guardar esta dirección para futuras compras</label>
                           </div>
                       </fieldset>
                    </motion.div>
                  )}
                  {/* Mensaje de error (movido al footer para mejor visibilidad) */}
                </div>
              )}
            </div>

            {/* Footer (Fijo abajo) */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-neutral-200 flex-shrink-0 space-y-3">
                {/* Resumen de Costos */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-neutral-600"> <span>Subtotal</span> <span>{toARS(total)}</span> </div>
                  <div className="flex justify-between text-neutral-600"> <span>Envío</span> <span>{toARS(shippingCost)}</span> </div>
                  <div className="border-t border-neutral-200 my-1"></div>
                  <div className="flex justify-between font-semibold text-base pt-1"> <span>Total</span> <span>{toARS(finalTotal)}</span> </div>
                </div>

                {/* --- CONTENEDOR PARA EL BOTÓN DE MERCADOPAGO --- */}
                {/* Este div se llenará con el botón de MP cuando preferenceId exista */}
                <div id="wallet_container" className={preferenceId ? 'block' : 'hidden'}></div>

                {/* Botón "Ir a Pagar" (que crea la preferencia) */}
                {/* Solo se muestra si NO hay una preferencia activa */}
                {!preferenceId && (
                  <button
                    onClick={handleConfirmClick}
                    disabled={isConfirming} // Deshabilita mientras llama al backend
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-white font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConfirming ? 'Procesando...' : 'Ir a Pagar'}
                  </button>
                )}

                 {/* Mensaje de error */}
                 {formError && ( <p id="cart-error-message" className="text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200 mt-2">{formError}</p> )}

              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}