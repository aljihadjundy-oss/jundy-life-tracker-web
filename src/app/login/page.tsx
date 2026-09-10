"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";

export default function LoginPage() {
  const { user, loading, error, signInWithGoogle } = useAuth();
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-surface px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-start to-brand-end text-3xl font-bold text-white shadow-lg shadow-brand-start/30">
          JL
        </div>
        <h1 className="text-2xl font-bold text-ink">{t("app.name")}</h1>
        <p className="max-w-xs text-sm text-ink-muted">{t("app.tagline")}</p>
      </div>

      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="flex w-full max-w-xs items-center justify-center gap-3 rounded-2xl bg-ink px-6 py-4 text-base font-semibold text-surface shadow-md transition active:scale-95 disabled:opacity-50"
      >
        <GoogleIcon />
        {t("app.signInGoogle")}
      </button>

      {error && (
        <p className="max-w-xs rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {t(error)}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.9 2 2.8 6.1 2.8 12s4.1 10 9.2 10c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}
