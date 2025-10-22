import React, { useState, useEffect } from "react";
import { Minus, Plus, Trash2, X, Home, Store } from "lucide-react"; // Añadir iconos
import { motion, AnimatePresence } from "framer-motion";
import { toARS } from "../utils/utils.js";
import TextField from "./TextField"; // Importar TextField

export default function CartDrawer({
  open, onClose, cart, products, changeQty, removeFromCart, total, // 'total' es el subtotal
  onConfirm, // Recibirá { method, address: { ciudad, calle, numero, referencia, recibeNombre, recibeApellido, recibeDni }, saveAddress }
  canSeeStock,
  savedAddress // Dirección guardada del perfil: { ciudad, calle, numero, referencia }
}) {
  // --- Estados para Entrega y Dirección ---
  const [deliveryMethod, setDeliveryMethod] = useState('retiro'); // 'retiro' o 'domicilio'
  const [address, setAddress] = useState({ ciudad: '', calle: '', numero: '', referencia: '' });
  const [receiver, setReceiver] = useState({ recibeNombre: '', recibeApellido: '', recibeDni: ''}); // Datos de quién recibe
  const [saveAddress, setSaveAddress] = useState(false);
  const [formError, setFormError] = useState(''); // Errores locales del form de dirección
  const [isConfirming, setIsConfirming] = useState(false); // Estado para deshabilitar botón al confirmar

  // Efecto para pre-rellenar la dirección del domicilio si existe una guardada
  useEffect(() => {
    if (deliveryMethod === 'domicilio' && savedAddress && (savedAddress.ciudad || savedAddress.calle)) {
      setAddress({
        ciudad: savedAddress.ciudad || '',
        calle: savedAddress.calle || '',
        numero: savedAddress.numero || '',
        referencia: savedAddress.referencia || '',
      });
      setSaveAddress(true);
    }
  }, [deliveryMethod, savedAddress]);

  // Manejar cambio en los inputs de dirección del domicilio
  const handleAddressChange = (field, value) => { setAddress(prev => ({ ...prev, [field]: value })); setFormError(''); };
  // Manejar cambio en los inputs de quién recibe
  const handleReceiverChange = (field, value) => { setReceiver(prev => ({ ...prev, [field]: value })); setFormError(''); };

  // Manejar cambio de método de entrega
  const handleMethodChange = (method) => {
    setDeliveryMethod(method); setFormError('');
    if (method === 'retiro') {
      setAddress({ ciudad: '', calle: '', numero: '', referencia: '' });
      setReceiver({ recibeNombre: '', recibeApellido: '', recibeDni: ''});
      setSaveAddress(false);
    } else {
      if (!savedAddress || !(savedAddress.ciudad || savedAddress.calle)) { setSaveAddress(false); }
      else { // Si hay dirección guardada, pre-rellena (lo hace el useEffect) y marca el check
          setSaveAddress(true);
      }
    }
  };

  // --- Lógica de Costo de Envío (Placeholder) ---
  const shippingCost = deliveryMethod === 'domicilio' ? 500 : 0; // Ejemplo
  const isShippingCalculated = true;
  // --- Fin Placeholder ---

  const finalTotal = total + shippingCost;

  // Función para llamar a onConfirm con manejo de errores y estado de carga
  const handleConfirmClick = async () => { // Convertida a async
    setFormError('');
    setIsConfirming(true); // Inicia estado de carga

    // Validar campos obligatorios
    if (deliveryMethod === 'domicilio' && ( !address.ciudad?.trim() || !address.calle?.trim() || !address.numero?.trim() || !receiver.recibeNombre?.trim() || !receiver.recibeApellido?.trim() || !receiver.recibeDni?.trim() )) {
      setFormError("Completa todos los campos obligatorios (*).");
      const errorElement = document.getElementById('cart-error-message');
      if (errorElement) errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsConfirming(false); // Termina estado de carga
      return;
    }

    try {
      // Llama a onConfirm de App.jsx y espera a que termine
      await onConfirm({
        method: deliveryMethod,
        address: deliveryMethod === 'domicilio' ? { ...address, ...receiver } : null,
        saveAddress: saveAddress,
      });
      // Si onConfirm no lanza error, la operación fue exitosa (App.jsx cierra el modal)
    } catch (error) {
      // Si onConfirm lanza un error (ej: validación de stock falló), muéstralo
      console.error("Error received from onConfirm:", error);
      setFormError(error.message || "Ocurrió un error al confirmar el pedido.");
      const errorElement = document.getElementById('cart-error-message');
      if (errorElement) errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      setIsConfirming(false); // Termina estado de carga (éxito o error)
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="w-full flex-1 bg-black/30" onClick={onClose} />
          <motion.div initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full w-full max-w-md flex flex-col overflow-hidden bg-white shadow-xl">
            {/* Encabezado */}
            <div className="p-4 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between"> <h3 className="text-lg font-semibold">Tu carrito</h3> <button onClick={onClose} className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"><X className="h-5 w-5" /></button> </div>
            </div>

            {/* Cuerpo (scrollable) */}
            <div className="flex-grow overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-600">No agregaste productos aún.</div>
              ) : (
                <div className="space-y-3">
                  {/* Listado de Productos */}
                  {cart.map((it) => { const p = products.find(prod => prod.id === it.productId); if (!p) return null; return ( <div key={it.productId} className="flex items-center justify-between rounded-xl border border-neutral-200 p-3 gap-2"> {p.img && (<img src={p.img} alt={p.name} className="h-12 w-12 rounded-md object-cover flex-shrink-0 border border-neutral-100"/>)} <div className="flex-grow overflow-hidden mr-2"> <div className="font-medium text-sm truncate">{p.name}</div> <div className="text-xs text-neutral-500">{toARS(p.price)} c/u</div> </div> <div className="flex items-center gap-1 flex-shrink-0"> <button onClick={() => changeQty(it.productId, -1)} className="rounded-md border p-1 text-neutral-600 hover:bg-neutral-100 disabled:opacity-50" disabled={it.qty <= 1}><Minus className="h-4 w-4" /></button> <span className="min-w-[2ch] text-center font-medium text-sm">{it.qty}</span> <button onClick={() => changeQty(it.productId, 1)} className="rounded-md border p-1 text-neutral-600 hover:bg-neutral-100 disabled:opacity-50" disabled={it.qty >= p.stock}><Plus className="h-4 w-4" /></button> <button onClick={() => removeFromCart(it.productId)} className="rounded-md border p-1 text-red-600 hover:bg-red-50 ml-1"><Trash2 className="h-4 w-4" /></button> </div> </div> ); })}

                  {/* Selección Método de Entrega */}
                  <div className="space-y-2 pt-4 border-t border-neutral-200 mt-4">
                     <h4 className="text-sm font-medium text-neutral-800">Método de Entrega</h4>
                     <div className="flex gap-3">
                         <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${deliveryMethod === 'retiro' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-neutral-200 hover:bg-neutral-50'}`} > <input type="radio" name="deliveryMethod" value="retiro" checked={deliveryMethod === 'retiro'} onChange={() => handleMethodChange('retiro')} className="form-radio text-emerald-600 focus:ring-emerald-500 h-4 w-4"/> <Store className={`h-5 w-5 ${deliveryMethod === 'retiro' ? 'text-emerald-700' : 'text-neutral-500'}`} /> <span className={`text-sm font-medium ${deliveryMethod === 'retiro' ? 'text-emerald-800' : 'text-neutral-700'}`}>Retiro en Corralón</span> </label>
                         <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${deliveryMethod === 'domicilio' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-neutral-200 hover:bg-neutral-50'}`}> <input type="radio" name="deliveryMethod" value="domicilio" checked={deliveryMethod === 'domicilio'} onChange={() => handleMethodChange('domicilio')} className="form-radio text-emerald-600 focus:ring-emerald-500 h-4 w-4"/> <Home className={`h-5 w-5 ${deliveryMethod === 'domicilio' ? 'text-emerald-700' : 'text-neutral-500'}`} /> <span className={`text-sm font-medium ${deliveryMethod === 'domicilio' ? 'text-emerald-800' : 'text-neutral-700'}`}>Envío a Domicilio</span> </label>
                     </div>
                  </div>

                  {/* Formulario de Dirección (Condicional) */}
                  {deliveryMethod === 'domicilio' && (
                    <motion.div layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 border-t border-neutral-200 pt-4 mt-4">
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
                       {/* Mensaje de error del formulario */}
                        {formError && ( <p id="cart-error-message" className="text-sm text-red-600 mt-2">{formError}</p> )}
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Footer (Fijo abajo) */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-neutral-200 flex-shrink-0 space-y-3">
                {/* Resumen de Costos */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-neutral-600"> <span>Subtotal</span> <span>{toARS(total)}</span> </div>
                  <div className="flex justify-between text-neutral-600"> <span>Envío</span> <span>{isShippingCalculated ? toARS(shippingCost) : 'A calcular'}</span> </div>
                  <div className="border-t border-neutral-200 my-1"></div>
                  <div className="flex justify-between font-semibold text-base pt-1"> <span>Total</span> <span>{toARS(finalTotal)}</span> </div>
                </div>

                {/* Botón Confirmar */}
                <button
                   onClick={handleConfirmClick}
                   disabled={isConfirming} // Deshabilita mientras procesa
                   className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-white font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                  {isConfirming ? 'Procesando...' : 'Confirmar pedido'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}