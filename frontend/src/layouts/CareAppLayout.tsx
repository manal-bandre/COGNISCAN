import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

const tabs = [
  { key: "overview", label: "👁️ Overview", to: "/care/app/overview" },
  { key: "alerts", label: "🚨 Alerts", to: "/care/app/alerts" },
  { key: "reports", label: "📑 Reports", to: "/care/app/reports" },
  { key: "message", label: "💬 Message AI", to: "/care/app/message" },
];

const LOCAL_PATIENTS = [{ id: "demo-patient-1", name: "Demo Patient" }];

export function CareAppLayout() {
  const nav = useNavigate();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(LOCAL_PATIENTS[0].id);
  const patientId = selectedPatientId;

  return (
    <div className="flex min-h-[560px] bg-slate-50">
      <aside className="w-[260px] border-r border-slate-200 bg-white p-4">
        <div className="mb-3 border-b border-slate-100 pb-3">
          <div className="text-sm font-semibold text-slate-900">Demo Caretaker</div>
          <div className="text-xs text-slate-500">
            Caretaker · {LOCAL_PATIENTS.find((p) => p.id === patientId)?.name ?? "—"}
          </div>

          <div className="mt-3">
            <div className="mb-1.5 text-xs text-slate-500">Patient</div>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={patientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              {LOCAL_PATIENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <nav className="space-y-1">
          {tabs.map((t) => (
            <NavLink
              key={t.key}
              to={t.to}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2 text-sm ${isActive ? "bg-emerald-50 font-medium text-[var(--brand)]" : "text-slate-600 hover:bg-slate-50"}`
              }
              state={{ patientId }}
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 pt-4">
          <button
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
            onClick={() => nav("/", { replace: true })}
          >
            ← Back to home
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-5">
        <Outlet context={{ patientId }} />
      </main>
    </div>
  );
}
