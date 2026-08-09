"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChatCircleDots, PaperPlaneTilt, Sparkle, WarningCircle, X } from "@phosphor-icons/react";
import { useAskAssistant, useAssistantStatus, type AssistantTask, type AssistantTurn } from "@/lib/assistant";
import { ApiError } from "@/lib/api";
import type { Channel } from "@/lib/channel";

/**
 * One assistant, two personas. The panel is styled entirely from the surface
 * tokens, so it inherits Express's dark gold or Business's light navy without
 * a second component.
 *
 * When no provider is configured the widget says so and offers no input. It
 * never produces a placeholder answer, because a fabricated reply about
 * prices, suppliers or protection is worse than no assistant at all.
 */
const PERSONAS: Record<"express" | "business", { task: AssistantTask; title: string; blurb: string; prompts: string[] }> = {
  express: {
    task: "express_support",
    title: "Shopping assistant",
    blurb: "Ask about products, availability, delivery or your own orders.",
    prompts: ["What coffee do you stock?", "How do refunds work?", "Where is my order?"],
  },
  business: {
    task: "business_sourcing",
    title: "Sourcing assistant",
    blurb: "Ask about wholesale terms, verified suppliers, or how matching and Protected Trade work.",
    prompts: ["Which suppliers can ship 5,000 kg of coffee?", "How is a supplier score calculated?", "What happens after I accept a quote?"],
  },
};

export default function AssistantWidget({ channel }: { channel: Channel }) {
  const persona = PERSONAS[channel === "business" ? "business" : "express"];
  const status = useAssistantStatus();
  const ask = useAskAssistant();

  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  // Minted on first send rather than during render: generating an id while
  // rendering is impure and can change between renders.
  const conversationKey = useRef<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight });
  }, [turns, ask.isPending]);

  async function send(text: string) {
    const body = text.trim();
    if (!body || ask.isPending) return;

    conversationKey.current ??=
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `conv-${Date.now()}`;

    const history = turns;
    setTurns([...history, { role: "user", content: body }]);
    setQuestion("");
    setError("");

    try {
      const reply = await ask.mutateAsync({
        task: persona.task,
        channel,
        question: body,
        conversationKey: conversationKey.current,
        history,
      });
      setTurns((current) => [
        ...current,
        {
          role: "assistant",
          content: reply.answer,
          groundedOn: reply.groundedOn,
          model: reply.model,
          latencyMs: reply.latencyMs,
        },
      ]);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "The assistant could not answer right now. Please try again.",
      );
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(question);
  }

  // Nothing is rendered until the backend has said whether an assistant exists.
  if (status.isLoading || !status.data) return null;

  const enabled = status.data.enabled;

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close the assistant" : `Open the ${persona.title.toLowerCase()}`}
        className="fixed bottom-5 right-5 z-[1100] flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-gold-strong)] bg-[var(--gold)] text-[var(--bg-deep)] shadow-[var(--shadow-elevated)] transition-transform hover:scale-105"
      >
        {open ? <X size={20} /> : <ChatCircleDots size={22} weight="fill" />}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={persona.title}
          className="fixed bottom-20 right-5 z-[1100] flex max-h-[min(560px,calc(100dvh-7rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[var(--shadow-elevated)]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] p-4">
            <div>
              <p className="flex items-center gap-2 text-[0.92rem] font-semibold text-[var(--text-primary)]">
                <Sparkle size={15} className="text-[var(--gold)]" weight="fill" />
                {persona.title}
              </p>
              <p className="mt-1 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">{persona.blurb}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close the assistant"
              className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={16} />
            </button>
          </header>

          {!enabled ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <WarningCircle size={26} className="text-[var(--warning)]" />
              <p className="text-[0.85rem] font-semibold text-[var(--text-primary)]">Assistant not configured</p>
              <p className="text-[0.8rem] leading-relaxed text-[var(--text-secondary)]">
                {status.data.reason ?? "No AI provider is connected to this deployment."}
              </p>
              <p className="text-[0.72rem] leading-relaxed text-[var(--text-muted)]">
                Rather than answer from a model that has never seen AURION&apos;s data, the assistant stays off until a
                provider is connected.
              </p>
            </div>
          ) : (
            <>
              <div ref={transcriptRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                {turns.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-[0.78rem] text-[var(--text-muted)]">Try one of these:</p>
                    {persona.prompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => void send(prompt)}
                        className="block w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-2 text-left text-[0.8rem] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-gold)] hover:text-[var(--text-primary)]"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                ) : null}

                {turns.map((turn, index) => (
                  <div key={index} className={turn.role === "user" ? "flex justify-end" : ""}>
                    <div
                      className={`max-w-[85%] rounded-[var(--radius-md)] px-3 py-2 text-[0.82rem] leading-relaxed ${
                        turn.role === "user"
                          ? "bg-[var(--gold)] text-[var(--bg-deep)]"
                          : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                      }`}
                    >
                      {turn.content}
                      {turn.role === "assistant" && turn.groundedOn ? (
                        <p className="mt-2 border-t border-[var(--border-subtle)] pt-1.5 font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                          {groundingLabel(turn.groundedOn)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}

                {ask.isPending ? (
                  <p className="text-[0.78rem] text-[var(--text-muted)]">Checking AURION records</p>
                ) : null}
                {error ? (
                  <p role="alert" className="text-[0.78rem] text-[var(--danger)]">
                    {error}
                  </p>
                ) : null}
              </div>

              <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-[var(--border-subtle)] p-3">
                <label className="sr-only" htmlFor="assistant-question">
                  Ask the assistant
                </label>
                <input
                  id="assistant-question"
                  className="input"
                  placeholder="Ask a question"
                  value={question}
                  maxLength={1000}
                  onChange={(event) => setQuestion(event.target.value)}
                />
                <button
                  type="submit"
                  disabled={ask.isPending || !question.trim()}
                  aria-label="Send"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--gold)] text-[var(--bg-deep)] disabled:opacity-40"
                >
                  <PaperPlaneTilt size={16} weight="fill" />
                </button>
              </form>

              <p className="border-t border-[var(--border-subtle)] px-3 py-2 text-[0.65rem] leading-relaxed text-[var(--text-muted)]">
                Answers are drawn from AURION&apos;s own catalogue and records via {status.data.model}. Check anything
                commercially important against the trade record.
              </p>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}

/** "3 products, 5 suppliers" — what the answer was actually built from. */
function groundingLabel(grounding: Record<string, number>): string {
  const parts = Object.entries(grounding)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${count} ${key}`);
  return parts.length ? `Grounded on ${parts.join(", ")}` : "No matching records found";
}
