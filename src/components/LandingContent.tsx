"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Logo, LogoMark } from "@/components/Logo";
import { NAV_ITEMS, type IconProps } from "@/components/nav-items";
import { useT, useLanguage, setLanguage } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/translations";
import { applySkin, readSkin, SKINS, subscribeSkin, type Skin } from "@/lib/skin";
import { useState, useSyncExternalStore } from "react";

/**
 * Halaman pemasaran publik — dirender di root ("/") persis saat pengunjung
 * BELUM login (lihat src/app/page.tsx). Yang sudah login tidak pernah melihat
 * ini; mereka mendarat di dashboard seperti biasa. Jadi ini bukan halaman
 * berdiri sendiri, melainkan cabang dari halaman Home, sengaja tidak
 * dibungkus AppShell karena tugasnya menjelaskan dan meyakinkan pengunjung
 * yang belum punya akun, bukan menyimpan data.
 *
 * Satu batasan jujur yang membentuk seluruh isi halaman ini: TIDAK ADA bukti
 * sosial yang bisa dipakai. Tidak ada jumlah pengguna, testimoni, atau rating
 * yang nyata untuk ditampilkan — mengarang salah satu dari itu akan jadi
 * klaim palsu. Yang ditawarkan sebagai gantinya adalah kejujuran soal cara
 * kerja produknya, dan satu demo yang bisa dibuktikan di tempat: tombol ganti
 * gaya tampilan di bawah benar-benar mengganti tema halaman ini sendiri.
 */

const PILLAR_HREFS = ["/keuangan", "/waktu", "/branding", "/kesehatan", "/jurnal"] as const;

function iconFor(href: string): (props: IconProps) => React.ReactElement {
  return NAV_ITEMS.find((item) => item.href === href)!.icon;
}

const ACCENT_CLASS: Record<string, string> = {
  "/keuangan": "text-accent-finance",
  "/waktu": "text-accent-time",
  "/branding": "text-accent-branding",
  "/kesehatan": "text-accent-health",
  "/jurnal": "text-brand-mid",
};

const ACCENT_BG_CLASS: Record<string, string> = {
  "/keuangan": "bg-accent-finance/10",
  "/waktu": "bg-accent-time/10",
  "/branding": "bg-accent-branding/10",
  "/kesehatan": "bg-accent-health/10",
  "/jurnal": "bg-brand-mid/10",
};

const TRUST_KEYS = ["isolation", "offline", "backup", "invite"] as const;
const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;

export default function LandingContent() {
  const t = useT();
  const lang = useLanguage();
  const skin = useSyncExternalStore(subscribeSkin, readSkin, () => "instagram" as Skin);
  const [openFaq, setOpenFaq] = useState<string | null>(FAQ_KEYS[0]);

  return (
    <div className="min-h-dvh bg-surface">
      {/* --- Nav ------------------------------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2 text-ink">
            <LogoMark className="h-4 w-8" />
            <span className="text-sm font-bold tracking-tight">
              Andropid<span className="text-brand-mid">.</span>
            </span>
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
            <Link
              href="/login"
              className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95"
            >
              {t("landing.nav.signIn")}
            </Link>
          </div>
        </div>
      </header>

      {/* --- Hero -------------------------------------------------------- */}
      {/* Blobs are purely decorative — Andropid's own brand-token gradient,
          not a claim about anything. Mirrors Mekari's blurred hero backdrop
          without borrowing its literal purple palette. */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-start via-brand-mid to-brand-end opacity-20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-32 h-56 w-56 rounded-full bg-accent-branding opacity-15 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-5 pt-16 pb-14 text-center md:pt-24 md:pb-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">
            {t("landing.hero.eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink md:text-6xl">
            {t("landing.hero.headline")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
            {t("landing.hero.subheadline")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="rounded-2xl bg-ink px-8 py-4 text-base font-bold text-surface shadow-md transition active:scale-95"
              >
                {t("landing.hero.cta")}
              </Link>
              <a
                href="#pilar"
                className="rounded-2xl border border-border px-8 py-4 text-base font-bold text-ink transition hover:border-ink/30 active:scale-95"
              >
                {t("landing.hero.ctaSecondary")}
              </a>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-ink-muted">
              {t("landing.hero.ctaNote")}
            </p>
          </div>
        </div>
      </section>

      {/* --- Lima pilar ---------------------------------------------------- */}
      <section id="pilar" className="mx-auto max-w-5xl px-5 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
            {t("landing.pillars.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted md:text-base">
            {t("landing.pillars.subtitle")}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLAR_HREFS.map((href) => {
            const Icon = iconFor(href);
            const key = href.slice(1);
            return (
              <div
                key={href}
                className="rounded-2xl border border-border bg-surface-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-md"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${ACCENT_BG_CLASS[href]} ${ACCENT_CLASS[href]}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-ink">{t(`landing.pillar.${key}.title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {t(`landing.pillar.${key}.body`)}
                </p>
              </div>
            );
          })}

          {/* Kartu keenam sengaja bukan pilar — gamifikasi menembus kelimanya,
              bukan modul tersendiri, jadi ditempatkan sebagai penutup grid. */}
          <div className="rounded-2xl border border-border bg-surface-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-start to-brand-end text-white">
              <BoltIcon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-ink">{t("landing.gamify.title")}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{t("landing.gamify.body")}</p>
          </div>
        </div>
      </section>

      {/* --- Fondasi: fakta yang bisa diverifikasi, bukan angka bombastis --- */}
      <section className="mx-auto max-w-5xl px-5 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
            {t("landing.trust.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted md:text-base">
            {t("landing.trust.subtitle")}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TRUST_KEYS.map((key) => (
            <div key={key} className="rounded-2xl border border-border bg-surface-card p-5">
              <h3 className="text-sm font-bold text-ink">{t(`landing.trust.${key}.title`)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {t(`landing.trust.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Dua gaya tampilan: demo hidup, bukan sekadar klaim ------------- */}
      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
          {t("landing.skins.title")}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted md:text-base">
          {t("landing.skins.subtitle")}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          {SKINS.map((option) => (
            <button
              key={option}
              onClick={() => applySkin(option)}
              aria-pressed={skin === option}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition active:scale-95 ${
                skin === option ? "border-ink bg-ink text-surface" : "border-border text-ink"
              }`}
            >
              {t(`landing.skins.${option}`)}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-ink-muted">{t("landing.skins.hint")}</p>
      </section>

      {/* --- FAQ: jujur, bukan diisi pertanyaan yang mengarahkan ------------ */}
      <section className="mx-auto max-w-2xl px-5 py-14">
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
          {t("landing.faq.title")}
        </h2>
        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-surface-card">
          {FAQ_KEYS.map((key) => {
            const isOpen = openFaq === key;
            return (
              <div key={key}>
                <button
                  onClick={() => setOpenFaq(isOpen ? null : key)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-ink">{t(`landing.faq.${key}`)}</span>
                  <span
                    className={`shrink-0 text-lg text-ink-muted transition-transform ${isOpen ? "rotate-45" : ""}`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-sm leading-relaxed text-ink-muted">
                    {t(`landing.faq.a${key.slice(1)}`)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* --- Akses: pita CTA kontras, dari token ink/surface sendiri -------- */}
      <section className="bg-ink px-5 py-16 text-center text-surface">
        <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">
          {t("landing.access.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-surface/70">
          {t("landing.access.body")}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-2xl bg-surface px-8 py-4 text-sm font-bold text-ink shadow-md transition active:scale-95"
        >
          {t("landing.hero.cta")}
        </Link>
      </section>

      {/* --- Footer ------------------------------------------------------ */}
      <footer className="border-t border-border px-5 py-8 text-center">
        <Logo className="mx-auto text-ink" />
        <p className="mt-3 text-xs text-ink-muted">{t("landing.footer.byline")}</p>
      </footer>
    </div>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}
