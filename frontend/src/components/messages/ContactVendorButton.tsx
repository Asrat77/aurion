"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatCircleText } from "@phosphor-icons/react";
import { useMe } from "@/lib/auth";
import { useStartConversation } from "@/lib/messages";
import { ApiError } from "@/lib/api";
import { useUiStore } from "@/store/ui";

/**
 * Opens a thread with a vendor about a product or an order. Renders nothing for
 * the vendor's own account — messaging yourself is not a feature.
 */
export default function ContactVendorButton({
  vendorId,
  vendorName,
  productId,
  orderId,
  className = "",
}: {
  vendorId: number;
  vendorName: string;
  productId?: number;
  orderId?: number;
  className?: string;
}) {
  const router = useRouter();
  const { data: user } = useMe();
  const openAuth = useUiStore((s) => s.openAuth);
  const showToast = useUiStore((s) => s.showToast);
  const start = useStartConversation();

  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");

  if (user?.vendor?.id === vendorId) return null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    try {
      await start.mutateAsync({
        vendor_id: vendorId,
        product_id: productId,
        order_id: orderId,
        body: body.trim(),
      });
      showToast("Message sent.", "success");
      setOpen(false);
      setBody("");
      router.push("/messages");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not send your message.", "error");
    }
  }

  if (!open) {
    return (
      <button
        className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-sm text-[var(--gold)] hover:underline ${className}`}
        onClick={() => (user ? setOpen(true) : openAuth("login"))}
      >
        <ChatCircleText size={16} /> Message {vendorName}
      </button>
    );
  }

  return (
    <form
      className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-deep)] p-4"
      onSubmit={send}
    >
      <label className="field-label" htmlFor={`message-${vendorId}-${productId ?? orderId ?? 0}`}>
        Message {vendorName}
      </label>
      <textarea
        id={`message-${vendorId}-${productId ?? orderId ?? 0}`}
        className="input resize-none"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={4000}
        placeholder="Ask about stock, shipping, or anything else."
        autoFocus
      />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!body.trim() || start.isPending}>
          {start.isPending ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
