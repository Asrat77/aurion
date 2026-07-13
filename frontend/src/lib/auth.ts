"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types";

export function useMe() {
  return useQuery<User | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await apiFetch<User>("/me");
      } catch {
        return null;
      }
    },
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      apiFetch<User>("/auth/login", { method: "POST", body: payload }),
    onSuccess: (user) => qc.setQueryData(["me"], user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; password: string; name: string }) =>
      apiFetch<User>("/auth/register", { method: "POST", body: payload }),
    onSuccess: (user) => qc.setQueryData(["me"], user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>("/auth/logout", { method: "DELETE" }),
    onSuccess: () => qc.setQueryData(["me"], null),
  });
}
