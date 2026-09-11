"use client";

import { useRef, useState } from "react";
import { buildBackup, downloadBackup, parseBackup, restoreBackup } from "@/lib/backup";
import { useT } from "@/lib/i18n";
import { notifyError, notifyInfo } from "@/lib/notify";

/**
 * Turunkan seluruh catatan ke satu berkas, dan naikkan lagi.
 *
 * Ini satu-satunya jalan keluar data dari aplikasi. Tombol pulihkan sengaja ada
 * di sebelahnya: cadangan yang tidak bisa dimuat kembali hanya salinan untuk
 * dibaca, bukan cadangan.
 */
export default function BackupCard({ uid }: { uid: string | undefined }) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"none" | "export" | "restore">("none");

  async function handleExport() {
    if (!uid) return;
    setBusy("export");
    try {
      downloadBackup(await buildBackup(uid));
      notifyInfo(t("notify.exportReady"));
    } catch (error) {
      console.error("backup export failed", error);
      notifyError(t("notify.exportFailed"));
    } finally {
      setBusy("none");
    }
  }

  async function handleFile(file: File) {
    if (!uid) return;
    setBusy("restore");
    try {
      const backup = parseBackup(await file.text());
      const { documents } = await restoreBackup(uid, backup);
      notifyInfo(t("settings.restoreDone", { count: documents }));
    } catch (error) {
      console.error("backup restore failed", error);
      notifyError(
        error instanceof Error && error.message === "backup.version"
          ? t("settings.restoreVersion")
          : t("settings.restoreInvalid")
      );
    } finally {
      setBusy("none");
      // Dikosongkan supaya memilih berkas yang sama dua kali tetap memicu onChange.
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-4">
      <h2 className="text-sm font-bold text-ink">{t("settings.backupTitle")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t("settings.backupHint")}</p>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleExport}
          disabled={!uid || busy !== "none"}
          className="flex-1 rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-surface transition active:scale-95 disabled:opacity-40"
        >
          {busy === "export" ? t("settings.backupWorking") : t("settings.backupExport")}
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={!uid || busy !== "none"}
          className="flex-1 rounded-xl border border-border px-4 py-3 text-xs font-semibold text-ink transition active:scale-95 disabled:opacity-40"
        >
          {busy === "restore" ? t("settings.backupWorking") : t("settings.backupRestore")}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
