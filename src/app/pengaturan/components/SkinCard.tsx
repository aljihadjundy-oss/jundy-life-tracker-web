"use client";

import { useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n";
import { applySkin, DEFAULT_SKIN, readSkin, SKINS, subscribeSkin, type Skin } from "@/lib/skin";

/**
 * Pemilih kulit tampilan.
 *
 * Tiap pilihan menunjukkan contoh warnanya sendiri, bukan cuma nama — kulit itu
 * hal visual, dan daftar teks memaksa orang mencoba satu-satu untuk tahu
 * bedanya. Contohnya memakai warna mati (bukan token tema) supaya keduanya
 * terlihat apa adanya, tidak ikut berubah mengikuti kulit yang sedang aktif.
 */
const SWATCHES: Record<Skin, { light: string[]; dark: string[] }> = {
  instagram: {
    light: ["#ffffff", "#833ab4", "#fd1d1d", "#fcaf45"],
    dark: ["#0a0a0a", "#833ab4", "#fd1d1d", "#fcaf45"],
  },
  moon: {
    light: ["#f4f4f2", "#c3c7cf", "#8d94a3", "#4a4f5a"],
    dark: ["#08090c", "#6b7384", "#aab2c0", "#e8ecf2"],
  },
};

export default function SkinCard() {
  const t = useT();
  const skin = useSyncExternalStore(subscribeSkin, readSkin, () => DEFAULT_SKIN);

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-4">
      <h2 className="text-sm font-bold text-ink">{t("settings.skinTitle")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t("settings.skinHint")}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {SKINS.map((option) => {
          const active = skin === option;
          return (
            <button
              key={option}
              onClick={() => applySkin(option)}
              aria-pressed={active}
              className={`rounded-xl border p-3 text-left transition active:scale-95 ${
                active ? "border-ink" : "border-border"
              }`}
            >
              <div className="flex gap-1">
                {SWATCHES[option].light.map((color, i) => (
                  <span
                    key={i}
                    className="h-6 flex-1 rounded-md border border-black/10"
                    style={{ background: color }}
                  />
                ))}
              </div>
              <div className="mt-1 flex gap-1">
                {SWATCHES[option].dark.map((color, i) => (
                  <span
                    key={i}
                    className="h-3 flex-1 rounded-sm border border-white/10"
                    style={{ background: color }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs font-semibold text-ink">{t(`settings.skin.${option}`)}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">
                {t(`settings.skin.${option}.note`)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
