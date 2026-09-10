import { PLATFORMS, PLATFORM_EMOJI } from "@/types/branding";
import { useT } from "@/lib/i18n";

export default function PlatformChips({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (platform: string | null) => void;
}) {
  const t = useT();
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
          selected === null ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
        }`}
      >
        {t("branding.all")}
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
