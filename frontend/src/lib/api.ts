const API_URL = import.meta.env.VITE_API_URL ?? "";

export type ApiError = {
  error: { code: string; message: string; details?: unknown };
};

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      credentials: "include",
    });
  } catch (error) {
    // Give a clearer message when the request cannot reach the API at all.
    const cause = error instanceof Error ? error : new Error(String(error));
    throw Object.assign(new Error("Cannot connect to API. Check backend is running and URL is correct."), { cause });
  }

  if (!res.ok) {
    let body: unknown = undefined;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    const e = body as Partial<ApiError> | undefined;
    const msg = e?.error?.message ?? `Request failed (${res.status})`;
    throw Object.assign(new Error(msg), { status: res.status, body });
  }

  return (await res.json()) as T;
}

