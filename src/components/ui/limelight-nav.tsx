"use client";

import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Sorot bergerak — pita cahaya yang meluncur ke bagian navigasi yang aktif.
 *
 * Diadaptasi dari komponen "limelight nav", bukan disalin apa adanya. Empat hal
 * harus berubah supaya bisa hidup di sini:
 *
 *  - Aslinya memakai token shadcn (bg-primary, bg-card, text-foreground).
 *    Proyek ini bukan shadcn dan token-token itu tidak ada sama sekali, jadi
 *    pita cahayanya akan tak terlihat dan `var(--primary)` pada bayangannya
 *    menghasilkan nilai kosong. Diganti token Andropid, yang sekaligus membuat
 *    warnanya ikut berganti sendiri di kulit Instagram maupun Bulan.
 *
 *  - Aslinya menyimpan indeks aktif sebagai state internal. Untuk navigasi
 *    berbasis rute itu salah: menekan tombol Kembali mengubah halaman tanpa
 *    mengubah state, dan sorotnya tertinggal di tempat yang keliru. Di sini
 *    indeksnya dikendalikan dari luar — rute yang memimpin, bukan klik.
 *
 *  - Aslinya memanggil setState di dalam layout effect (lewat setTimeout) demi
 *    menahan animasi pada penempatan pertama. Aturan eslint di repo ini
 *    melarangnya, dan memang tidak perlu: transisi cukup dimatikan sesaat
 *    lewat gaya langsung, tanpa render tambahan.
 *
 *  - Aslinya tidak pernah mengukur ulang. Memutar layar, mengganti bahasa, atau
 *    mematikan sebuah pilar mengubah lebar dan jumlah tombol — dan sorotnya
 *    tetap di koordinat lama. Di sini diamati dengan ResizeObserver.
 */

export type LimelightNavProps = {
  /** Indeks yang sedang aktif. Dikendalikan pemanggil, bukan state internal. */
  activeIndex: number;
  /** Jumlah tombol — dipakai untuk mengukur ulang saat daftarnya berubah. */
  count: number;
  children: ReactNode;
  className?: string;
  /** Kelas untuk pita cahayanya, kalau perlu diubah lebar atau warnanya. */
  beamClassName?: string;
};

export default function LimelightNav({
  activeIndex,
  count,
  children,
  className = "",
  beamClassName = "",
}: LimelightNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  /** Penempatan pertama tidak boleh dianimasikan — ia akan meluncur dari tepi. */
  const placed = useRef(false);

  const place = useCallback(() => {
    const container = containerRef.current;
    const row = rowRef.current;
    const beam = beamRef.current;
    if (!container || !row || !beam) return;

    // Anak langsung baris ini adalah tombol-tombolnya, jadi tidak perlu id atau
    // ref per tombol — pengukuran tetap benar berapa pun jumlah pilar aktif.
    const target = row.children[activeIndex] as HTMLElement | undefined;
    if (!target) return;

    // Diukur lewat rect, bukan offsetLeft. offsetLeft dihitung dari
    // offsetParent-nya — yaitu baris — sedangkan pita diposisikan terhadap
    // pembungkus luar. Selama pembungkusnya punya padding, keduanya beda
    // sebesar padding itu dan sorotnya meleset sejauh itu di setiap tombol.
    const box = container.getBoundingClientRect();
    const hit = target.getBoundingClientRect();
    const left = hit.left - box.left + hit.width / 2 - beam.offsetWidth / 2;

    if (!placed.current) {
      beam.style.transition = "none";
      beam.style.left = `${left}px`;
      // Dibaca paksa supaya browser menerapkan posisi awal sebelum transisi
      // dinyalakan lagi; tanpa ini keduanya digabung dan pitanya tetap meluncur.
      void beam.offsetWidth;
      beam.style.transition = "";
      beam.style.opacity = "1";
      placed.current = true;
      return;
    }
    beam.style.left = `${left}px`;
  }, [activeIndex]);

  useLayoutEffect(() => {
    place();
  }, [place, count]);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new ResizeObserver(() => place());
    observer.observe(row);
    return () => observer.disconnect();
  }, [place]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        ref={beamRef}
        aria-hidden="true"
        // opacity 0 sampai penempatan pertama selesai, supaya tidak sempat
        // terlihat di tepi kiri layar pada frame pertama.
        style={{ left: "-999px", opacity: 0 }}
        className={`pointer-events-none absolute top-0 z-10 h-[3px] w-10 rounded-full bg-brand-mid transition-[left] duration-300 ease-out ${beamClassName}`}
      >
        {/* Kerucut cahaya yang jatuh ke bawah, ke arah isi bilahnya. */}
        <div className="absolute left-[-40%] top-[3px] h-12 w-[180%] bg-gradient-to-b from-brand-mid/25 to-transparent [clip-path:polygon(8%_100%,28%_0,72%_0,92%_100%)]" />
      </div>

      <div ref={rowRef} className="relative z-20 flex items-stretch">
        {children}
      </div>
    </div>
  );
}
