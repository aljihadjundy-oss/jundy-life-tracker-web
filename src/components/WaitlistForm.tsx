"use client";

import { useState, type FormEvent } from "react";
import { useT } from "@/lib/i18n";
import { isValidWaitlistEmail, joinWaitlist } from "@/lib/waitlist";

type Status = "idle" | "submitting" | "success" | "error";

export default function WaitlistForm() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [useCase, setUseCase] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, see below
  const [status, setStatus] = useState<Status>("idle");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidWaitlistEmail(email)) {
      setStatus("error");
      setErrorKey("landing.waitlist.errorInvalidEmail");
      return;
    }
    setStatus("submitting");
    try {
      await joinWaitlist({ email, name, useCase, website });
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorKey("landing.waitlist.errorGeneric");
    }
  }

  if (status === "success") {
    return (
      <p className="rounded-2xl border border-border bg-surface-card p-5 text-center text-sm font-semibold text-ink">
        {t("landing.waitlist.success")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-muted">
          {t("landing.waitlist.emailLabel")}
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("landing.waitlist.emailPlaceholder")}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-muted">
          {t("landing.waitlist.nameLabel")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("landing.waitlist.namePlaceholder")}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-muted">
          {t("landing.waitlist.useCaseLabel")}
        </label>
        <textarea
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          placeholder={t("landing.waitlist.useCasePlaceholder")}
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
        />
      </div>

      {/* Honeypot: invisible to real visitors (off-screen, not display:none —
          some bots skip fields that are display:none or type="hidden"), never
          reachable by keyboard. Anyone who fills it gets a silent fake
          success in joinWaitlist() instead of a write. */}
      <div className="absolute h-0 w-0 overflow-hidden" style={{ left: "-9999px" }} aria-hidden="true">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {status === "error" && errorKey && (
        <p className="text-xs font-semibold text-red-500">{t(errorKey)}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-2xl bg-ink px-6 py-3.5 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-50"
      >
        {status === "submitting" ? t("landing.waitlist.submitting") : t("landing.waitlist.submit")}
      </button>
    </form>
  );
}
