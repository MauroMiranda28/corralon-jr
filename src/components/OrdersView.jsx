import React from "react";
import StatusBadge from "./StatusBadge";
import StatusChanger from "./StatusChanger";
import PrintOrderButton from "./PrintOrderButton";
import { toARS } from "../utils/utils.js";

export default function OrdersView({ orders, users, products, currentUser, onStatusChange, onExportCSV }) {
  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{currentUser?.role === "cliente" ? "Mis pedidos" : "Pedidos del sistema"}</h3>
        {currentUser?.role !== "cliente" && (
          <button onClick={onExportCSV} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2">Exportar CSV</button>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600">No hay pedidos aún.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-neutral-600">ID: <span className="font-mono">{o.id}</span></div>
                <div className="flex items-center gap-2 text-sm">
                  <StatusBadge status={o.status} />
                  {currentUser?.role !== "cliente" && (
                    <StatusChanger status={o.status} onChange={(s) => onStatusChange(o.id, s)} />
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
              <div className="mt-3 rounded-xl border border-neutral-200">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="p-2 text-left">Producto</th>
                      <th className="p-2 text-right">Cant.</th>
                      <th className="p-2 text-right">Precio</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((it, idx) => {
                      const p = products.find(x => x.id === it.productId);
                      return (
                        <tr key={idx} className="border-t">
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

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-neutral-500">Entrega: {o.delivery} · Pago: {o.payment}</div>
                <div className="flex items-center gap-2">
                  <PrintOrderButton order={o} products={products} user={users.find(u => u.id === o.clientId)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
