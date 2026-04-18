import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMe } from "../queries/me";
import type { UserRole } from "../lib/session";

export function RequireAuth({ allowRoles }: { allowRoles: UserRole[] }) {
  const loc = useLocation();
  const me = useMe();

  if (me.isLoading) {
    return (
      <div className="mx-auto max-w-md p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading…</div>
      </div>
    );
  }

  if (me.isError || !me.data) {
    return <Navigate to="/" replace state={{ from: loc.pathname }} />;
  }

  const role = me.data.user.role;
  if (!allowRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

