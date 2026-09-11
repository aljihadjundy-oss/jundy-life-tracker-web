"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { Logo } from "@/components/Logo";

/**
 * Loaded on its own, after the page is interactive. Under `output: "export"`
 * there is no server to render WebGL on, and more to the point the sign-in
 * button must never wait on a decorative canvas.
 */
const Globe = dynamic(() => import("@/components/ui/globe"), { ssr: false });

/**
 * Defined at module scope so the reference is stable — the globe reads its
 * config when it builds, and a fresh object each render would be wasted work.
 * The markers are decoration, not data: this app tracks nothing geographic,
 * so they are scattered rather than claiming to mean anything.
 */
const GLOBE_CONFIG = {
  markers: [
    { location: [-6.2088, 106.8456] as [number, number], size: 0.09 },
    { location: [-3.6954, 128.1814] as [number, number], size: 0.05 },
    { location: [-7.2575, 112.7521] as [number, number], size: 0.05 },
    { location: [1.3521, 103.8198] as [number, number], size: 0.04 },
    { location: [35.6762, 139.6503] as [number, number], size: 0.05 },
    { location: [51.5074, -0.1278] as [number, number], size: 0.05 },
    { location: [40.7128, -74.006] as [number, number], size: 0.06 },
  ],
};

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
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-surface">
      {/* Cropped by the bottom edge so it reads as a horizon rather than a
          floating ball, and so nothing ever sits on top of the sign-in button. */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div className="relative aspect-square w-[min(150vw,760px)] translate-y-[34%]">
          <Globe config={GLOBE_CONFIG} />
        </div>
      </div>

      {/* Softens the globe's top edge into the background. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[42%] top-0 bg-gradient-to-b from-surface via-surface to-transparent" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-[42vh] text-center">
      <div className="flex flex-col items-center gap-3">
        <Logo className="text-ink" detailed />
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
