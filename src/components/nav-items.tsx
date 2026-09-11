import type { PillarKey } from "@/types/profile";

/**
 * Sumber tunggal untuk isi navigasi dan ikonnya, dipakai oleh navigasi bawah
 * (ponsel) dan rel samping (tablet dan desktop). Digandakan ke dua berkas akan
 * berarti menambah pilar baru di satu tempat dan melupakan yang lain.
 */
export type NavItem = {
  href: string;
  labelKey: string;
  icon: (props: IconProps) => React.ReactElement;
  pillar: PillarKey | null;
};

// `pillar: null` marks a tab that is always present.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "nav.home", icon: HomeIcon, pillar: null },
  { href: "/keuangan", labelKey: "nav.finance", icon: WalletIcon, pillar: "finance" },
  { href: "/waktu", labelKey: "nav.time", icon: CalendarIcon, pillar: "time" },
  { href: "/branding", labelKey: "nav.branding", icon: SparkIcon, pillar: "branding" },
  { href: "/kesehatan", labelKey: "nav.health", icon: HeartIcon, pillar: "health" },
  { href: "/jurnal", labelKey: "nav.journal", icon: PenIcon, pillar: "journal" },
];

export type IconProps = { className?: string; strokeWidth?: number };

function HomeIcon({ className, strokeWidth }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function WalletIcon({ className, strokeWidth }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CalendarIcon({ className, strokeWidth }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function SparkIcon({ className, strokeWidth }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}

function HeartIcon({ className, strokeWidth }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20s-7-4.4-9.5-8.8C.8 7.8 2.6 4.5 6 4a5 5 0 0 1 6 2 5 5 0 0 1 6-2c3.4.5 5.2 3.8 3.5 7.2C19 15.6 12 20 12 20z" />
    </svg>
  );
}

function PenIcon({ className, strokeWidth }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
