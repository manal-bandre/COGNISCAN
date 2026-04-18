import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { SessionUser } from "../lib/session";

export type MeResponse = {
  user: SessionUser;
  patients?: Array<{ id: string; name: string; phone?: string }>;
};

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/api/me"),
    retry: false,
    staleTime: 10_000,
  });
}

