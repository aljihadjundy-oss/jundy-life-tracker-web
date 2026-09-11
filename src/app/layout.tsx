import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import RegisterSW from "@/components/RegisterSW";
import CelebrationLayer from "@/components/CelebrationLayer";
import NotifyLayer from "@/components/NotifyLayer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Andropid",
  description: "Keuangan, waktu, branding, kesehatan, dan jurnal — dalam satu tempat.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Andropid",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

/**
 * Memulihkan kulit dan mode terang/gelap SEBELUM halaman digambar.
 *
 * Harus berupa skrip mentah di <head>, bukan efek React: kalau menunggu React
 * menyala, layar sempat menggambar permukaan terang lebih dulu dan pengguna
 * yang memilih gelap akan disambut kedipan putih tiap kali membuka aplikasi.
 */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');

    var skin = localStorage.getItem('skin');
    document.documentElement.dataset.skin = skin === 'moon' ? 'moon' : 'instagram';
  } catch (e) {
    document.documentElement.dataset.skin = 'instagram';
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col overscroll-none">
        <AuthProvider>
          {children}
          <CelebrationLayer />
          <NotifyLayer />
        </AuthProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
