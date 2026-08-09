"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type AssistantTask = "express_support" | "business_sourcing";

export interface AssistantStatus {
  enabled: boolean;
  provider: string | null;
  model: string | null;
  /** Why the assistant is unavailable, when it is. */
  reason: string | null;
}

export interface AssistantTurn {
  role: "user" | "assistant";
  content: string;
  /** Counts of the AURION records the answer was grounded on. */
  groundedOn?: Record<string, number>;
  model?: string;
  latencyMs?: number | null;
}

export interface AssistantReply {
  id: number;
  conversationKey: string;
  answer: string;
  model: string;
  provider: string;
  groundedOn: Record<string, number>;
  latencyMs: number | null;
}

export function useAssistantStatus() {
  return useQuery<AssistantStatus>({
    queryKey: ["assistant-status"],
    queryFn: () => apiFetch("/assistant"),
    staleTime: 5 * 60_000,
  });
}

export function useAskAssistant() {
  return useMutation<
    AssistantReply,
    Error,
    { task: AssistantTask; channel: string; question: string; conversationKey: string; history: AssistantTurn[] }
  >({
    mutationFn: ({ task, channel, question, conversationKey, history }) =>
      apiFetch("/assistant/messages", {
        method: "POST",
        body: {
          task,
          channel,
          question,
          conversation_key: conversationKey,
          // Only the transcript is replayed; grounding is rebuilt server-side
          // from live records on every turn.
          history: history.map((turn) => ({ role: turn.role, content: turn.content })),
        },
      }),
  });
}
