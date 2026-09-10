import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import ComingSoon from "@/components/ComingSoon";

export default function KesehatanPage() {
  return (
    <AppShell>
      <TopBar title="Kesehatan" subtitle="Habit & metrik harian" />
      <ComingSoon
        emoji="❤️"
        title="Modul Kesehatan"
        description="Habit tracker harian, log jam tidur, olahraga, dan air minum bakal ada di sini."
        gradient="from-orange-400 to-red-500"
      />
    </AppShell>
  );
}
