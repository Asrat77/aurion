"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Conversation, ConversationDetail, Message } from "@/types";

export interface Inbox {
  conversations: Conversation[];
  unreadTotal: number;
}

export function useInbox(enabled = true) {
  return useQuery<Inbox>({
    queryKey: ["conversations"],
    queryFn: () => apiFetch("/conversations"),
    enabled,
  });
}

/** Fetching a thread also marks the other side's messages read. */
export function useConversation(id: number | null) {
  return useQuery<ConversationDetail>({
    queryKey: ["conversation", id],
    queryFn: () => apiFetch(`/conversations/${id}`),
    enabled: id != null,
  });
}

export interface StartConversationInput {
  vendor_id: number;
  body: string;
  order_id?: number;
  product_id?: number;
  subject?: string;
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartConversationInput) =>
      apiFetch<ConversationDetail>("/conversations", { method: "POST", body: payload }),
    onSuccess: (conversation) => {
      qc.setQueryData(["conversation", conversation.id], conversation);
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useReply(conversationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      apiFetch<Message>(`/conversations/${conversationId}/reply`, {
        method: "POST",
        body: { body },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
