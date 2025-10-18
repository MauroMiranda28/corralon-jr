import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { toARS } from "../utils/utils.js";

export default function Reports({ ventasPorProducto }) {
  return (
    <section className="mt-6">
      <h3 className="mb-3 text-lg font-semibold">Ventas por producto (solo pedidos entregados)</h3>
      <div className="h-80 w-full rounded-2xl border border-neutral-200 bg-white p-4">
        {ventasPorProducto.length === 0 ? (
          <div className="grid h-full place-content-center text-sm text-neutral-600">
            Sin datos aún. Entregá algún pedido para ver métricas.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ventasPorProducto} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} height={60} />
              <YAxis />
              <Tooltip formatter={(v) => toARS(v)} />
              <Bar dataKey="total" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

