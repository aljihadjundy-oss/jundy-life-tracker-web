/**
 * Pesan singkat ke pengguna — dipakai untuk kegagalan yang selama ini ditelan
 * diam-diam oleh blok `catch`.
 *
 * Pola pub-sub-nya sengaja sama persis dengan `celebrate.ts` yang sudah ada,
 * supaya tidak ada dependensi baru dan tidak ada mekanisme kedua yang harus
 * dipelajari. Bedanya cuma nada: ini untuk kabar buruk, itu untuk kabar baik.
 */

export type NoticeKind = "error" | "info";

export type Notice = { kind: NoticeKind; text: string };

type Listener = (notice: Notice) => void;

const listeners = new Set<Listener>();

/**
 * Notice yang terbit sebelum ada yang mendengarkan.
 *
 * Effect komponen anak berjalan sebelum effect induknya, jadi kegagalan saat
 * sebuah halaman pertama kali dimuat terbit lebih dulu daripada NotifyLayer
 * sempat berlangganan — dan hilang tanpa jejak. Itu persis kelas bug yang
 * modul ini dibuat untuk menghapus, jadi notice-nya ditahan di sini dan
 * dilepas begitu pendengar pertama datang.
 */
let pending: Notice[] = [];

export function onNotice(listener: Listener) {
  listeners.add(listener);
  if (pending.length > 0) {
    const queued = pending;
    pending = [];
    // Ditunda satu microtask supaya listener tidak dipanggil di tengah render
    // komponen yang baru saja mendaftar.
    queueMicrotask(() => queued.forEach((notice) => listener(notice)));
  }
  return () => {
    listeners.delete(listener);
  };
}

function emit(notice: Notice) {
  if (listeners.size === 0) {
    pending.push(notice);
    return;
  }
  listeners.forEach((listener) => listener(notice));
}

export function notifyError(text: string) {
  emit({ kind: "error", text });
}

export function notifyInfo(text: string) {
  emit({ kind: "info", text });
}

/**
 * Bungkus satu operasi tulis. Kalau gagal, penggunanya diberi tahu alih-alih
 * kegagalan itu hilang tanpa jejak.
 *
 * Dipakai untuk penulisan yang sengaja tidak di-`await` oleh UI: Firestore
 * sudah menerapkannya ke cache lokal seketika, jadi menahan form sampai server
 * menjawab hanya menambah jeda — tapi kalau tulisannya akhirnya ditolak,
 * pengguna tetap harus tahu.
 */
export function reportFailure(promise: Promise<unknown>, text: string) {
  void promise.catch((error) => {
    // Jejak teknisnya tetap ke console untuk ditelusuri; penggunanya cukup
    // diberi kalimat yang bisa ditindaklanjuti.
    console.error(text, error);
    notifyError(text);
  });
}
