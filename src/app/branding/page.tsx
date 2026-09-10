import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import ComingSoon from "@/components/ComingSoon";

export default function BrandingPage() {
  return (
    <AppShell>
      <TopBar title="Branding" subtitle="Content calendar & reputasi" />
      <ComingSoon
        emoji="✨"
        title="Modul Branding"
        description="Content calendar, tracking platform & tanggal posting, konsistensi konten bakal ada di sini."
        gradient="from-pink-400 to-fuchsia-500"
      />
    </AppShell>
  );
}
