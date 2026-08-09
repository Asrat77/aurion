"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface NotificationItem {
  id: number;
  kind: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  organizationId: number | null;
  createdAt: string;
}

export function useNotifications(enabled = true) {
  return useQuery<NotificationItem[]>({ queryKey: ["notifications"], queryFn: () => apiFetch("/notifications"), enabled, refetchOnWindowFocus: true });
}

export function useReadNotification() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, number>({
    mutationFn: (id) => apiFetch(`/notifications/${id}/read`, { method: "POST", body: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
