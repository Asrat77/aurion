"use client";

import { useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types";

const subscribeToHydration = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

export function useMe() {
  const hydrated = useHydrated();
  const query = useQuery<User | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        // A 401 here just means "signed out", which is the normal state on
        // every public page. It must not be reported as a session expiry.
        return await apiFetch<User>("/me", { expectUnauthorized: true });
      } catch {
        return null;
      }
    },
  });

  return {
    ...query,
    data: hydrated ? query.data : undefined,
    isLoading: !hydrated || query.isLoading,
  };
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
    onSuccess: () => {
      qc.setQueryData(["me"], null);
      // Same reason as the unauthorized handler: resetting drops the signed-in
      // data without stranding requests that are still in flight.
      void qc.resetQueries();
    },
  });
}
