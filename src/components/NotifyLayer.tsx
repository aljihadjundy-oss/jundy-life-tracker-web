"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n";
import { onNotice, type Notice } from "@/lib/notify";

type Shown = Notice & { id: number };

let nextId = 1;

/** Cukup lama untuk dibaca, cukup singkat untuk tidak menghalangi. */
const DISMISS_AFTER_MS = 4000;

// --- status jaringan ------------------------------------------------------
// `useSyncExternalStore` dipakai supaya status awal dibaca saat render, bukan
// lewat setState di dalam effect — aturan react-hooks/set-state-in-effect di
// repo ini menolak pola yang kedua.

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function useOnline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true // di server selalu dianggap online; badge-nya cuma muncul di klien
  );
}

export default function NotifyLayer() {
  const t = useT();
  const online = useOnline();
  const [notices, setNotices] = useState<Shown[]>([]);

  useEffect(() => {
    return onNotice((notice) => {
      const id = nextId++;
      setNotices((prev) => [...prev, { ...notice, id }]);
      setTimeout(() => setNotices((prev) => prev.filter((x) => x.id !== id)), DISMISS_AFTER_MS);
    });
  }, []);

  return (
    <>
      {/* Offline itu keadaan, bukan kejadian sesaat — jadi ini menetap selama
          koneksi putus, bukan hilang sendiri seperti pesan di bawahnya.
          Tulisan yang dibuat saat offline tetap tersimpan di cache dan dikirim
          saat koneksi balik, dan kalimatnya bilang begitu supaya tidak ada yang
          panik mengetik ulang. */}
      {!online && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4">
          <p className="rounded-full bg-ink/90 px-4 py-2 text-center text-xs font-medium text-surface shadow-lg backdrop-blur">
            {t("sync.offline")}
          </p>
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2 px-4">
        {notices.map((notice) => (
          <div
            key={notice.id}
            role="status"
            className={`max-w-sm rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${
              notice.kind === "error"
                ? "bg-red-500 text-white shadow-red-500/25"
                : "bg-ink text-surface"
            }`}
          >
            {notice.text}
          </div>
        ))}
      </div>
    </>
  );
}
