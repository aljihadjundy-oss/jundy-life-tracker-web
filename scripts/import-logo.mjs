/**
 * Memasukkan berkas logo asli menggantikan lambang yang dibangun ulang.
 *
 *   node scripts/import-logo.mjs <berkas> [--as mark|lockup]
 *
 *   --as mark    (bawaan) hanya lambangnya: separuh bulan, tanpa tulisan.
 *                Dipakai di ikon PWA, rel samping, dan di bawah nama pada
 *                halaman masuk.
 *   --as lockup  logo utuh: tulisan "Andropid." beserta lambangnya. Dipakai
 *                di halaman masuk menggantikan tulisan + lambang terpisah.
 *
 * Menerima SVG maupun raster (PNG/JPG). Apa pun masukannya, keluarannya selalu
 * bernama sama, sehingga tidak ada satu baris kode pun yang perlu diubah.
 *
 * CATATAN PENTING soal warna: lambang ini dipasang lewat mask CSS, bukan tag
 * gambar. Artinya yang dipakai hanya BENTUKNYA — warna di dalam berkas
 * diabaikan, dan bentuk itu diwarnai mengikuti warna teks di sekitarnya. Itulah
 * yang membuat satu berkas bekerja benar di tema terang maupun gelap.
 *
 * Konsekuensinya: latar putih pada berkas akan ikut terbaca sebagai BAGIAN DARI
 * BENTUK, dan hasilnya kotak pekat, bukan bulan. Untuk masukan raster, skrip
 * ini menghapus latar terang jadi transparan secara otomatis. Untuk masukan
 * SVG, berkasnya dipakai apa adanya — pastikan tidak ada <rect> putih di
 * belakangnya.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname } from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
const asIndex = args.indexOf("--as");
const kind = asIndex === -1 ? "mark" : args[asIndex + 1];

if (!input || !["mark", "lockup"].includes(kind)) {
  console.error("Pakai: node scripts/import-logo.mjs <berkas> [--as mark|lockup]");
  process.exit(1);
}
if (!existsSync(input)) {
  console.error(`Berkas tidak ditemukan: ${input}`);
  process.exit(1);
}

/** Ambang "cukup terang untuk dianggap latar". */
const WHITE_CUTOFF = 238;

async function rasterToSvg(file) {
  // trim() memotong pinggiran seragam lebih dulu, supaya viewBox hasilnya pas
  // ke gambar dan tidak menyisakan ruang kosong yang tak bisa dihapus dari CSS.
  const trimmed = await sharp(file).trim().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = trimmed;
  const { width, height, channels } = info;

  // Piksel terang jadi transparan; sisanya jadi siluet pekat. Nilai alfa
  // dipertahankan bertingkat, bukan hitam-putih, supaya tepi bergerigi dan
  // bintik halusnya tidak hilang.
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    const a = channels === 4 ? data[i * channels + 3] : 255;
    const lum = (r * 0.299 + g * 0.587 + b * 0.114);
    const opacity = Math.max(0, Math.min(255, Math.round(((WHITE_CUTOFF - lum) / WHITE_CUTOFF) * 255)));
    out[i * 4] = 0;
    out[i * 4 + 1] = 0;
    out[i * 4 + 2] = 0;
    out[i * 4 + 3] = Math.round((opacity * a) / 255);
  }

  const png = await sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();

  // Raster dibungkus SVG dengan data URI supaya nama berkas keluarannya tetap
  // .svg — komponen dan skrip ikon tidak perlu tahu asalnya raster atau vektor.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Andropid">
  <image href="data:image/png;base64,${png.toString("base64")}" width="${width}" height="${height}"/>
</svg>
`;
}

const isSvg = extname(input).toLowerCase() === ".svg";
const svg = isSvg ? readFileSync(input, "utf8") : await rasterToSvg(input);

if (kind === "lockup") {
  writeFileSync("public/brand/lockup.svg", svg);
  console.log(`public/brand/lockup.svg  <- ${basename(input)}`);
  console.log("Nyalakan dengan mengganti <Logo /> jadi <Logo useLockup /> di src/app/login/page.tsx.");
} else {
  writeFileSync("public/brand/mark.svg", svg);
  // Versi ringkas tidak bisa disederhanakan otomatis dari berkas orang lain,
  // jadi keduanya diisi berkas yang sama. Kalau ukurannya besar dan terlihat
  // berat di ikon nav, siapkan versi sederhana terpisah sebagai mark-small.svg.
  writeFileSync("public/brand/mark-small.svg", svg);
  console.log(`public/brand/mark.svg dan mark-small.svg  <- ${basename(input)}`);
  if (isSvg) {
    console.log("Masukan SVG dipakai apa adanya — pastikan tidak ada latar putih di belakangnya.");
  }
}

console.log("Berikutnya: node scripts/make-icons.mjs  (membangun ulang ikon PWA)");
