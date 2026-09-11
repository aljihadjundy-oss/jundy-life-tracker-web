/**
 * Lambang Andropid — separuh bulan yang tepinya luruh jadi debu.
 *
 * Dibuat oleh `scripts/make-logo.mjs` dalam dua versi. Yang ringkas dipakai di
 * bawah ~48px, karena di ukuran itu bintik halus versi penuh hanya jadi bubur
 * abu-abu sekaligus memaksa unduhan 23 KB di tiap layar.
 *
 * Berkasnya diwarnai lewat `currentColor`, jadi lambangnya ikut warna teks di
 * sekitarnya dan otomatis benar di tema terang maupun gelap. Itu hanya bekerja
 * kalau SVG-nya di-inline via mask CSS, bukan lewat <img> — makanya di sini
 * dipakai `mask-image`, bukan tag gambar.
 */
export function LogoMark({
  className = "",
  detailed = false,
}: {
  className?: string;
  detailed?: boolean;
}) {
  const src = detailed ? "/brand/mark.svg" : "/brand/mark-small.svg";
  return (
    <span
      aria-hidden="true"
      className={`block bg-current ${className}`}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

/**
 * Logo penuh: kata "Andropid." dengan lambang menindih separuh bawahnya,
 * seperti pada logo aslinya. Titik di belakang nama sengaja ikut — itu bagian
 * dari logonya, bukan tanda baca.
 */
export function Logo({
  className = "",
  detailed = false,
  useLockup = false,
}: {
  className?: string;
  detailed?: boolean;
  /**
   * Pakai satu berkas logo utuh (tulisan + lambang) dari
   * `public/brand/lockup.svg`, bukan menyusun tulisan dan lambang terpisah.
   *
   * Dipakai kalau berkas logo asli dimasukkan lewat
   * `scripts/import-logo.mjs --as lockup`. Sama seperti lambang, berkasnya
   * dipasang sebagai mask sehingga hanya bentuknya yang dipakai dan warnanya
   * ikut teks — jadi satu berkas tetap benar di tema terang maupun gelap.
   */
  useLockup?: boolean;
}) {
  if (useLockup) {
    return (
      <span
        role="img"
        aria-label="Andropid"
        className={`block bg-current ${className}`}
        style={{
          maskImage: "url(/brand/lockup.svg)",
          WebkitMaskImage: "url(/brand/lockup.svg)",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskSize: "contain",
          WebkitMaskSize: "contain",
        }}
      />
    );
  }

  return (
    // w-fit: lebar kolom ditentukan oleh panjang katanya, lalu lambang di
    // bawahnya mengambil lebar itu (w-full) dengan rasio 2:1 — jadi lambang
    // selalu sepadan dengan kata di atasnya berapa pun ukuran fontnya.
    // Menyetel tingginya dalam `em` tidak bisa: `em` di sini mengacu ke font
    // pembungkus, bukan ke teks nama yang jauh lebih besar.
    <span className={`inline-flex w-fit flex-col items-center text-ink ${className}`}>
      <span className="relative z-10 text-[2em] font-bold leading-[1.05] tracking-tight">
        Andropid<span className="text-brand-mid">.</span>
      </span>
      {/* Ditarik naik supaya menembus garis dasar huruf, persis logo aslinya. */}
      {/* Lebarnya 72% dari kata, seperti logo aslinya — lambang selebar kata
          akan mendorong namanya ke pinggir dan menghilangkan bentuk bulannya.
          Margin persen di CSS mengacu ke LEBAR pembungkus, bukan tinggi, jadi
          -3% cukup untuk membuat ekor huruf p menembus tepi datarnya. */}
      <LogoMark className="-mt-[3%] aspect-[2/1] w-[72%]" detailed={detailed} />
    </span>
  );
}
