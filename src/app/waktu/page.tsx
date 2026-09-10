import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import ComingSoon from "@/components/ComingSoon";

export default function WaktuPage() {
  return (
    <AppShell>
      <TopBar title="Waktu" subtitle="Task & jadwal harian" />
      <ComingSoon
        emoji="🗓️"
        title="Modul Waktu"
        description="Task list, calendar, due date, dan status progress bakal ada di sini."
        gradient="from-blue-400 to-indigo-500"
      />
    </AppShell>
  );
}
