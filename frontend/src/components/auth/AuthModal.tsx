"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "@phosphor-icons/react";
import { useUiStore } from "@/store/ui";
import { useLogin, useRegister } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function AuthModal() {
  const { t } = useTranslation();
  const { authOpen, authMode, closeAuth, openAuth } = useUiStore();
  const showToast = useUiStore((s) => s.showToast);
  const login = useLogin();
  const register = useRegister();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Entrance: scale from 0.97 + fade (modals stay centered, no origin anchor).
  // The rAF flips mounted on open; cleanup resets it on close so each reopen
  // replays the entrance.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!authOpen) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => {
      cancelAnimationFrame(id);
      setMounted(false);
    };
  }, [authOpen]);

  if (!authOpen) return null;

  const isSignup = authMode === "signup";
  const pending = login.isPending || register.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (isSignup) {
        await register.mutateAsync({ email, password, name });
        showToast(t("auth.welcomeName", { name }), "success");
      } else {
        await login.mutateAsync({ email, password });
        showToast(t("auth.welcomeBackTitle"), "success");
      }
      closeAuth();
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.somethingWentWrong"));
    }
  }

  return (
    <div
      className={`fixed inset-0 bg-black/80 z-[4000] flex items-center justify-center p-8 transition-opacity duration-200 ease-[var(--ease-out)] ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) closeAuth();
      }}
    >
      <div
        className={`bg-[var(--bg-surface)] border border-[var(--border-gold)] rounded-2xl max-w-[420px] w-full p-10 relative transition-[transform,opacity] duration-200 ease-[var(--ease-out)] ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        aria-describedby="auth-description"
      >
        <button
          className="absolute top-3 right-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-[var(--gold)]"
          onClick={closeAuth}
          aria-label={t("common.close")}
        >
          <X size={22} />
        </button>
        <h2 id="auth-title" className="font-[family-name:var(--font-display)] text-3xl text-white mb-1">
          {isSignup ? t("auth.createAccount") : t("auth.welcomeBackTitle")}
        </h2>
        <p id="auth-description" className="text-[var(--text-muted)] text-sm mb-6">
          {isSignup ? t("auth.joinToday") : t("auth.signInContinue")}
        </p>

        {error && (
          <div className="bg-[rgba(224,85,85,0.1)] text-[#e05555] p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-1">
              {t("auth.email")}
            </label>
            <input
              type="email"
              id="auth-email"
              autoComplete="email"
              required
              className="input"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-1">
              {t("auth.password")}
            </label>
            <input
              type="password"
              id="auth-password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={6}
              className="input"
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {isSignup && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-1">
                {t("auth.fullName")}
              </label>
              <input
                type="text"
                id="auth-name"
                autoComplete="name"
                required
                className="input"
                placeholder={t("auth.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary w-full" disabled={pending}>
            {pending ? t("auth.pleaseWait") : isSignup ? t("common.signUp") : t("common.signIn")}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-[var(--text-muted)]">
          {isSignup ? t("auth.alreadyHaveAccount") : t("auth.dontHaveAccount")}{" "}
          <button
            className="text-[var(--gold)] font-semibold hover:underline"
            onClick={() => {
              setError("");
              openAuth(isSignup ? "login" : "signup");
            }}
          >
            {isSignup ? t("common.signIn") : t("common.signUp")}
          </button>
        </p>
      </div>
    </div>
  );
}
