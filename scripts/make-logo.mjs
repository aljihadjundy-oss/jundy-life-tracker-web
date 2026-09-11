/**
 * Menghasilkan lambang Andropid: separuh bawah lingkaran yang luruh menjadi
 * bintik ke arah kiri-bawah — bulan yang tepinya terkikis.
 *
 * Bintiknya dibangkitkan dengan PRNG ber-seed, jadi berkas yang dihasilkan
 * selalu sama persis. Itu penting: lambang yang berubah tiap kali di-build
 * akan mengacaukan cache ikon PWA dan diff git.
 */
import { mkdirSync, writeFileSync } from "node:fs";

const SIZE = 512;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 216;

/** mulberry32 — kecil, cepat, dan hasilnya dapat diulang. */
function rng(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seberapa terkikis sebuah titik. 0 di kanan (pekat), 1 di kiri-bawah (hancur).
 * Arahnya dipilih agar sisi datar di atas tetap utuh dan tajam, sehingga
 * lambangnya tetap terbaca sebagai separuh lingkaran, bukan gumpalan.
 */
function erosion(x, y) {
  const dx = (CX - x) / R; // positif ke kiri
  const dy = (y - CY) / R; // positif ke bawah
  const along = dx * 0.82 + dy * 0.58;
  return Math.max(0, Math.min(1, (along - 0.06) / 0.92));
}

function build(layers) {
  const next = rng(20260911);
  const specks = [];

  // Dua lapis: bintik halus yang rapat memberi tekstur, bintik besar yang
  // jarang memberi gerigi di tepi. Satu lapis saja terlihat seperti noise JPEG.
  for (const [count, minR, maxR, power] of layers) {
    for (let i = 0; i < count; i++) {
      // Sebaran seragam di dalam cakram, lalu dibuang yang di separuh atas.
      const a = next() * Math.PI * 2;
      const rad = Math.sqrt(next()) * R;
      const x = CX + Math.cos(a) * rad;
      const y = CY + Math.sin(a) * rad;
      if (y < CY) continue;

      const e = erosion(x, y);
      if (e <= 0) continue;
      if (next() > Math.pow(e, power)) continue;

      const rr = minR + next() * (maxR - minR) * (0.45 + e * 0.55);
      specks.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(2)}"/>`
      );
    }
  }
  return specks;
}

/** Setengah lingkaran bawah, sisi datar di atas. */
const HALF = `M ${CX - R} ${CY} A ${R} ${R} 0 0 0 ${CX + R} ${CY} Z`;

/**
 * viewBox dipotong ke batas gambar sesungguhnya — lebar 2R, tinggi R — bukan
 * kanvas persegi 512x512. Kalau dibiarkan persegi, gambarnya cuma mengisi
 * separuh bawah, sehingga setiap pemakaian dengan `contain` akan mengecilkannya
 * jadi setengah ukuran dan memberi ruang kosong yang tidak bisa dihilangkan
 * dari sisi CSS.
 */
function svg(specks) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${CX - R} ${CY} ${R * 2} ${R}" role="img" aria-label="Andropid">
  <defs>
    <mask id="erode" maskUnits="userSpaceOnUse" x="0" y="0" width="${SIZE}" height="${SIZE}">
      <path d="${HALF}" fill="#fff"/>
      <g fill="#000">
${specks.map((s) => "        " + s).join("\n")}
      </g>
    </mask>
  </defs>
  <path d="${HALF}" fill="currentColor" mask="url(#erode)"/>
</svg>
`;
}

mkdirSync("public/brand", { recursive: true });

// Versi penuh untuk tampilan besar dan untuk dijadikan ikon PNG.
const detailed = build([
  [26000, 0.6, 1.9, 2.1],
  [4200, 1.4, 3.6, 3.0],
  [700, 3.0, 5.6, 4.2],
]);
writeFileSync("public/brand/mark.svg", svg(detailed));

// Versi ringkas untuk ukuran kecil: di bawah ~48px bintik halus hanya jadi
// bubur abu-abu, dan berkasnya tidak perlu ikut terunduh di tiap layar.
const coarse = build([
  [900, 2.2, 5.0, 2.2],
  [220, 5.0, 9.0, 3.2],
]);
writeFileSync("public/brand/mark-small.svg", svg(coarse));

console.log("mark.svg", detailed.length, "bintik / mark-small.svg", coarse.length, "bintik");
