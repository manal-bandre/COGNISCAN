import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export function Button({ variant = "secondary", className = "", ...props }: Props) {
  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "border-transparent bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)]"
      : variant === "danger"
        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
        : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}

