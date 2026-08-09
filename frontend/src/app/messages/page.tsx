"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ChatCircleText, PaperPlaneRight, ArrowLeft } from "@phosphor-icons/react";
import { useMe } from "@/lib/auth";
import { useUiStore } from "@/store/ui";
import { useInbox, useConversation, useReply } from "@/lib/messages";
import { ApiError } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Conversation } from "@/types";
import { channelUrl } from "@/lib/channel";

export default function MessagesPage() {
  const { t } = useTranslation();
  const { data: user, isLoading: userLoading } = useMe();
  const openAuth = useUiStore((s) => s.openAuth);
  const { data: inbox, isLoading } = useInbox(!!user);
  // `null` means "nothing picked yet"; on desktop that falls through to the
  // newest thread so the pane is never blank. `closed` is the explicit mobile
  // back-to-list state, which must not immediately reopen.
  const [selection, setSelection] = useState<number | "closed" | null>(null);

  const conversations = inbox?.conversations ?? [];
  const activeId =
    selection === "closed" ? null : selection ?? conversations[0]?.id ?? null;

  if (userLoading || (user && isLoading)) {
    return (
      <Shell>
        <div className="flex flex-col gap-3">
          <Skeleton className="w-full h-16" />
          <Skeleton className="w-full h-16" />
        </div>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <EmptyState
          icon={<ChatCircleText size={32} />}
          title={t("messages.signInPrompt")}
          action={
            <button className="btn btn-primary" onClick={() => openAuth("login")}>
              {t("common.signIn")}
            </button>
          }
        />
      </Shell>
    );
  }

  if (conversations.length === 0) {
    return (
      <Shell>
        <EmptyState
          icon={<ChatCircleText size={32} />}
          title={t("messages.noneTitle")}
          body={t("messages.noneBody")}
          action={
            <Link href={channelUrl("express", "/store")} className="btn btn-primary">
              {t("messages.browseStore")}
            </Link>
          }
        />
      </Shell>
    );
  }

  return (
    <Shell unread={inbox?.unreadTotal ?? 0}>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <ul
          className={`flex-col gap-2 ${activeId != null ? "hidden lg:flex" : "flex"}`}
          aria-label={t("messages.conversations")}
        >
          {conversations.map((c) => (
            <li key={c.id}>
              <ThreadButton
                conversation={c}
                active={c.id === activeId}
                onSelect={() => setSelection(c.id)}
              />
            </li>
          ))}
        </ul>

        <div className={activeId != null ? "block" : "hidden lg:block"}>
          {activeId != null ? (
            <Thread id={activeId} onBack={() => setSelection("closed")} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-[var(--border-subtle)] text-sm text-[var(--text-muted)]">
              {t("messages.pickConversation")}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children, unread = 0 }: { children: React.ReactNode; unread?: number }) {
  const { t } = useTranslation();
  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-content)] mx-auto">
        <PageHeader
          title={t("messages.title")}
          description={
            unread > 0
              ? t("messages.unread", { count: unread })
              : t("messages.description")
          }
        />
        {children}
      </div>
    </section>
  );
}

function ThreadButton({
  conversation,
  active,
  onSelect,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-colors ${
        active
          ? "border-[var(--border-gold)] bg-[rgba(214,180,94,0.06)]"
          : "border-[var(--border-subtle)] hover:border-[var(--border-gold)]"
      }`}
      onClick={onSelect}
      aria-current={active}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm font-semibold text-white">
          {conversation.counterpartName}
        </span>
        {conversation.unreadCount > 0 && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] px-1.5 font-[family-name:var(--font-mono)] text-[0.6rem] text-[var(--bg-deep)]">
            {conversation.unreadCount}
          </span>
        )}
      </div>
      <p className="mt-0.5 truncate text-xs text-[var(--gold)]">{conversation.subject}</p>
      {conversation.lastMessagePreview && (
        <p className="mt-1.5 line-clamp-2 text-xs text-[var(--text-muted)]">
          {conversation.lastMessagePreview}
        </p>
      )}
    </button>
  );
}

function Thread({ id, onBack }: { id: number; onBack: () => void }) {
  const { t } = useTranslation();
  const { data: conversation, isLoading } = useConversation(id);
  const reply = useReply(id);
  const showToast = useUiStore((s) => s.showToast);
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [conversation?.messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    try {
      await reply.mutateAsync(body.trim());
      setBody("");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("messages.sendFailed"), "error");
    }
  }

  if (isLoading || !conversation) {
    return <Skeleton className="w-full h-64" />;
  }

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)]">
      <header className="flex items-center gap-3 border-b border-[var(--border-subtle)] p-4">
        <button
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--gold)] lg:hidden"
          onClick={onBack}
          aria-label={t("messages.backToConversations")}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-white">
            {conversation.counterpartName}
          </h2>
          <p className="truncate text-xs text-[var(--text-muted)]">
            {conversation.orderReference ? (
              <Link href="/orders" className="text-[var(--gold)] hover:underline">
                {t("messages.order", { reference: conversation.orderReference })}
              </Link>
            ) : conversation.productSlug ? (
              <Link
                href={`/product/${conversation.productSlug}`}
                className="text-[var(--gold)] hover:underline"
              >
                {conversation.productName}
              </Link>
            ) : (
              conversation.subject
            )}
          </p>
        </div>
      </header>

      <div className="flex max-h-[26rem] flex-col gap-3 overflow-y-auto p-4">
        {conversation.messages.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                m.mine
                  ? "bg-[var(--gold)] text-[var(--bg-deep)]"
                  : "border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
              <p
                className={`mt-1 font-[family-name:var(--font-mono)] text-[0.6rem] ${
                  m.mine ? "text-[rgba(5,7,13,0.6)]" : "text-[var(--text-muted)]"
                }`}
              >
                {new Date(m.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className="flex gap-2 border-t border-[var(--border-subtle)] p-4" onSubmit={send}>
        <label className="sr-only" htmlFor="reply-body">
          {t("messages.yourMessage")}
        </label>
        <textarea
          id="reply-body"
          className="input flex-1 resize-none"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={4000}
          placeholder={t("messages.placeholder")}
        />
        <button
          type="submit"
          className="btn btn-primary shrink-0 self-end"
          disabled={!body.trim() || reply.isPending}
          aria-label={t("messages.sendMessage")}
        >
          <PaperPlaneRight size={16} weight="fill" />
        </button>
      </form>
    </div>
  );
}
