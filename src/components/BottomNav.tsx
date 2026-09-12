"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import { useUserConfig } from "@/lib/user-context";
import { NAV_ITEMS } from "./nav-items";
import LimelightNav from "./ui/limelight-nav";

/**
 * Navigasi ponsel. Di tablet dan desktop digantikan SideNav — jempol tidak
 * menjangkau dasar layar 27 inci, dan pita melintang selebar itu memisahkan
 * kendali dari isi yang dikendalikannya.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  const { pillars } = useUserConfig();
  const items = NAV_ITEMS.filter((item) => item.pillar === null || pillars[item.pillar]);

  // Indeks diturunkan dari rute, bukan dari klik terakhir. Menekan Kembali atau
  // berpindah lewat tautan lain tetap menggeser sorotnya ke tempat yang benar.
  // -1 saat berada di halaman yang tidak punya tombolnya sendiri (Pengaturan),
  // dan di situ sorotnya memang tidak seharusnya menunjuk apa pun.
  const activeIndex = items.findIndex((item) => item.href === pathname);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur-lg md:hidden">
      <LimelightNav
        activeIndex={activeIndex}
        count={items.length}
        className="mx-auto max-w-md px-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
      >
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-1.5 transition-transform active:scale-90"
            >
              <Icon
                className={`h-6 w-6 transition-colors ${active ? "text-ink" : "text-ink-muted"}`}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${active ? "text-ink" : "text-ink-muted"}`}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </LimelightNav>
    </nav>
  );
}
