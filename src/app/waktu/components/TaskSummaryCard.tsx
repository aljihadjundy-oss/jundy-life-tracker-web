export default function TaskSummaryCard({
  todo,
  inProgress,
  done,
  overdue,
}: {
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}) {
  return (
    <div className="mx-5 rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 p-5 text-white shadow-lg shadow-indigo-500/20">
      <p className="text-xs font-medium text-white/80">Task Kamu</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">
        {todo + inProgress} aktif{overdue > 0 ? `, ${overdue} telat` : ""}
      </p>

      <div className="mt-4 flex gap-3">
        <Stat label="To Do" value={todo} />
        <Stat label="Progress" value={inProgress} />
        <Stat label="Done" value={done} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-2xl bg-white/15 px-3 py-2.5 text-center backdrop-blur-sm">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-white/80">{label}</p>
    </div>
  );
}
