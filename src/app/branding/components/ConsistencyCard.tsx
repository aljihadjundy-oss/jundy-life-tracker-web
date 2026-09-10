export default function ConsistencyCard({
  streak,
  postsThisWeek,
  last14Days,
}: {
  streak: number;
  postsThisWeek: number;
  last14Days: { date: string; posted: boolean }[];
}) {
  return (
    <div className="mx-5 rounded-3xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-400 p-5 text-white shadow-lg shadow-pink-500/20">
      <p className="text-xs font-medium text-white/80">Konsistensi Posting</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">
        {streak > 0 ? `🔥 ${streak} hari beruntun` : "Belum ada streak"}
      </p>
      <p className="mt-1 text-xs text-white/85">{postsThisWeek} post minggu ini</p>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {last14Days.map((d) => (
          <div
            key={d.date}
            className={`aspect-square rounded-md ${d.posted ? "bg-white" : "bg-white/20"}`}
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] text-white/70">14 hari terakhir</p>
    </div>
  );
}
