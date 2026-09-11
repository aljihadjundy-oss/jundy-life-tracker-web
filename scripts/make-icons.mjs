/**
 * Membangun ikon PWA dari lambang.
 *
 * Ikon "any" memakai lambang di atas latar terang dengan ruang napas; ikon
 * maskable diberi padding jauh lebih besar karena Android memotongnya jadi
 * lingkaran atau squircle sesuai peluncur masing-masing, dan lambang yang
 * menyentuh tepi akan terpotong.
 */
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const BG = "#f4f4f2"; // bone — sama dengan permukaan terang tema Bulan
const FG = "#121212";

// Lambangnya separuh lingkaran, jadi berkasnya berbentuk pita 2:1. Pita itu
// ditempatkan di tengah kotak ikon, bukan diregangkan jadi persegi.
const svg = readFileSync("public/brand/mark.svg", "utf8").replace(/currentColor/g, FG);

async function icon(size, inset, out) {
  const w = Math.round(size * inset);
  const h = Math.round(w / 2);
  const mark = await sharp(Buffer.from(svg)).resize(w, h).png().toBuffer();
  const composed = await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: mark, top: Math.round((size - h) / 2), left: Math.round((size - w) / 2) }])
    .png()
    .toBuffer();
  writeFileSync(out, composed);
  console.log(out, size, "px");
}

// Lambangnya separuh lingkaran, jadi tingginya cuma separuh kotaknya sendiri —
// angka inset di bawah sudah memperhitungkan itu supaya tidak terlihat kecil.
await icon(192, 0.88, "public/icons/icon-192.png");
await icon(512, 0.88, "public/icons/icon-512.png");
await icon(512, 0.62, "public/icons/icon-maskable-512.png");
await icon(180, 0.88, "public/icons/apple-touch-icon.png");
