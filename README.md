# Jundy Life Tracker

Personal life tracker — mobile-first PWA. 5 modul, semua jalan end-to-end (auth → input → Firestore → tampil di UI):
**Keuangan**, **Waktu**, **Branding**, **Kesehatan**, **Jurnal** — plus reminder push notification harian.

## Tech Stack

- Next.js (App Router, static export) + Tailwind CSS v4
- Firebase Auth (Google Sign-In, single-user lock) + Firestore
- Firebase Cloud Messaging (push notification) + Cloud Functions (reminder terjadwal)
- PWA: manifest.json + custom service worker (`public/sw.js`)
- Firebase Hosting

## Setup Dasar (wajib)

1. Bikin project di [Firebase Console](https://console.firebase.google.com), tambahin Web App.
2. Aktifin **Authentication → Sign-in method → Google**.
3. Aktifin **Firestore Database** (mode production, region terdekat).
4. Copy `.env.local.example` jadi `.env.local`, isi semua `NEXT_PUBLIC_FIREBASE_*` dari config Web App lo. `NEXT_PUBLIC_OWNER_EMAIL` udah default ke email lo — cuma akun ini yang bisa login.
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
    keuangan/            # transaksi, budget bulanan
      components/
    waktu/                # task list, agenda harian
      components/
    branding/             # content calendar, konsistensi posting
      components/
    kesehatan/            # habit checklist, log metrik
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
users/{uid}/transactions/{id}     → { type, amount, category, note, date, createdAt }
users/{uid}/settings/finance      → { monthlyBudget }
users/{uid}/tasks/{id}            → { title, note, dueDate, status, createdAt }
users/{uid}/content/{id}          → { title, platform, postDate, status, note, createdAt }
users/{uid}/habits/{id}           → { name, createdAt }
users/{uid}/habitLogs/{date_habitId} → { habitId, date }
users/{uid}/metrics/{date}        → { date, sleepHours, exerciseMinutes, waterGlasses }
users/{uid}/journal/{id}          → { title, content, mood, date, createdAt, updatedAt }
users/{uid}/settings/notifications → { enabled, reminderTime, fcmTokens: [...] }
```

## Kenapa gak ada reminder ke WhatsApp?

Gak ada cara ngirim pesan WhatsApp otomatis yang beneran gratis & legal: WhatsApp Business API resmi (Meta) berbayar & perlu approval bisnis, sedangkan library unofficial butuh server nyala terus dan melanggar ToS WhatsApp (risiko nomor ke-ban). Push notification browser (yang dipakai di sini) adalah alternatif yang gratis, reliable, dan tetep muncul sebagai notif asli di HP.
