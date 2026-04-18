import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

const tabs = [
  { key: "home", label: "🏠 Home", to: "/app/home" },
  { key: "tasks", label: "🧩 Tasks", to: "/app/tasks" },
  { key: "analysis", label: "📊 Analysis", to: "/app/analysis" },
  { key: "reports", label: "📄 Reports", to: "/app/reports" },
  { key: "settings", label: "⚙️ Settings", to: "/app/settings" },
];

const LOCAL_USER = { name: "Demo Patient", age: 65, language: "English" };

export function PatientAppLayout() {
  const nav = useNavigate();

  return (
    <div className="flex min-h-[560px] bg-slate-50">
      <aside className="w-[240px] border-r border-slate-200 bg-white p-4">
        <Link to="/app/home" className="mb-3 flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-[var(--brand-dark)]">
            {LOCAL_USER.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{LOCAL_USER.name}</div>
            <div className="truncate text-xs text-slate-500">
              {LOCAL_USER.age} yrs · {LOCAL_USER.language}
            </div>
          </div>
        </Link>

        <nav className="space-y-1">
          {tabs.map((t) => (
            <NavLink
              key={t.key}
              to={t.to}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2 text-sm ${isActive ? "bg-emerald-50 font-medium text-[var(--brand)]" : "text-slate-600 hover:bg-slate-50"}`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 pt-4 text-xs text-slate-500">
          <button
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs hover:bg-slate-50"
            onClick={() => nav("/", { replace: true })}
          >
            ← Back to home
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-5">
        <Outlet />
      </main>
    </div>
  );
}
