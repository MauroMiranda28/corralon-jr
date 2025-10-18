import React from "react";
import { ORDER_STATUSES } from "../utils/utils.js";

function labelize(s) {
  // "en_preparacion" -> "En preparación"
  const withSpaces = s.replace(/_/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export default function StatusChanger({ status, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {ORDER_STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`rounded-full px-2 py-1 text-xs ${
            s === status ? "bg-neutral-900 text-white" : "bg-neutral-100 hover:bg-neutral-200"
          }`}
        >
          {labelize(s)}
        </button>
      ))}
    </div>
  );
}
