"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Logo, LogoMark } from "@/components/Logo";
import { NAV_ITEMS, type IconProps } from "@/components/nav-items";
import { useT, useLanguage, setLanguage, type Translate } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/translations";
import { applySkin, readSkin, SKINS, subscribeSkin, type Skin } from "@/lib/skin";
import WaitlistForm from "@/components/WaitlistForm";
import { useEffect, useState, useSyncExternalStore } from "react";

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

/** 2 = kotak lebar (lg:col-span-2) di grid bento pilar, 1 = kotak normal. */
const BENTO_SPAN: Record<string, 1 | 2> = {
  "/keuangan": 2,
  "/waktu": 2,
  "/branding": 2,
  "/kesehatan": 1,
  "/jurnal": 1,
};

const TRUST_KEYS = ["isolation", "offline", "backup", "invite"] as const;
const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;

/**
 * Belum ada screenshot asli. `src` menunjuk ke file yang belum ada di
 * `public/screenshots/` — begitu file itu ditambahkan (nama & path sama
 * persis), <img>-nya langsung tampil sendiri lewat onError fallback di
 * ScreenshotSlot, tanpa perlu ubah kode lagi.
 */
const SCREEN_SLOTS = [
  { key: "today", file: "public/screenshots/today.png" },
  { key: "keuangan", file: "public/screenshots/keuangan.png" },
  { key: "kalender", file: "public/screenshots/kalender.png" },
  { key: "jurnal", file: "public/screenshots/jurnal.png" },
  { key: "settings", file: "public/screenshots/settings.png" },
] as const;
const SCREEN_SIZE = "390×844";

const NAV_LINKS = [
  { href: "#pilar", labelKey: "landing.nav.pillars" },
  { href: "#fondasi", labelKey: "landing.nav.foundation" },
  { href: "#faq", labelKey: "landing.nav.faq" },
] as const;

export default function LandingContent() {
  const t = useT();
  const lang = useLanguage();
  const skin = useSyncExternalStore(subscribeSkin, readSkin, () => "instagram" as Skin);
  const [openFaq, setOpenFaq] = useState<string | null>(FAQ_KEYS[0]);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sengaja bukan floating navbar penuh ala Anitya (fixed + spacer) — pill ini
  // tetap `sticky` di dalam flow dokumen, jadi tidak perlu spacer manual untuk
  // mengimbangi tinggi navbar. Efek "melayang" datang dari padding di sekitar
  // pill dan bayangan yang muncul begitu halaman digulir.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-dvh bg-surface">
      {/* --- Nav ------------------------------------------------------- */}
      <header className="sticky top-0 z-30 px-4 pt-3 sm:px-6">
        <div
          className={`mx-auto max-w-3xl rounded-3xl border border-border bg-surface/85 backdrop-blur-lg transition-shadow ${
            scrolled ? "shadow-lg" : "shadow-none"
          }`}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <Link href="/" className="flex items-center gap-2 text-ink">
              <LogoMark className="h-4 w-8" />
              <span className="text-sm font-bold tracking-tight">
                Andropid<span className="text-brand-mid">.</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:text-ink"
                >
                  {t(link.labelKey)}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
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

            <div className="flex items-center gap-1.5 md:hidden">
              <div className="flex overflow-hidden rounded-full border border-border text-[11px] font-semibold">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLanguage(l.value)}
                    className={`px-2 py-1 transition ${
                      lang === l.value ? "bg-ink text-surface" : "text-ink-muted"
                    }`}
                  >
                    {l.value.toUpperCase()}
                  </button>
                ))}
              </div>
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen((open) => !open)}
                aria-label={t(mobileOpen ? "landing.nav.closeMenu" : "landing.nav.openMenu")}
                aria-expanded={mobileOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink"
              >
                <HamburgerIcon open={mobileOpen} className="h-4 w-4" />
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="border-t border-border px-3 py-3 md:hidden">
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-muted transition hover:bg-surface-raised hover:text-ink"
                  >
                    {t(link.labelKey)}
                  </a>
                ))}
              </nav>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-2 block rounded-full bg-ink px-4 py-2.5 text-center text-sm font-bold text-surface transition active:scale-95"
              >
                {t("landing.nav.signIn")}
              </Link>
            </div>
          )}
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
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pt-16 pb-14 md:pt-24 md:pb-20 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">
              {t("landing.hero.eyebrow")}
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink md:text-6xl">
              {t("landing.hero.headline")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-muted md:text-lg lg:mx-0">
              {t("landing.hero.subheadline")}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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

          <HeroMockup t={t} />
        </div>
      </section>

      {/* --- Screenshot/demo (placeholder sampai asetnya ada) --------------- */}
      <section className="mx-auto max-w-5xl px-5 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
            {t("landing.screens.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted md:text-base">
            {t("landing.screens.subtitle")}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SCREEN_SLOTS.map((slot) => (
            <ScreenshotSlot
              key={slot.key}
              src={`/${slot.file.replace("public/", "")}`}
              label={t(`landing.screens.${slot.key}`)}
              todo={t("landing.screens.todo", { file: slot.file, size: SCREEN_SIZE })}
            />
          ))}
        </div>
      </section>

      {/* --- Lima pilar (bento grid di desktop) ----------------------------- */}
      {/* Ukuran kotak bukan dekorasi acak — mengikuti urutan penekanan yang
          sudah ditulis di landing.pillars.subtitle: Keuangan & Waktu jadi
          inti (kotak besar), Branding pembeda (kotak medium), Kesehatan &
          Jurnal pelengkap (kotak kecil), gamifikasi jadi penutup selebar
          grid karena menembus kelimanya, bukan modul ke-6. Di mobile/tablet
          semua kembali seragam satu/dua kolom — variasi ukuran cuma masuk
          akal kalau ruangnya cukup. */}
      <section id="pilar" className="mx-auto max-w-6xl px-5 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
            {t("landing.pillars.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted md:text-base">
            {t("landing.pillars.subtitle")}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLAR_HREFS.map((href) => {
            const Icon = iconFor(href);
            const key = href.slice(1);
            const big = BENTO_SPAN[href] === 2;
            return (
              <div
                key={href}
                className={`rounded-2xl border border-border bg-surface-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-md ${
                  big ? "lg:col-span-2" : "lg:col-span-1"
                }`}
              >
                <div
                  className={`flex items-center justify-center rounded-2xl ${ACCENT_BG_CLASS[href]} ${ACCENT_CLASS[href]} ${
                    big ? "h-14 w-14" : "h-12 w-12"
                  }`}
                >
                  <Icon className={big ? "h-6 w-6" : "h-5 w-5"} strokeWidth={2} />
                </div>
                <h3 className={`mt-4 font-bold text-ink ${big ? "text-base" : "text-sm"}`}>
                  {t(`landing.pillar.${key}.title`)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {t(`landing.pillar.${key}.body`)}
                </p>
              </div>
            );
          })}

          {/* Kartu keenam sengaja bukan pilar — gamifikasi menembus kelimanya,
              bukan modul tersendiri, jadi ditempatkan sebagai penutup grid
              selebar penuh (lg:col-span-4). */}
          <div className="rounded-2xl border border-border bg-surface-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:col-span-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-start to-brand-end text-white">
              <BoltIcon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-ink">{t("landing.gamify.title")}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{t("landing.gamify.body")}</p>
          </div>
        </div>
      </section>

      {/* --- Fondasi: fakta yang bisa diverifikasi, bukan angka bombastis --- */}
      <section id="fondasi" className="mx-auto max-w-5xl px-5 py-14">
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
      <section id="faq" className="mx-auto max-w-2xl px-5 py-14">
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
      <section id="waitlist" className="bg-ink px-5 py-16 text-center text-surface">
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

        <div className="mx-auto mt-10 max-w-sm rounded-3xl bg-surface p-6 text-ink">
          <h3 className="text-base font-bold text-ink">{t("landing.waitlist.title")}</h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t("landing.waitlist.subtitle")}</p>
          <div className="relative mt-4">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* --- Footer ------------------------------------------------------ */}
      <footer className="border-t border-border px-5 py-8 text-center">
        <Logo className="mx-auto text-ink" />
        <p className="mt-3 text-xs text-ink-muted">{t("landing.footer.byline")}</p>
        <div className="mt-3 flex justify-center gap-4 text-xs font-semibold text-ink-muted">
          <Link href="/privacy" className="hover:text-ink">
            {t("landing.footer.privacy")}
          </Link>
          <Link href="/terms" className="hover:text-ink">
            {t("landing.footer.terms")}
          </Link>
        </div>
      </footer>

      {/* --- WhatsApp mengambang: satu-satunya kontak nyata yang ada -------- */}
      <a
        href="https://wa.me/6281387073047"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-3 pr-4 text-sm font-bold text-white shadow-lg shadow-[#25D366]/30 transition hover:-translate-y-0.5 active:scale-95"
      >
        <WhatsAppIcon className="h-5 w-5" />
        {t("landing.contact.whatsapp")}
      </a>
    </div>
  );
}

/**
 * Tiga kartu melayang di sisi kanan hero (desktop saja) — pola yang sama
 * dengan mockup produk yang biasa dipakai landing page SaaS: bukan
 * screenshot asli, cuma ilustrasi cara kerja fitur yang memang ada. Setiap
 * kartu diberi label "Contoh tampilan" secara eksplisit supaya tidak
 * disalahartikan sebagai data pengguna sungguhan — sama seperti aturan main
 * di seluruh halaman ini: tidak ada yang dikarang, dan yang ilustratif
 * ditandai jelas sebagai ilustratif.
 */
function HeroMockup({ t }: { t: Translate }) {
  return (
    <div className="relative hidden h-[420px] lg:block">
      <div
        aria-hidden
        className="absolute inset-8 -z-10 rounded-[48px] bg-gradient-to-br from-brand-start/20 via-brand-mid/10 to-transparent blur-2xl"
      />

      {/* Kartu tren saldo — fitur nyata: saldo dihitung otomatis dari transaksi. */}
      <div className="absolute left-0 top-6 w-[70%] rounded-2xl border border-border bg-surface-card p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink">{t("landing.hero.mockup.trend.title")}</span>
          <span className="rounded-full bg-accent-finance/10 px-2 py-0.5 text-[10px] font-bold text-accent-finance">
            {t("landing.hero.mockup.trend.badge")}
          </span>
        </div>
        <svg viewBox="0 0 200 60" className="mt-3 h-14 w-full" preserveAspectRatio="none">
          <polyline
            points="0,45 25,38 50,42 75,28 100,32 125,18 150,22 175,10 200,14"
            fill="none"
            className="stroke-accent-finance"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-2 text-[10px] text-ink-muted">{t("landing.hero.mockup.caption")}</p>
      </div>

      {/* Kartu reminder — fitur nyata: reminder terjadwal sebelum jam mulai task. */}
      <div className="absolute right-0 top-0 w-[62%] rounded-2xl border border-border bg-surface-card p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-time/10 text-accent-time">
            <BellIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-ink">{t("landing.hero.mockup.reminder.title")}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
              {t("landing.hero.mockup.reminder.body")}
            </p>
          </div>
        </div>
      </div>

      {/* Kartu privasi — fakta yang sama dengan section Fondasi di bawah, bukan klaim baru. */}
      <div className="absolute bottom-6 right-4 w-[68%] rounded-2xl border border-border bg-surface-card p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-health/10 text-accent-health">
            <ShieldIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-ink">{t("landing.hero.mockup.privacy.title")}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
              {t("landing.hero.mockup.privacy.body")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BellIcon({ className }: { className?: string }) {
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
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
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
      <path d="M12 2 4 5v6c0 5.25 3.5 9.5 8 11 4.5-1.5 8-5.75 8-11V5z" />
    </svg>
  );
}

/**
 * Menampilkan screenshot asli begitu ada di `src` — sampai itu terjadi,
 * `onError` menangkap 404-nya dan menampilkan placeholder dengan instruksi
 * persis file mana yang harus ditambahkan Jundy. Jadi menambahkan aset asli
 * cuma butuh menaruh file di path yang sama, tidak perlu sentuh kode ini.
 */
function ScreenshotSlot({ src, label, todo }: { src: string; label: string; todo: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="aspect-[9/19] w-full overflow-hidden rounded-2xl border border-border bg-surface-raised">
        {!failed ? (
          // eslint-disable-next-line @next/next/no-img-element -- konten pemasaran statis, bukan aset yang perlu optimasi Next/Image.
          <img
            src={src}
            alt={label}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">{label}</span>
            <span className="text-[9px] leading-relaxed text-ink-muted/70">{todo}</span>
          </div>
        )}
      </div>
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
    </div>
  );
}

function HamburgerIcon({ open, className }: { open: boolean; className?: string }) {
  // Bar 1 dan 3 pindah ke garis tengah (y=12) dulu sebelum dirotasi — rotasi
  // di sekitar titik pivot (12,12) yang bukan titik tengahnya sendiri bikin
  // garisnya melenceng, bukan membentuk X yang rapi.
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <line
        x1="4"
        y1={open ? 12 : 7}
        x2="20"
        y2={open ? 12 : 7}
        className="transition-all"
        transform={open ? "rotate(45 12 12)" : undefined}
      />
      <line x1="4" y1="12" x2="20" y2="12" className={`transition-opacity ${open ? "opacity-0" : ""}`} />
      <line
        x1="4"
        y1={open ? 12 : 17}
        x2="20"
        y2={open ? 12 : 17}
        className="transition-all"
        transform={open ? "rotate(-45 12 12)" : undefined}
      />
    </svg>
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.33 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.55 3.7-8.25 8.25-8.25 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.25 8.24Zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.99-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.48-.01a.92.92 0 0 0-.67.31c-.23.25-.87.85-.87 2.08s.89 2.41 1.02 2.58c.12.16 1.75 2.67 4.24 3.75.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.23-.17-.47-.29Z" />
    </svg>
  );
}
