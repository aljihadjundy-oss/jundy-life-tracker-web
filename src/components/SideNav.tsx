"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import { useUserConfig } from "@/lib/user-context";
import { LogoMark } from "./Logo";
import { NAV_ITEMS } from "./nav-items";

/**
 * Navigasi tablet dan desktop.
 *
 * Dua bentuk dalam satu komponen, bukan dua komponen: di tablet (md) hanya
 * ikon, karena lebar layar masih berharga dan isi halaman yang harus
 * mendapatkannya; di desktop (lg) ikon plus label, karena ruangnya ada dan
 * label menghapus tebak-tebakan ikon.
 *
 * Ditulis sebagai rel tetap (fixed), bukan kolom flex, supaya halaman yang
 * panjang tetap bisa digulir tanpa navigasinya ikut hilang ke atas.
 */
export default function SideNav() {
  const pathname = usePathname();
  const t = useT();
  const { pillars } = useUserConfig();
  const items = NAV_ITEMS.filter((item) => item.pillar === null || pillars[item.pillar]);

  return (
    <nav className="fixed inset-y-0 left-0 z-40 hidden w-[4.5rem] flex-col border-r border-border bg-surface-card px-2 py-4 md:flex lg:w-56 lg:px-3">
      <Link
        href="/"
        className="mb-6 flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-ink transition hover:bg-surface-raised"
      >
        <LogoMark className="h-5 w-10 shrink-0" />
        <span className="hidden text-sm font-bold tracking-tight lg:block">
          Andropid<span className="text-brand-mid">.</span>
        </span>
      </Link>

      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              // Di tablet label disembunyikan tapi tetap ada di DOM, jadi
              // pembaca layar tetap menyebut tujuannya, bukan cuma "tautan".
              title={t(item.labelKey)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                active ? "bg-surface-raised text-ink" : "text-ink-muted hover:bg-surface-raised/60"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
              <span
                // sr-only, bukan hidden: di tablet labelnya tak terlihat tapi
                // tetap dibacakan pembaca layar, jadi tautannya tidak jadi
                // sekadar "tautan" tanpa tujuan.
                className={`text-sm sr-only lg:not-sr-only ${
                  active ? "font-semibold" : "font-medium"
                }`}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/pengaturan"
        aria-current={pathname === "/pengaturan" ? "page" : undefined}
        title={t("nav.settings")}
        className={`mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
          pathname === "/pengaturan"
            ? "bg-surface-raised text-ink"
            : "text-ink-muted hover:bg-surface-raised/60"
        }`}
      >
        <GearIcon className="h-5 w-5 shrink-0" />
        <span className="sr-only text-sm font-medium lg:not-sr-only">{t("nav.settings")}</span>
      </Link>
    </nav>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.51.6.9 1.15.99H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
