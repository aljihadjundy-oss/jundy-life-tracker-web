/**
 * Kulit tampilan — sumbu terpisah dari terang/gelap.
 *
 *   instagram — bawaan: gradien ungu→merah→jingga, aksen jenuh, tanpa butiran.
 *   moon      — monokrom kebiruan, berbutir, aksen diredam. Mengikuti lambang.
 *
 * Dipisah dari mode terang/gelap dengan sengaja. "Bulan" bukan sinonim
 * "gelap": kulit ini punya siang (regolith pucat) dan malam (obsidian), persis
 * seperti kulit Instagram. Menggabungkan keduanya jadi satu daftar empat pilih
 * akan memaksa pengguna memilih ulang kecerahan tiap kali berganti gaya.
 *
 * Nilainya disimpan di localStorage dan dipasang sebagai atribut pada <html>,
 * jadi CSS-lah yang menentukan warna — bukan React. Itu yang membuat pilihan
 * ini bisa dipulihkan oleh skrip kecil di <head> sebelum halaman digambar,
 * sehingga tidak ada kedipan putih saat membuka aplikasi dalam gelap.
 */

export const SKINS = ["instagram", "moon"] as const;

export type Skin = (typeof SKINS)[number];

export const DEFAULT_SKIN: Skin = "instagram";

export const SKIN_STORAGE_KEY = "skin";

export function isSkin(value: unknown): value is Skin {
  return typeof value === "string" && (SKINS as readonly string[]).includes(value);
}

export function readSkin(): Skin {
  if (typeof document === "undefined") return DEFAULT_SKIN;
  const attr = document.documentElement.dataset.skin;
  return isSkin(attr) ? attr : DEFAULT_SKIN;
}

const listeners = new Set<() => void>();

export function subscribeSkin(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function applySkin(skin: Skin) {
  document.documentElement.dataset.skin = skin;
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, skin);
  } catch {
    // Mode penyamaran atau penyimpanan diblokir: pilihannya tetap berlaku
    // untuk sesi ini, hanya tidak diingat. Itu bukan alasan untuk gagal.
  }
  listeners.forEach((listener) => listener());
}
