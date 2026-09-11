"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CoverflowCarousel, type CoverflowSlide } from "@/components/ui/coverflow-carousel";
import { useT } from "@/lib/i18n";

export type SummaryCard = {
  href: string;
  gradient: string;
  label: string;
  value: string;
  hint: string;
};

export default function SummaryCoverflow({ cards }: { cards: SummaryCard[] }) {
  const t = useT();
  const router = useRouter();

  const slides: CoverflowSlide[] = useMemo(
    () =>
      cards.map((card) => ({
        content: (
          <div
            className={`flex h-full w-full flex-col justify-center bg-gradient-to-br ${card.gradient} p-5 text-white`}
          >
            <p className="text-xs font-medium text-white/80">{card.label}</p>
            <p className="mt-1 text-2xl font-extrabold leading-tight tracking-tight">
              {card.value}
            </p>
            <p className="mt-3 text-[11px] leading-snug text-white/85">{card.hint}</p>
          </div>
        ),
      })),
    [cards]
  );

  return (
    <section className="mt-4">
      {/* Inset from the screen edges so a drag never starts in the zone iOS
          reserves for its back-swipe. */}
      <div className="px-6">
        <CoverflowCarousel
          slides={slides}
          cardWidth="clamp(200px, 62vw, 280px)"
          cardHeight="clamp(150px, 46vw, 210px)"
          rotate={38}
          depth={0.45}
          showPagination
          onCardActivate={(index) => router.push(cards[index].href)}
          label={t("home.summaryCarousel")}
          className="-mt-3"
        />
      </div>
      <p className="mt-3 px-5 text-center text-[11px] text-ink-muted">
        {t("home.summaryHint")}
      </p>
    </section>
  );
}
