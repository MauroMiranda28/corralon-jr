// src/components/AdminPanel.jsx
import React, { useState } from "react";
import NumberField from "./NumberField.jsx";
import { Save, UserCog, Send } from "lucide-react";

// Componente UserRow (sin cambios aquí)
function UserRow({ user, onUpdateUserRole }) {
  const [selectedRole, setSelectedRole] = useState(user.role || 'cliente');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async () => {
    if (selectedRole === user.role) return;
    if (!confirm(`¿Cambiar el rol de ${user.name} a ${selectedRole}?`)) {
      setSelectedRole(user.role);
      return;
    }
    setIsUpdating(true);
    try {
      await onUpdateUserRole(user.id, selectedRole);
    } catch (error) {
      setSelectedRole(user.role); // Revertir si falla
    } finally {
      setIsUpdating(false);
    }
  };

  const email = user.id; // Asume ID es email, idealmente vendría de API
  const name = user.name || 'N/A';
  const lastName = user.apellido || '';

  return (
    <tr className="border-t border-neutral-100">
      <td className="p-2">{name} {lastName}</td>
      <td className="p-2 text-neutral-600">{email}</td>
      <td className="p-2">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          disabled={isUpdating}
          className="rounded-md border border-neutral-200 px-2 py-1 text-sm"
        >
          {/* <option value="cliente">Cliente</option> */} {/* Opcional: Ocultar Cliente aquí también */}
          <option value="vendedor">Vendedor</option>
          <option value="deposito">Depósito</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      <td className="p-2 text-right">
        <button
          onClick={handleRoleChange}
          disabled={isUpdating || selectedRole === user.role}
          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
        >
          {isUpdating ? "..." : "Actualizar Rol"}
        </button>
      </td>
    </tr>
  );
}

export default function AdminPanel({ users, onUpdateUserRole, shippingCostBase, onSaveShippingCost }) {
  const [shippingCost, setShippingCost] = useState(shippingCostBase);
  const [isSavingCost, setIsSavingCost] = useState(false);

  const handleSaveCost = async () => {
    setIsSavingCost(true);
    try {
      await onSaveShippingCost(shippingCost);
    } catch (e) {
      // El error se maneja en App.jsx
    } finally {
      setIsSavingCost(false);
    }
  };

  // --- >>> FILTRAR USUARIOS ANTES DE RENDERIZAR <<< ---
  const employeeUsers = users.filter(user => user.role !== 'cliente');
  // --- >>> FIN FILTRADO <<< ---

  return (
    <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Columna de Gestión de Usuarios */}
      <div className="lg:col-span-2">
        <h3 className="mb-3 text-lg font-semibold flex items-center gap-2">
          <UserCog className="h-5 w-5" /> Gestión de Empleados {/* Cambiado título para claridad */}
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="p-2 text-left font-medium">Nombre</th>
                <th className="p-2 text-left font-medium">Email/ID</th>
                <th className="p-2 text-left font-medium">Rol</th>
                <th className="p-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {/* --- >>> USAR LA LISTA FILTRADA EN EL MAP <<< --- */}
              {employeeUsers.map((u) => (
                <UserRow key={u.id} user={u} onUpdateUserRole={onUpdateUserRole} />
              ))}
              {/* --- >>> FIN CAMBIO MAP <<< --- */}

              {/* Mensaje si no hay empleados */}
              {employeeUsers.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-neutral-500" colSpan={4}>
                    No hay empleados (vendedor, depósito, admin) cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Columna de Configuración (sin cambios) */}
      <div>
        <h3 className="mb-3 text-lg font-semibold flex items-center gap-2">
          <Send className="h-5 w-5" /> Configuración de Parámetros
        </h3>
        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <NumberField
            label="Costo de Envío Base"
            value={shippingCost}
            onChange={setShippingCost}
          />
          <div className="flex justify-end pt-4 border-t border-neutral-100">
            <button
              onClick={handleSaveCost}
              className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-50"
              disabled={isSavingCost || shippingCost === shippingCostBase}
            >
              <Save className="mr-1 inline h-4 w-4" />
              {isSavingCost ? "Guardando..." : "Guardar Costo"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}