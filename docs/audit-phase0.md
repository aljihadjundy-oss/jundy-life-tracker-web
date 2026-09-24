# Audit Fase 0 — Andropid

Read-only. Tidak ada kode yang diubah untuk laporan ini (kecuali file ini
sendiri). Semua klaim di bawah dicek langsung ke file dan baris kode, bukan
diasumsikan dari README atau percakapan sebelumnya.

---

## 1. Peta arsitektur singkat

- **Framework**: Next.js 16.3.4, App Router, `output: "export"` (`next.config.ts`) — static export murni, tidak ada server Node yang jalan di production. Build pakai Webpack (`next build --webpack`), bukan Turbopack.
- **Bahasa/tipe**: TypeScript strict, React 19.2.8.
- **Routing**: 1 folder per modul di `src/app/` (`keuangan`, `waktu`, `branding`, `kesehatan`, `jurnal`, `pengaturan`, `login`), semua `"use client"` — tidak ada Server Component/Server Action karena tidak ada server.
- **State**: tidak ada state management library. Tiap halaman pakai `useState`/`useEffect` + listener Firestore (`onSnapshot`) langsung. Context global cuma dua: `AuthProvider` (`src/lib/auth-context.tsx`) dan `UserConfigProvider` (`src/lib/user-context.tsx`, profil + pillar aktif). i18n (`src/lib/i18n.tsx`) pakai `useSyncExternalStore` + `localStorage`, bukan context.
- **Styling**: Tailwind CSS v4, token CSS-first di `src/app/globals.css` (`@theme inline`), dua skin (`instagram`/`moon`) lewat atribut `data-skin` + `.dark` untuk mode gelap — ortogonal satu sama lain.
- **Firestore**: satu database, semua dokumen di bawah `users/{uid}/...`. Struktur collection per modul dipetakan di bagian 2.
- **Auth**: Firebase Auth, Google Sign-In via `signInWithRedirect` (bukan popup — sengaja, karena popup tidak reliable di PWA standalone). Gerbang akses dua lapis: `NEXT_PUBLIC_ALLOWED_EMAILS` di client (`src/lib/firebase.ts:48-53`) dan `isAllowed()` di `firestore.rules` (lihat bagian 3).
- **PWA**: `public/manifest.json` (standalone, tanpa `shortcuts`) + `public/sw.js` (service worker custom, bukan Workbox) + `src/components/RegisterSW.tsx` yang mendaftarkannya dan mengoper config Firebase via query string base64 untuk FCM background handler.
- **Hosting**: Firebase Hosting, `firebase.json` — hosting + firestore rules + 1 Cloud Function (`sendDailyReminders`, `functions/index.js`, Node 20, `onSchedule` tiap 15 menit).
- **Testing**: Vitest, tapi test yang ada cuma 2 file (`src/lib/money.test.ts`, `src/lib/writing.test.ts`, `src/lib/import-writing.test.ts`) — murni test fungsi murni (kalkulasi, parser CSV), **tidak ada test komponen, tidak ada test integrasi Firestore, tidak ada test rules**.
- **Tooling**: `npm run lint` (ESLint flat config), `npm run test` (Vitest), `npm run build` (`next build --webpack`, termasuk `tsc` internal). Tidak ada CI (`.github/workflows` tidak ada).

### 1.1 Struktur Firestore (terverifikasi dari kode, bukan cuma README)

| Collection/doc | File sumber | Shape (field utama) |
|---|---|---|
| `users/{uid}/transactions/{id}` | `src/lib/finance.ts` | type, amount, category, note, date, accountId, toAccountId, needWant, fixed, status, createdAt |
| `users/{uid}/accounts/{id}` | `src/lib/finance.ts` | name, type, openingBalance, asOf, note, createdAt |
| `users/{uid}/budgets/{id}` | `src/lib/finance.ts` | month, category, planned, createdAt |
| `users/{uid}/debts/{id}` | `src/lib/finance.ts` | name, creditor, principal, remaining, installment, dueDate, interest, note, status, createdAt |
| `users/{uid}/goals/{id}` | `src/lib/finance.ts` | name, targetAmount, currentAmount, deadline, priority, type, createdAt |
| `users/{uid}/tasks/{id}` | `src/lib/waktu.ts` | title, note, dueDate, startTime, durationMinutes, reminderMinutes, status, category, owner, unit, link, source, createdAt, completedAt, notifiedFor |
| `users/{uid}/content/{id}` | `src/lib/branding.ts` | title, platform, postDate, status, note, createdAt |
| `users/{uid}/habits/{id}`, `habitLogs/{date_habitId}` | `src/lib/kesehatan.ts` | name / habitId, date |
| `users/{uid}/metrics/{date}` | `src/lib/kesehatan.ts` | sleepHours, exerciseMinutes, waterGlasses, energy, mood, symptoms, mealsDone, exercise |
| `users/{uid}/journal/{id}` | `src/lib/journal.ts:19-96` | title, content, mood, date, hasAudio, audioSeconds, type, topicIds, description, favorite, finished, archived, createdAt, updatedAt |
| `users/{uid}/topics/{id}` | `src/lib/journal.ts:23-24` | (perpustakaan tulisan — nama topik, dipakai `topicIds` di journal) |
| `users/{uid}/gamification/stats` | `src/types/gamification.ts` | totalXp, dailyGoal, xpByDate (map tanggal→XP), unlockedBadges, counters (per jenis aksi) |
| `users/{uid}/settings/{finance,waktu,branding,health,notifications,pillars,profile}` | berbagai `src/lib/*.ts` | lihat README, terverifikasi konsisten dengan kode |

**Audio jurnal TIDAK ada di Firestore** — tersimpan di IndexedDB device (`src/lib/audio-store.ts`), lihat bagian 2.4.

---

## 2. Verifikasi klaim landing page (poin 5 di brief)

### 2.1 "Firestore rules cek UID dan email invite list di server" — **BENAR**

`firestore.rules:18-31`:
```
function isAllowed() {
  return request.auth != null &&
    request.auth.token.email != null &&
    request.auth.token.email.lower() in ["aljihadjundy@gmail.com", "mayakris402@gmail.com"];
}
match /users/{uid}/{document=**} {
  allow read, write: if isAllowed() && request.auth.uid == uid;
}
```
Dua kondisi digabung AND: email harus di allowlist literal **dan** uid path harus cocok dengan uid yang login. Ini benar-benar server-side (Firestore rules dieksekusi server, tidak bisa dibypass dari client). Klaim di FAQ landing page akurat.

**Tapi** — dua catatan:
- Allowlist di rules ini **manual, terpisah dari** `NEXT_PUBLIC_ALLOWED_EMAILS` di `.env.local`. Kalau lupa sinkron dua tempat, email yang dicabut dari env var masih bisa masuk lewat SDK langsung selama masih ada di rules. Ini sudah didokumentasikan di README, tapi tetap operational risk manual yang nyata untuk beta dengan banyak email (lihat Fase 5).
- **Tidak ada rules test** (emulator) sama sekali. Klaim "aman" ini belum pernah diverifikasi otomatis — kalau ada regresi di `firestore.rules` saat ubah-ubah nanti, tidak ada yang akan ketahuan sampai dites manual atau (lebih buruk) sampai insiden.

### 2.2 "Backup/restore di Settings, cover data apa aja?" — **SEBAGIAN BENAR, ADA GAP NYATA**

`src/lib/backup.ts:17-29`, `COLLECTIONS`:
```
transactions, accounts, budgets, debts, goals, tasks, content, habits, habitLogs, metrics, journal
```
plus `SINGLETONS`: `settings/{finance,waktu,branding,health,notifications,pillars,profile}`, `gamification/stats`.

**Gap yang ditemukan**: collection `topics` (`src/lib/journal.ts:23-24`, perpustakaan topik tulisan jurnal — fitur yang sudah live) **tidak ada di `COLLECTIONS`**. Backup/restore jurnal akan mengembalikan entri jurnal dengan `topicIds` yang menunjuk ke topik yang tidak pernah ikut dicadangkan/dipulihkan. Ini bug nyata, bukan cuma gap dokumentasi — masuk Fase 2 poin 2.

**Gap kedua (audio)**: rekaman suara jurnal tidak pernah ikut backup sama sekali (device-only, lihat 2.4) — ini bukan bug di `backup.ts`, tapi keterbatasan arsitektur yang harus jujur disebut ke user (Fase 2 poin 1).

**Gap ketiga (restore tanpa konfirmasi)**: `src/app/pengaturan/components/BackupCard.tsx:34-53` — begitu file dipilih, `handleFile` langsung parse dan `restoreBackup`, tanpa dialog konfirmasi atau preview jumlah dokumen yang akan ditimpa. `restoreBackup` sendiri (`backup.ts:117-150`) pakai `batch.set`/`merge:true` per dokumen — jadi tidak menghapus data yang dibuat setelah backup itu (aman dari sisi "tidak menghilangkan data baru"), tapi tetap **menimpa diam-diam** dokumen dengan id yang sama tanpa user tahu berapa banyak yang akan berubah sebelum itu terjadi. Ini persis yang diminta Fase 2 poin 2 untuk diperbaiki.

### 2.3 "Offline: halaman yang udah dibuka tetap render, simpan data baru butuh koneksi" — **BENAR, DENGAN NUANSA PENTING**

- Firestore persistence aktif: `src/lib/firebase.ts:35-37`, `initializeFirestore` dengan `persistentLocalCache({ tabManager: persistentMultipleTabManager() })`. Ini artinya **tulisan offline SEBENARNYA tidak butuh koneksi untuk "tersimpan"** — masuk ke cache lokal (IndexedDB) dan Firestore SDK sendiri yang antre mengirim begitu online. Klaim FAQ agak terlalu konservatif dibanding kenyataan: data baru **bisa** disimpan offline (masuk cache), yang butuh koneksi adalah **sinkron ke server**.
- Ada bug offline yang sudah pernah terjadi dan sudah diperbaiki untuk jurnal spesifik: `src/lib/journal.ts:60-72` — versi lama pakai `addDoc` dan menunggu promise untuk dapat id; saat offline promise itu tidak pernah resolve sehingga autosave mengunci diri sendiri. Diperbaiki dengan `doc()` client-side id generation. **Tapi ini fix lokal ke journal saja** — perlu dicek apakah pola `addDoc`-blocking yang sama masih ada di modul lain (finance/waktu/kesehatan/branding) sebagai bagian Fase 2.
- Indikator offline **sudah ada**, bukan belum: `src/components/NotifyLayer.tsx:14-34,51-62` — banner global "koneksi putus" muncul selama `navigator.onLine === false`, teksnya bilang data tetap tersimpan di cache dan terkirim saat online. Ini banner **global**, bukan per-item "belum tersinkron" seperti yang diminta Fase 2 poin 4 — tidak ada cara tahu dokumen mana spesifik yang masih pending sync kalau banner sudah hilang (begitu `navigator.onLine` balik `true`, badge langsung hilang meski Firestore mungkin masih mengirim antrean di background).
- Service worker (`public/sw.js:95-114`): navigasi network-first dengan fallback ke cache terakhir kalau offline — jadi "halaman yang udah dibuka tetap render" itu benar dan terverifikasi di level HTML shell, bukan cuma Firestore data.

### 2.4 "Rekaman suara jurnal cuma tersimpan di device" — **BENAR, DAN TIDAK ADA PERINGATAN DI UI**

`src/lib/audio-store.ts:1-9` — IndexedDB (`andropid-audio`/`clips`), sengaja tidak disync (komentar di kode: Cloud Storage tidak tersedia di plan Spark, dan audio akan melebihi limit 1 MiB per dokumen Firestore setelah ~6 menit rekaman). Hanya transkrip yang sync ke Firestore.

**Tidak ditemukan** teks peringatan apa pun di UI (`JournalEditor.tsx`, `VoiceRecorder.tsx`, `JournalCard.tsx`) yang bilang ke user bahwa audio akan hilang kalau ganti device/uninstall/clear storage. Ini kontradiksi langsung dengan klaim landing "your data is yours" — datanya justru bisa hilang tanpa peringatan. Prioritas tinggi untuk Fase 2 poin 1.

### 2.5 "Reminder otomatis 30 menit sebelum task" — **BENAR SECARA KODE, TAPI BELUM LIVE DI PRODUCTION**

Mekanisme (`functions/index.js`): Cloud Scheduler (`onSchedule`, tiap 15 menit, timezone `Asia/Jakarta`) → Firebase Cloud Messaging (FCM) web push, **bukan** local notification browser dan **bukan** exact-time trigger. Logika lead time (`dueTaskReminders`, baris 94-116) sengaja pakai jendela "dari lead time sampai waktu mulai" bukan exact match, supaya toleran terhadap granularitas cron 15 menit — desain yang tepat untuk keterbatasan itu.

**Temuan kritis**: fungsi ini **belum pernah berhasil di-deploy ke production**. Project Firebase masih di plan Spark (gratis) — `firebase deploy` gagal dengan error `cloudbuild.googleapis.com` butuh plan Blaze (dikonfirmasi langsung dari sesi sebelumnya saat user mencoba deploy). Artinya **fitur reminder 30 menit ini ada di kode tapi TIDAK aktif di https://jundy-life-tracker-web.web.app/ saat ini** — kalau ada user beta yang mengaktifkan toggle reminder di Pengaturan sekarang, toggle-nya cuma menyimpan setting, tidak ada yang benar-benar mengirim notifikasi. Ini bukan bug kode, tapi **gap antara kode dan yang live** yang harus diketahui sebelum ngomong ke calon user beta soal reminder.

**Batasan iOS/PWA** (tidak spesifik ke kode ini, tapi berlaku untuk mekanismenya):
- Web Push (yang dipakai `firebase/messaging`) di iOS Safari baru didukung sejak iOS 16.4, dan **hanya kalau PWA sudah di-"Add to Home Screen"** — Safari tab biasa (bukan installed) tidak bisa terima web push sama sekali.
- `src/lib/messaging.ts:37-40` — `isSupported()` dari Firebase Messaging SDK akan `false` di kondisi itu, dan errornya cuma teks generik "Browser ini gak support push notification (FCM)" — **tidak ada penjelasan spesifik kenapa** (butuh install PWA dulu, butuh iOS 16.4+). User iOS yang belum install PWA akan bingung kenapa toggle-nya gagal tanpa tahu solusinya.
- Tidak ditemukan satu pun teks di codebase yang menyebut "iOS" atau "Safari" terkait limitasi ini (`grep -rn "iOS\|Safari"` di `src/` cuma nyangkut di komentar WebGL globe dan drag-gesture, tidak relevan ke notifikasi).

### 2.6 Kecepatan input transaksi/task — **BENAR, dan terukur konkret**

**Transaksi** (dari Home, kondisi default, belum pernah buka /keuangan sebelumnya):
1. Tap ikon modul Keuangan di Home (`src/app/page.tsx:236-245`) → mendarat di tab **Overview** (default `useState<Tab>("overview")`, `src/app/keuangan/page.tsx:98`), bukan tab Transaksi.
2. Tap tab "Transaksi".
3. Tap tombol tambah (`Toolbar onAdd`, `src/app/keuangan/page.tsx:264-272`) → buka `TransactionForm`.
4. (Ketik nominal — bukan tap, tapi wajib.)
5. Tap "Simpan".

Minimal **4 tap + 1 input teks wajib** kalau semua default dipakai (kategori default "Makan", akun default akun pertama, tanggal default hari ini — `src/app/keuangan/components/TransactionForm.tsx:35-40`). Kalau kategori/akun/tanggal perlu diubah, tap bertambah. Target Fase 3 (≤3 tap) butuh menghapus minimal langkah 1-2 (skip tab Overview) — realistis lewat quick-add widget di Home sendiri, bukan cuma pindah default tab.

**Task**: alur serupa (`src/app/waktu/page.tsx`) — tap modul → tap tombol tambah → isi `title` dan `dueDate`/`startTime` (`required` di `TaskForm.tsx:95,108,144`, jadi tidak ada shortcut tanpa mengisi field itu) → simpan. Judul task **wajib diketik**, tidak ada default seperti transaksi — secara struktural task selalu butuh minimal 1 input teks tidak bisa dihindari, beda dengan transaksi yang cuma butuh nominal.

### 2.7 Data retensi — **BENAR, belum ada apa-apa**

Tidak ditemukan satu pun integrasi analytics (`grep -rln "analytics|gtag|mixpanel|amplitude|posthog|sentry"` → kosong). Tidak ada Firebase Analytics SDK di `package.json`. `console.error` yang ada (`RegisterSW.tsx:86`, `BackupCard.tsx:27,42`, `notify.ts:72`) cuma log objek error generik, tidak ada PII user yang sengaja dicatat. Confirmed: Fase 4 mulai dari nol, bukan tinggal menyalakan yang sudah ada.

---

## 3. Review Firestore rules

File penuh (`firestore.rules`, 34 baris) sudah dikutip di 2.1. Ringkasan celah:

- **Tidak ada collection lain** selain `users/{uid}/{document=**}` — jadi tidak ada collection root tanpa rules (aman untuk struktur sekarang), tapi **begitu Fase 1 menambah collection `waitlist` di root** (bukan di bawah `users/{uid}`), rules baru wajib ditulis untuk itu secara eksplisit — kalau lupa, default Firestore rules menolak semua akses (aman secara default, tapi harus tetap diverifikasi, bukan diasumsikan).
- **Tidak ada rules test** (`firebase.json` tidak punya key `"emulators"`, tidak ada file test rules, `package.json` tidak punya `firebase-tools` sebagai dependency). Setup emulator harus dibangun dari nol di Fase 2.
- **Tidak ada pemisahan permission read vs write** — `allow read, write` digabung. Untuk data sensitif ini bukan masalah besar (satu-satunya yang boleh akses ya pemilik uid-nya sendiri), tapi kalau Fase 4 menambah halaman admin yang butuh baca data user lain (aggregate, bukan raw), rules baru untuk itu harus dirancang hati-hati agar tidak melebar jadi "admin bisa baca semua data mentah" — harus lewat Cloud Function dengan Admin SDK (bypass rules secara terkontrol di server), bukan lewat client rules yang dilonggarkan.
- Allowlist manual dua tempat (env var + rules literal) sudah dianalisis di 2.1 — jadi operational risk terbesar begitu Fase 5 butuh kelola invite list tanpa deploy ulang (rules literal string array tidak bisa diedit dari admin page tanpa `firebase deploy --only firestore:rules`).

---

## 4. Backup/restore — cakupan data

Sudah dianalisis detail di 2.2. Ringkasan tabel:

| Data | Masuk backup? | Catatan |
|---|---|---|
| transactions, accounts, budgets, debts, goals | Ya | |
| tasks | Ya | |
| content (branding) | Ya | |
| habits, habitLogs, metrics (kesehatan) | Ya | |
| journal (entri + field jurnal) | Ya | |
| **topics** (perpustakaan topik jurnal) | **Tidak** | Gap nyata — `topicIds` di entri jurnal jadi menggantung setelah restore |
| settings/* (finance, waktu, branding, health, notifications, pillars, profile) | Ya (singleton) | |
| gamification/stats | Ya (singleton) | |
| **Rekaman suara jurnal (IndexedDB)** | **Tidak, by design** | Device-only, tidak bisa masuk backup JSON tanpa base64-encode tiap clip — feasible tapi bikin file backup besar; perlu keputusan produk (Fase 2 poin 1) |

---

## 5. Estimasi kerja per fase

Estimasi kasar dalam "sesi kerja" (bukan jam kalender), asumsi satu orang (gua) kerja fokus per fase, sudah termasuk lint/typecheck/test/build tiap fase:

| Fase | Estimasi | Alasan |
|---|---|---|
| 1 — Landing jadi bisa jualan | **Sedang-besar** | Konten baru + waitlist form + rules baru (collection root pertama di luar `users/{uid}`) + privacy/ToS draft + i18n (2x konten). Bagian tersulit bukan koding, tapi menulis privacy/ToS yang akurat ke perilaku app sebenarnya. |
| 2 — Kepercayaan data | **Besar** | Emulator setup dari nol + rules test (belum ada infra sama sekali) + export CSV transaksi + fix gap `topics` di backup + confirm/preview dialog di restore + audit ulang semua `addDoc`-blocking pattern di modul lain. Ini fase paling berisiko menyentuh data user asli — butuh paling hati-hati. |
| 3 — Kecepatan input | **Sedang** | Quick-add widget + PWA shortcuts + kategori/akun default untuk user baru. Cukup mekanis begitu desain quick-add disetujui, tapi butuh keputusan produk (taruh di mana widgetnya di Home) sebelum mulai koding. |
| 4 — Ukur retensi | **Sedang-besar** | Event tracking dari nol (Firebase Analytics atau custom Firestore collection — perlu diputuskan), consent UI, dan halaman admin dengan agregasi (kemungkinan butuh Cloud Function karena agregasi lintas user tidak boleh lewat client rules). |
| 5 — Operasional beta | **Sedang** | Admin page untuk kelola invite (perlu Cloud Function karena rules literal tidak bisa diedit runtime), flag `founding_member`, error message, checklist onboarding. Bergantung pada infra admin dari Fase 4 sudah ada. |

**Urutan yang disarankan**: sesuai urutan di brief (0→1→2→3→4→5) sudah tepat — Fase 2 (kepercayaan data) sebelum Fase 3 (kecepatan input) benar, karena tidak ada gunanya bikin input makin cepat kalau datanya masih bisa hilang diam-diam (audio, restore tanpa konfirmasi). Satu penyesuaian yang gua sarankan: **bagian admin page di Fase 4 dan Fase 5 (kelola invite list) sebaiknya dibangun sekali sebagai infra bersama** (satu halaman `/admin` dengan beberapa tab), bukan dua kali di dua fase berbeda — akan gua tandai lagi kalau sudah mulai Fase 4.

---

## 6. Risiko keamanan/privasi yang kelihatan dari sekarang

1. **Reminder Cloud Function belum live** (2.5) — kalau tidak disebut ke calon user beta, mereka akan mengaktifkan fitur yang diam-diam tidak bekerja. Perlu diputuskan sebelum Fase 1 selesai: apakah upgrade ke Blaze duluan, atau landing page & FAQ jujur bilang "reminder belum aktif di beta awal".
2. **Allowlist manual dua tempat** (2.1, 3) — makin banyak email beta, makin besar risiko lupa sinkron. Fase 5 mengatasi ini, tapi sampai Fase 5 jalan, tiap tambah email manual tetap harus dicek dua kali.
3. **Restore tanpa konfirmasi** (2.2) — bug produk (bukan security), tapi bisa terasa seperti kehilangan data kalau user salah pilih file backup lama.
4. **Audio jurnal tanpa peringatan** (2.4) — risiko reputasi kalau user ganti HP dan audio hilang tanpa pernah diberi tahu itu mungkin terjadi.
5. **Tidak ada rate limiting di rules** untuk write — bukan masalah untuk pemakaian personal, tapi kalau beta dibuka ke banyak orang dan satu akun disalahgunakan (script abuse), tidak ada guardrail Firestore-level. Di luar scope brief ini, tapi dicatat untuk kalau nanti relevan.
6. **Tidak ada Content Security Policy / security headers** di `firebase.json` `hosting.headers` — cuma Cache-Control yang diatur. Tidak diminta di brief, dicatat sebagai observasi murah untuk ditambahkan kapan saja.

---

## 7. Catatan tambahan yang tidak diminta eksplisit tapi relevan

- `next.config.ts` — belum dibaca detail di audit ini (di luar 8 poin yang diminta); kalau Fase 1 butuh ubah `next.config.ts` (misal untuk OG image atau redirect), akan dibaca saat itu.
- Dua user aktif sekarang: `aljihadjundy@gmail.com` dan `mayakris402@gmail.com` (dari `firestore.rules`). Semua estimasi retensi/analitik di Fase 4 baru punya data setelah beta dibuka lebih luas — dengan 2 user, angka D1/D7 apa pun secara statistik tidak bermakna dulu.

---

**STOP.** Menunggu approval sebelum mulai Fase 1.
