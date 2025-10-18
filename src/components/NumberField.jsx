import React from "react";

export default function NumberField({ label, value, onChange }) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-neutral-600">{label}</div>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10" />
    </label>
  );
}
