import React from "react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { toARS } from "../utils/utils.js";
import { Download, BarChart2, TrendingUp } from "lucide-react";

export default function Reports({
  ventasPorProducto,
  picosDeDemanda,
  onExportExcel,
  onExportPDF,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta
}) {

  // Definir columnas para exportación PDF
  const ventasCols = [
    { header: 'Producto', dataKey: 'name' },
    { header: 'Total Vendido', dataKey: 'total' }
  ];
  const picosCols = [
    { header: 'Fecha', dataKey: 'name' },
    { header: 'N° Pedidos', dataKey: 'pedidos' },
    { header: 'Total en Pedidos', dataKey: 'total' }
  ];

  return (
    <section className="mt-6 space-y-6">
      
      {/* --- Filtros de Fecha --- */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Filtrar Reportes por Fecha</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">
              <div className="mb-1 text-neutral-600">Desde</div>
              <input
                type="date"
                value={fechaDesde || ''}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm">
              <div className="mb-1 text-neutral-600">Hasta</div>
              <input
                type="date"
                value={fechaHasta || ''}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </label>
          </div>
        </div>
      </div>

      {/* --- Reporte: Ventas por Producto --- */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
             <BarChart2 className="h-5 w-5" /> Ventas por producto (solo pedidos entregados)
          </h3>
          <div className="flex gap-2">
             <button onClick={() => onExportExcel(ventasPorProducto, 'ventas_por_producto')} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700 flex items-center gap-1"><Download className="h-4 w-4"/> Excel</button>
             <button onClick={() => onExportPDF(ventasPorProducto, 'Ventas por Producto', ventasCols)} className="rounded-lg bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 flex items-center gap-1"><Download className="h-4 w-4"/> PDF</button>
          </div>
        </div>
        <div className="h-80 w-full">
          {ventasPorProducto.length === 0 ? (
            <div className="grid h-full place-content-center text-sm text-neutral-600">
              Sin datos para las fechas seleccionadas.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasPorProducto} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} height={60} />
                <YAxis />
                <Tooltip formatter={(v) => toARS(v)} />
                <Bar dataKey="total" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* --- Reporte: Picos de Demanda --- */}
       <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
             <TrendingUp className="h-5 w-5" /> Picos de Demanda (Todos los pedidos)
          </h3>
          <div className="flex gap-2">
             <button onClick={() => onExportExcel(picosDeDemanda, 'picos_de_demanda')} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700 flex items-center gap-1"><Download className="h-4 w-4"/> Excel</button>
             <button onClick={() => onExportPDF(picosDeDemanda, 'Picos de Demanda', picosCols)} className="rounded-lg bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 flex items-center gap-1"><Download className="h-4 w-4"/> PDF</button>
          </div>
        </div>
        <div className="h-80 w-full">
          {picosDeDemanda.length === 0 ? (
            <div className="grid h-full place-content-center text-sm text-neutral-600">
              Sin datos para las fechas seleccionadas.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={picosDeDemanda} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip formatter={(value, name) => (name === 'Total' ? toARS(value) : value)} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="pedidos" name="N° Pedidos" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="total" name="Total" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </section>
  );
}