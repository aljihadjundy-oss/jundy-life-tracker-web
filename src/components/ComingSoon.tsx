export default function ComingSoon({
  emoji,
  title,
  description,
  gradient,
}: {
  emoji: string;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="flex flex-col items-center px-8 pt-16 text-center">
      <div className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${gradient} text-4xl shadow-lg`}>
        {emoji}
      </div>
      <h2 className="mt-5 text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-xs text-sm text-ink-muted">{description}</p>
      <span className="mt-6 rounded-full bg-surface-raised px-4 py-1.5 text-xs font-semibold text-ink-muted">
        Segera hadir
      </span>
    </div>
  );
}
