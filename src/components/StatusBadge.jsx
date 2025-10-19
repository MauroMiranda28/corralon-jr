import React from "react";
import { Package, Truck, CheckCircle2, Settings } from "lucide-react";

const LABEL = {
  pendiente: "Pendiente",
  listo: "Listo",
  enviado: "Enviado",
  entregado: "Entregado",
};

export default function StatusBadge({ status }) {
  const color =
    {
      pendiente: "bg-amber-50 text-amber-700",
      listo: "bg-purple-50 text-purple-700",
      enviado: "bg-blue-50 text-blue-700",
      entregado: "bg-emerald-50 text-emerald-700",
    }[status] || "bg-neutral-100 text-neutral-700";

  const Icon =
    {
      pendiente: Package,
      listo: Truck,
      enviado: Truck,
      entregado: CheckCircle2,
    }[status] || Package;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${color}`}>
      <Icon className="h-4 w-4" /> {LABEL[status] || status}
    </span>
  );
}
