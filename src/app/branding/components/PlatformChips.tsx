import { PLATFORMS, PLATFORM_EMOJI } from "@/types/branding";

export default function PlatformChips({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (platform: string | null) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
          selected === null ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
        }`}
      >
        Semua
      </button>
      {PLATFORMS.map((p) => (
        <button
          key={p}
          onClick={() => onSelect(p)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            selected === p ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
          }`}
        >
          {PLATFORM_EMOJI[p]} {p}
        </button>
      ))}
    </div>
  );
}
