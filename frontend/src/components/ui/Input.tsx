import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string };

export function Input({ label, className = "", ...props }: Props) {
  return (
    <label className="block">
      {label ? <div className="mb-1.5 text-xs text-slate-500">{label}</div> : null}
      <input
        className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-emerald-100 ${className}`}
        {...props}
      />
    </label>
  );
}

