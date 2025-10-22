// src/components/AdminPanel.jsx
import React, { useState } from "react";
import NumberField from "./NumberField.jsx";
import TextField from "./TextField.jsx"; // Importar TextField
import { Save, UserCog, Send, UserPlus, X } from "lucide-react"; // Importar iconos necesarios

// Componente para una fila de usuario (Empleado)
function UserRow({ user, onUpdateUserRole }) {
  const [selectedRole, setSelectedRole] = useState(user.role || 'cliente'); // Default a cliente aunque no se muestre
  const [isUpdating, setIsUpdating] = useState(false);

  // Manejador para cambiar el rol del usuario
  const handleRoleChange = async () => {
    if (selectedRole === user.role) return; // No hacer nada si el rol no cambió
    // Pedir confirmación
    if (!confirm(`¿Estás seguro de cambiar el rol de ${user.name || user.email} a ${selectedRole}?`)) {
      setSelectedRole(user.role); // Revertir visualmente si cancela
      return;
    }
    setIsUpdating(true); // Mostrar estado de carga
    try {
      // Llamar a la función pasada por props desde App.jsx
      await onUpdateUserRole(user.id, selectedRole);
      // El estado `users` se actualizará en App.jsx, lo que refrescará esta fila
    } catch (error) {
      // Si onUpdateUserRole lanza error (App.jsx ya mostró alert), revertir visualmente
      setSelectedRole(user.role);
    } finally {
      setIsUpdating(false); // Quitar estado de carga
    }
  };

  // Obtener datos del usuario, con fallbacks por si acaso
  const email = user.email || user.id; // Priorizar email, si no existe, mostrar ID
  const name = user.name || 'N/A';
  const lastName = user.apellido || '';

  // JSX para la fila de la tabla
  return (
    <tr className="border-t border-neutral-100">
      <td className="p-2">{name} {lastName}</td> {/* Nombre y Apellido */}
      <td className="p-2 text-neutral-600">{email}</td> {/* Email (o ID si no hay email) */}
      <td className="p-2"> {/* Selector de Rol */}
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          disabled={isUpdating} // Deshabilitar mientras se actualiza
          className="rounded-md border border-neutral-200 px-2 py-1 text-sm bg-white focus:ring-1 focus:ring-neutral-400"
        >
          {/* Opciones de roles de empleado */}
          <option value="vendedor">Vendedor</option>
          <option value="deposito">Depósito</option>
          <option value="admin">Admin</option>
          {/* <option value="cliente">Cliente</option> */} {/* Opcional: Ocultar Cliente aquí también */}
        </select>
      </td>
      <td className="p-2 text-right"> {/* Botón de Acción */}
        <button
          onClick={handleRoleChange}
          disabled={isUpdating || selectedRole === user.role} // Deshabilitar si está actualizando o si no hay cambios
          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? "Actualizando..." : "Actualizar Rol"}
        </button>
        {/* Aquí podrías añadir botones para resetear contraseña o eliminar usuario en el futuro */}
      </td>
    </tr>
  );
}
// --- Fin Componente UserRow ---


// --- Componente principal AdminPanel ---
export default function AdminPanel({
  users,                  // Lista completa de usuarios desde App.jsx
  onUpdateUserRole,       // Función para actualizar rol (desde App.jsx)
  shippingCostBase,       // Costo de envío actual (desde App.jsx)
  onSaveShippingCost,     // Función para guardar costo de envío (desde App.jsx)
  onAdminCreateUser       // Función para crear empleado (desde App.jsx)
}) {
  // Estado para el campo de costo de envío
  const [shippingCost, setShippingCost] = useState(shippingCostBase);
  const [isSavingCost, setIsSavingCost] = useState(false); // Estado de carga para guardar costo

  // Estados para el formulario de creación de empleados
  const [showCreateForm, setShowCreateForm] = useState(false); // Visibilidad del formulario
  const [createForm, setCreateForm] = useState({                // Datos del formulario
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    password: "",
    role: "vendedor", // Rol por defecto al crear
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false); // Estado de carga para crear usuario
  const [createError, setCreateError] = useState('');          // Mensaje de error del formulario

  // Manejador para guardar el costo de envío
  const handleSaveCost = async () => {
     setIsSavingCost(true);
     try {
       await onSaveShippingCost(shippingCost); // Llama a la función de App.jsx
     } catch (e) {
        // App.jsx maneja el alert de error
     }
     finally {
        setIsSavingCost(false);
     }
  };

  // Manejador para enviar el formulario de creación de empleado
  const handleCreateEmployeeSubmit = async (e) => {
    e.preventDefault(); // Evitar recarga de página
    setCreateError(''); // Limpiar errores previos

    // Validaciones básicas
    if (!createForm.email || !createForm.password || !createForm.nombre || !createForm.apellido || !createForm.telefono) {
      setCreateError('Todos los campos marcados con * son obligatorios.');
      return;
    }
    // Podrías añadir validaciones más específicas aquí (ej: longitud contraseña, formato teléfono)

    setIsCreatingUser(true); // Activar estado de carga
    try {
      // Llamar a la función pasada por props desde App.jsx
      await onAdminCreateUser(
        createForm.email,
        createForm.password,
        createForm.nombre,
        createForm.apellido,
        createForm.telefono,
        createForm.role
      );
      // Si onAdminCreateUser no lanza error, fue exitoso
      setCreateForm({ nombre: "", apellido: "", email: "", telefono: "", password: "", role: "vendedor" }); // Limpiar formulario
      setShowCreateForm(false); // Ocultar formulario
      setCreateError('');      // Limpiar cualquier error previo
    } catch (error) {
      // App.jsx ya mostró un alert, podemos poner un mensaje local también
      setCreateError(error.message || 'Ocurrió un error inesperado al crear la cuenta.');
    } finally {
      setIsCreatingUser(false); // Desactivar estado de carga
    }
  };

  // Filtrar la lista de usuarios para mostrar solo empleados (no clientes)
  const employeeUsers = users.filter(user => user.role !== 'cliente');

  // JSX del componente AdminPanel
  return (
    <section className="mt-6 space-y-6"> {/* Espacio entre secciones */}

      {/* --- Formulario Crear Empleado (se muestra condicionalmente) --- */}
      {showCreateForm && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
           <div className="mb-3 flex items-center justify-between">
             <h3 className="text-lg font-semibold flex items-center gap-2">
               <UserPlus className="h-5 w-5 text-emerald-600" /> Nuevo Empleado
             </h3>
             {/* Botón para cerrar el formulario */}
             <button
               onClick={() => { setShowCreateForm(false); setCreateError(''); }} // Oculta y limpia error
               className="rounded-xl p-1 text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200"
               title="Cerrar formulario"
             >
               <X className="h-4 w-4" />
             </button>
           </div>
           {/* Formulario */}
           <form onSubmit={handleCreateEmployeeSubmit} className="space-y-3">
             {/* Nombre y Apellido */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <TextField label="Nombre *" value={createForm.nombre} onChange={v => setCreateForm({...createForm, nombre: v})} placeholder="Nombre del empleado" required />
               <TextField label="Apellido *" value={createForm.apellido} onChange={v => setCreateForm({...createForm, apellido: v})} placeholder="Apellido del empleado" required />
             </div>
             {/* Email */}
             <TextField label="Email *" value={createForm.email} onChange={v => setCreateForm({...createForm, email: v})} placeholder="correo@ejemplo.com" type="email" required />
             {/* Teléfono */}
             <TextField label="Teléfono *" value={createForm.telefono} onChange={v => setCreateForm({...createForm, telefono: v})} placeholder="Ej: 3851234567 (solo números)" type="tel" required />
             {/* Contraseña Inicial */}
             <div>
                <label className="block text-sm">
                    <div className="mb-1 text-neutral-600">Contraseña Inicial *</div>
                    <input
                        type="password" // Tipo password para ocultar
                        value={createForm.password}
                        onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                        placeholder="Mín 6 chars, letra y número"
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10"
                        minLength={6} // Validación HTML básica
                        required
                    />
                    <p className="mt-1 text-xs text-amber-700">Importante: El empleado deberá cambiar esta contraseña en su primer inicio de sesión.</p>
                </label>
             </div>
             {/* Selector de Rol */}
             <div>
                <label className="block text-sm">
                    <div className="mb-1 text-neutral-600">Asignar Rol *</div>
                    <select
                        value={createForm.role}
                        onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10 bg-white"
                        required
                    >
                        <option value="vendedor">Vendedor</option>
                        <option value="deposito">Depósito</option>
                        <option value="admin">Administrador</option>
                    </select>
                </label>
             </div>

             {/* Mostrar error si existe */}
             {createError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">{createError}</p>}

             {/* Botón de envío */}
             <div className="flex justify-end pt-3 border-t border-neutral-100 mt-4">
               <button
                 type="submit"
                 className="rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white font-semibold hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 flex items-center gap-1.5"
                 disabled={isCreatingUser} // Deshabilitar mientras crea
               >
                 <UserPlus className="h-4 w-4" />
                 {isCreatingUser ? "Creando Cuenta..." : "Crear Cuenta de Empleado"}
               </button>
             </div>
           </form>
         </div>
      )}
      {/* --- FIN Formulario Crear Empleado --- */}


      {/* --- Contenedor Grid para Tabla y Configuración --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- Columna Tabla Gestión de Empleados --- */}
        <div className="lg:col-span-2">
           {/* Encabezado con botón para mostrar formulario */}
           <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCog className="h-5 w-5 text-neutral-700" /> Gestión de Empleados
              </h3>
              {/* Botón para ABRIR el formulario (solo si está cerrado) */}
              {!showCreateForm && (
                 <button
                   onClick={() => setShowCreateForm(true)} // Muestra el formulario
                   className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm text-white font-semibold hover:bg-emerald-700 active:bg-emerald-800 flex items-center gap-1.5"
                 >
                   <UserPlus className="h-4 w-4" /> Nuevo Empleado
                 </button>
              )}
           </div>
          {/* Tabla */}
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full text-sm min-w-[600px]">
              {/* Encabezado de la tabla */}
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="p-2 text-left font-medium">Nombre</th>
                  <th className="p-2 text-left font-medium">Email</th>
                  <th className="p-2 text-left font-medium">Rol</th>
                  <th className="p-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              {/* Cuerpo de la tabla */}
              <tbody>
                {/* Mapear sobre la lista FILTRADA de empleados */}
                {employeeUsers.map((u) => (
                  <UserRow key={u.id} user={u} onUpdateUserRole={onUpdateUserRole} />
                ))}
                {/* Mensaje si no hay empleados */}
                {employeeUsers.length === 0 && !showCreateForm && ( // Mostrar solo si no hay empleados Y el form está cerrado
                  <tr>
                     <td className="p-4 text-center text-neutral-500" colSpan={4}>
                       No hay empleados (vendedor, depósito, admin) cargados. Haz clic en "Nuevo Empleado" para agregar uno.
                     </td>
                  </tr>
                )}
                 {employeeUsers.length === 0 && showCreateForm && ( // Mensaje diferente si el form está abierto
                  <tr>
                     <td className="p-4 text-center text-neutral-500" colSpan={4}>
                       Completa el formulario de arriba para agregar el primer empleado.
                     </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* --- Fin Columna Tabla --- */}


        {/* --- Columna Configuración de Parámetros --- */}
        <div>
           <h3 className="mb-3 text-lg font-semibold flex items-center gap-2">
             <Send className="h-5 w-5 text-neutral-700" /> Configuración de Parámetros
           </h3>
           <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
             {/* Campo para Costo de Envío */}
             <NumberField
               label="Costo de Envío Base ($)"
               value={shippingCost}
               onChange={setShippingCost}
             />
             {/* Botón Guardar Costo */}
             <div className="flex justify-end pt-4 border-t border-neutral-100">
               <button
                 onClick={handleSaveCost}
                 className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white font-semibold hover:bg-neutral-800 active:bg-black disabled:opacity-50"
                 disabled={isSavingCost || Number(shippingCost) === Number(shippingCostBase)} // Deshabilitar si está guardando o no hay cambios
               >
                 <Save className="mr-1 inline h-4 w-4" />
                 {isSavingCost ? "Guardando..." : "Guardar Costo Envío"}
               </button>
             </div>
           </div>
        </div>
        {/* --- Fin Columna Configuración --- */}

      </div>
      {/* --- Fin Contenedor Grid --- */}

    </section>
  );
}