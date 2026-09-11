# Andropid

> *anthropoid* (ἀνθρωποειδής) — menyerupai manusia. Namanya sinis dengan sengaja:
> manusia cuma monyet yang kebetulan bisa mikir. Aplikasi ini buat ngelacak
> seberapa jauh mikirnya kepakai.

Personal life tracker — mobile-first PWA. 5 modul, semua jalan end-to-end (auth → input → Firestore → tampil di UI):
**Keuangan**, **Waktu**, **Branding**, **Kesehatan**, **Jurnal** — plus gamifikasi ala Duolingo (XP, level, streak, lencana), dwibahasa Indonesia/English, dan reminder push notification harian.

## Tech Stack

- Next.js (App Router, static export) + Tailwind CSS v4
- Firebase Auth (Google Sign-In, single-user lock) + Firestore
- Firebase Cloud Messaging (push notification) + Cloud Functions (reminder terjadwal)
- Dwibahasa (ID/EN) lewat kamus terjemahan sendiri, tanpa dependensi i18n
- PWA: manifest.json + custom service worker (`public/sw.js`)
- Firebase Hosting

## Setup Dasar (wajib)

1. Bikin project di [Firebase Console](https://console.firebase.google.com), tambahin Web App.
2. Aktifin **Authentication → Sign-in method → Google**.
3. Aktifin **Firestore Database** (mode production, region terdekat).
4. Copy `.env.local.example` jadi `.env.local`, isi semua `NEXT_PUBLIC_FIREBASE_*` dari config Web App lo. `NEXT_PUBLIC_OWNER_EMAIL` udah default ke email lo — cuma akun ini yang bisa login.

   > **Penting soal `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`:** isi dengan domain Hosting (`<project-id>.web.app`), **bukan** `<project-id>.firebaseapp.com` yang dikasih Firebase Console. Login Google butuh `authDomain` satu origin dengan app-nya. Kalau beda origin, browser yang memblokir cookie/storage pihak ketiga (Chrome, apalagi mode incognito) bikin konteks login gagal baca konfigurasinya sendiri, dan errornya menyesatkan: `auth/api-key-not-valid` padahal API key-nya benar.
5. `npm install`
6. `npm run dev` → buka `http://localhost:3000`

## Setup Reminder / Push Notification (opsional)

Fitur reminder (notif "masih ada task/habit yang belum kelar") butuh dua bagian: FCM di sisi client (udah kebangun) dan Cloud Function terjadwal di sisi server (perlu di-deploy manual). Tanpa langkah ini, toggle reminder di halaman **Pengaturan** cuma nyimpen setting doang, gak ada yang benar-benar ngirim notif.

1. **Generate VAPID key**: Firebase Console → Project Settings → Cloud Messaging → tab "Web configuration" → **Generate key pair**. Copy key-nya ke `NEXT_PUBLIC_FIREBASE_VAPID_KEY` di `.env.local`.
2. **Upgrade ke plan Blaze** (pay-as-you-go): Cloud Functions gak bisa deploy di plan Spark (gratis). Blaze tetep gratis selama pemakaian di bawah kuota gratis bulanan (2 juta invocation buat Cloud Functions, jauh di atas kebutuhan 1 orang) — cuma perlu daftarin metode pembayaran buat jaga-jaga kalau kepake lebih.
3. **Install dependencies functions**:
   ```bash
   cd functions
   npm install
   cd ..
   ```
4. **Deploy function**:
   ```bash
   firebase deploy --only functions
   ```
   Ini deploy `sendDailyReminders` — jalan tiap 15 menit, ngecek user yang jam reminder-nya cocok sama waktu sekarang (timezone Asia/Jakarta), terus kirim push berisi ringkasan task & habit yang belum kelar hari itu.
5. Buka app → **Pengaturan** → tap "Aktifkan Notifikasi" (izinin notifikasi di browser) → toggle reminder harian, atur jam-nya.

Catatan: push notification butuh HTTPS (otomatis di Firebase Hosting) — gak jalan di `localhost` biasa kecuali browser mendukung eksepsi buat localhost.


## Fitur Tambahan

### Gamifikasi

Tiap aksi produktif memberi XP — catat transaksi (5), kelarkan task (15), centang habit (10), tulis jurnal (20), tayangkan konten (25). XP menaikkan level, dan XP harian dibandingkan dengan target harian (diatur di Pengaturan) untuk membentuk streak. Ada 11 lencana yang terbuka otomatis saat syaratnya terpenuhi. Semua tersimpan di `users/{uid}/gamification/stats`.

### Import Mutasi Rekening (CSV)

Tidak ada API bank untuk perorangan di Indonesia — semua penyedia open banking (Brick, Ayoconnect, Finantier) bersifat B2B berbayar. Sebagai gantinya, modul Keuangan menerima **export CSV dari m-banking**: tombol "Import" di halaman Keuangan → pilih file → cocokkan kolom (tanggal, keterangan, debit/kredit atau jumlah) → pratinjau → impor massal.

Parser-nya mengenali pemisah `,` `;` tab dan `|`, format angka Indonesia (`1.250.500,00`) maupun Inggris (`1,250,500.00`), serta tanggal `dd/mm/yyyy`, `yyyy-mm-dd`, dan `dd-mm-yy`. Baris tanpa tanggal atau nominal valid ditandai dan dilewati.

### Statistik YouTube

Modul Branding bisa menarik statistik channel (subscriber, total view, jumlah video, 3 video terbaru) memakai **API key saja**, tanpa OAuth dan tanpa backend. Setup:

1. Google Cloud Console → APIs & Services → aktifkan **YouTube Data API v3**
2. Buat API key, lalu **batasi**: Application restrictions = HTTP referrers (isi domain Hosting kamu), API restrictions = YouTube Data API v3 saja. Key ini terkirim ke browser, jadi pembatasan inilah pengamannya.
3. Isi `NEXT_PUBLIC_YOUTUBE_API_KEY` di `.env.local`, build ulang, lalu hubungkan handle channel dari halaman Branding.

Instagram, Threads, dan TikTok sengaja tidak diintegrasikan: ketiganya butuh akun Business/Creator, backend untuk menyimpan client secret, dan App Review (Meta 2-4 minggu, TikTok 3-7 hari).

## Deploy ke Firebase Hosting

```bash
npm install -g firebase-tools   # sekali aja
firebase login
```

Isi project ID lo di `.firebaserc` (ganti `REPLACE_WITH_FIREBASE_PROJECT_ID`), lalu:

```bash
npm run build          # generate static export ke folder out/
firebase deploy         # deploy hosting + firestore rules + functions (kalau udah di-setup)
```

## Struktur Folder

```
src/
  app/                  # routes (App Router) — 1 folder per modul
    keuangan/            # net worth, transaksi, budget per kategori, rekening, utang, target
      components/
    waktu/                # task ops: kalender, filter, grouping, strike, ringkasan
      components/
    branding/             # content calendar, konsistensi posting
      components/
    kesehatan/            # siklus/fase, air, makan, tidur, mood, gejala, gerak, habit
      components/
    jurnal/               # free writing / journaling
      components/
    pengaturan/           # aktifin notifikasi, jam reminder
      components/
    login/
  components/            # shared UI (BottomNav, AppShell, TopBar, SettingsLink, dst)
  lib/                   # firebase.ts, auth-context.tsx, messaging.ts, format.ts, dst — 1 file per modul
  types/                 # type definitions per modul
public/
  manifest.json, sw.js (PWA cache + FCM background handler), icons/
functions/               # Cloud Function terjadwal buat kirim reminder push
firestore.rules           # data di-lock per uid (users/{uid}/...)
```

## Data Model (Firestore)

```
users/{uid}/transactions/{id}     → { type (income|expense|transfer), amount, category, note,
                                      date, accountId, toAccountId, needWant, fixed, status,
                                      createdAt }
users/{uid}/accounts/{id}         → { name, type, openingBalance, asOf, note, createdAt }
users/{uid}/budgets/{id}          → { month, category, planned, createdAt }
users/{uid}/debts/{id}            → { name, creditor, principal, remaining, installment,
                                      dueDate, interest, note, status, createdAt }
users/{uid}/goals/{id}            → { name, targetAmount, currentAmount, deadline, priority,
                                      type, createdAt }
users/{uid}/settings/finance      → { monthlyBudget, allocationBase, allocations: [...] }
users/{uid}/tasks/{id}            → { title, note, dueDate, startTime, durationMinutes,
                                      reminderMinutes, status, category, owner, unit, link,
                                      source, createdAt, completedAt, notifiedFor }
users/{uid}/content/{id}          → { title, platform, postDate, status, note, createdAt }
users/{uid}/habits/{id}           → { name, createdAt }
users/{uid}/habitLogs/{date_habitId} → { habitId, date }
users/{uid}/metrics/{date}        → { date, sleepHours, exerciseMinutes, waterGlasses,
                                      energy, mood, symptoms, mealsDone, exercise }
users/{uid}/journal/{id}          → { title, content, mood, date, hasAudio, audioSeconds,
                                      createdAt, updatedAt }
                                    (audio itself: IndexedDB on the recording device, not synced)
users/{uid}/settings/notifications → { enabled, reminderTime, fcmTokens: [...], bedtimeNotifiedFor }
users/{uid}/settings/health       → { bodyMode, cycleStart, cycleLength, periodLength, dueDate,
                                      waterTarget, meals, bedtime, wakeTime, exercisePrefs }
users/{uid}/settings/branding     → { youtubeChannel }
users/{uid}/settings/waktu        → { units: [...], strikes: { "<owner>": 0-3 } }
users/{uid}/gamification/stats    → { totalXp, dailyGoal, xpByDate, unlockedBadges, counters }
users/{uid}/settings/profile      → { displayName, gender, birthDate, occupation, onboardedAt }
users/{uid}/settings/pillars      → { finance, time, branding, health, journal }
```

## Kenapa gak ada reminder ke WhatsApp?

Gak ada cara ngirim pesan WhatsApp otomatis yang beneran gratis & legal: WhatsApp Business API resmi (Meta) berbayar & perlu approval bisnis, sedangkan library unofficial butuh server nyala terus dan melanggar ToS WhatsApp (risiko nomor ke-ban). Push notification browser (yang dipakai di sini) adalah alternatif yang gratis, reliable, dan tetep muncul sebagai notif asli di HP.
