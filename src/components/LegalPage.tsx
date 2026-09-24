"use client";

import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useT, useLanguage, setLanguage } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/translations";

/**
 * Shared shell for /privacy and /terms — both are draft legal pages, same
 * layout, different section keys. Kept as one component so the draft
 * banner and contact block only exist in one place.
 */
export default function LegalPage({
  titleKey,
  sectionPrefix,
  sectionKeys,
}: {
  titleKey: string;
  sectionPrefix: string;
  sectionKeys: string[];
}) {
  const t = useT();
  const lang = useLanguage();

  return (
    <div className="min-h-dvh bg-surface">
      <header className="flex items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink">
          <LogoMark className="h-4 w-8" />
          {t("legal.back")}
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-border text-[11px] font-semibold">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                onClick={() => setLanguage(l.value)}
                className={`px-2.5 py-1.5 transition ${
                  lang === l.value ? "bg-ink text-surface" : "text-ink-muted"
                }`}
              >
                {l.value.toUpperCase()}
              </button>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-20 pt-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">{t(titleKey)}</h1>
          <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-500">
            {t("legal.draftBadge")}
          </span>
        </div>
        <p className="mt-2 text-xs text-ink-muted">{t("legal.lastUpdated")}</p>
        <p className="mt-4 rounded-2xl border border-border bg-surface-card p-4 text-sm leading-relaxed text-ink-muted">
          {t("legal.draftNotice")}
        </p>

        <div className="mt-10 flex flex-col gap-8">
          {sectionKeys.map((key) => (
            <section key={key}>
              <h2 className="text-base font-bold text-ink">{t(`${sectionPrefix}.${key}.title`)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {t(`${sectionPrefix}.${key}.body`)}
              </p>
            </section>
          ))}

          <section>
            <h2 className="text-base font-bold text-ink">{t("legal.contactTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t("legal.contactBody")}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
