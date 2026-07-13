"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle } from "@phosphor-icons/react";
import { useMe } from "@/lib/auth";
import { useUiStore } from "@/store/ui";
import { apiFetch, ApiError } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountPage() {
  const { data: user, isLoading } = useMe();
  const openAuth = useUiStore((s) => s.openAuth);

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-narrow)] mx-auto">
        <PageHeader title="My Profile" />

        {isLoading ? (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-10">
            <Skeleton className="w-full h-4 mb-6" />
            <Skeleton className="w-full h-12 mb-4" />
            <Skeleton className="w-full h-12 mb-4" />
            <Skeleton className="w-full h-12 mb-6" />
            <Skeleton className="w-full h-11 rounded-full" />
          </div>
        ) : (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-10">
            {user ? (
              <AccountForm key={user.id} user={user} />
            ) : (
              <EmptyState
                icon={<UserCircle size={32} />}
                title="Sign in to manage your account"
                action={
                  <button className="btn btn-primary" onClick={() => openAuth("login")}>
                    Sign In
                  </button>
                }
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function AccountForm({ user }: { user: User }) {
  const qc = useQueryClient();
  const router = useRouter();
  const showToast = useUiStore((s) => s.showToast);

  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await apiFetch("/me", {
        method: "PATCH",
        body: { name, email, phone },
      });
      qc.setQueryData(["me"], updated);
      showToast("Profile updated successfully!", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Update failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      return;
    }
    try {
      await apiFetch("/me", { method: "DELETE" });
      qc.setQueryData(["me"], null);
      showToast("Account deleted.", "success");
      router.push("/");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Delete failed.", "error");
    }
  }

  return (
    <form onSubmit={handleUpdate} className="flex flex-col gap-4">
      <p className="text-[var(--text-secondary)] mb-2">
        Manage your personal information and preferences.
      </p>
      <div>
        <label className="field-label">Full Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="field-label">Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="field-label">Phone</label>
        <input
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+251 9X XXX XXXX"
        />
        <p className="field-help">Used for order and delivery updates.</p>
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={saving}>
        {saving ? "Saving…" : "Update Profile"}
      </button>
      <hr className="border-[var(--border-subtle)] my-2" />
      <button type="button" className="btn btn-danger w-full" onClick={handleDelete}>
        Delete Account
      </button>
    </form>
  );
}
