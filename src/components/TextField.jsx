import React from "react";

export default function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-neutral-600">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900/10"
      />
    </label>
  );
}
