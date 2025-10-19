import React from "react";
import StatusBadge from "./StatusBadge";
import StatusChanger from "./StatusChanger";
import PrintOrderButton from "./PrintOrderButton";
import { toARS } from "../utils/utils.js";

// Importa íconos si los necesitas
// import { CheckSquare } from "lucide-react";

export default function OrdersView({ orders, users, products, currentUser, onStatusChange, onExportCSV }) {

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {currentUser?.role === "cliente" ? "Mis pedidos"
           : currentUser?.role === "deposito" ? "Pedidos a Gestionar"
           : "Pedidos del sistema"}
        </h3>
        {(currentUser?.role === "admin" || currentUser?.role === "vendedor") && (
          <button onClick={onExportCSV} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2">Exportar CSV</button>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600">No hay pedidos para mostrar.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-neutral-600">ID: <span className="font-mono">{o.id.slice(-6)}</span></div>
                <div className="flex items-center gap-2 text-sm">
                  {currentUser?.role === 'cliente' ? (
                    o.status === 'listo' && <StatusBadge status={o.status} />
                  ) : (
                    <StatusBadge status={o.status} />
                  )}
                  {(currentUser?.role === "admin" || currentUser?.role === "deposito") && (
                    <StatusChanger
                      status={o.status}
                      onChange={(newStatus) => onStatusChange(o.id, newStatus)}
                    />
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">Cliente</div>
                  <div className="text-sm">{users.find(u => u.id === o.clientId)?.name || o.clientId}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">Fecha</div>
                  <div className="text-sm">{new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">Total</div>
                  <div className="text-sm font-semibold">{toARS(o.total)}</div>
                </div>
              </div>

              {/* Verifica que NO haya espacios/comentarios entre <table> y <thead> o <tbody> */}
              <div className="mt-3 rounded-xl border border-neutral-200 overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="p-2 text-left font-medium">Producto</th>
                      <th className="p-2 text-right font-medium">Cant.</th>
                      <th className="p-2 text-right font-medium">Precio</th>
                      <th className="p-2 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((it, idx) => {
                      const p = products.find(x => x.id === it.productId);
                      return (
                        <tr key={idx} className="border-t border-neutral-100">
                          <td className="p-2">{p?.name || it.productId}</td>
                          <td className="p-2 text-right">{it.qty}</td>
                          <td className="p-2 text-right">{toARS(it.price)}</td>
                          <td className="p-2 text-right">{toARS(it.price * it.qty)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Fin de la tabla */}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-neutral-500">Entrega: {o.delivery || 'N/A'} · Pago: {o.payment || 'N/A'}</div>
                <div className="flex items-center gap-2">
                  <PrintOrderButton order={o} products={products} user={users.find(u => u.id === o.clientId)} />
                  {/* Opcional: Botón Confirmar Entrega */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Opcional: Modal de Confirmación */}
    </section>
  );
}