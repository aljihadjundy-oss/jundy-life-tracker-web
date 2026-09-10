# Jundy Life Tracker

Personal life tracker — mobile-first PWA. 4 modul: Keuangan, Waktu, Branding, Kesehatan.
Modul **Keuangan** udah jalan end-to-end (auth → input → Firestore → tampil di UI). Modul lain masih "Segera hadir".

## Tech Stack

- Next.js (App Router, static export) + Tailwind CSS v4
- Firebase Auth (Google Sign-In, single-user lock) + Firestore
- PWA: manifest.json + custom service worker (`public/sw.js`)
- Firebase Hosting

## Setup

1. Bikin project di [Firebase Console](https://console.firebase.google.com), tambahin Web App.
2. Aktifin **Authentication → Sign-in method → Google**.
3. Aktifin **Firestore Database** (mode production, region terdekat).
4. Copy `.env.local.example` jadi `.env.local`, isi semua `NEXT_PUBLIC_FIREBASE_*` dari config Web App lo. `NEXT_PUBLIC_OWNER_EMAIL` udah default ke email lo — cuma akun ini yang bisa login.
5. `npm install`
6. `npm run dev` → buka `http://localhost:3000`

## Deploy ke Firebase Hosting

```bash
npm install -g firebase-tools   # sekali aja
firebase login
```

Isi project ID lo di `.firebaserc` (ganti `REPLACE_WITH_FIREBASE_PROJECT_ID`), lalu:

```bash
npm run build          # generate static export ke folder out/
firebase deploy
```

Ini deploy Hosting + Firestore rules (`firestore.rules`) sekaligus.

## Struktur Folder

```
src/
  app/                  # routes (App Router) — 1 folder per modul
    keuangan/           # modul Keuangan (live)
      components/
    waktu/               # placeholder
    branding/            # placeholder
    kesehatan/           # placeholder
    login/
  components/           # shared UI (BottomNav, AppShell, TopBar, dst)
  lib/                  # firebase.ts, auth-context.tsx, finance.ts, format.ts
  types/                # type definitions per modul
public/
  manifest.json, sw.js, icons/
firestore.rules          # data di-lock per uid (users/{uid}/...)
```

## Data Model (Firestore)

```
users/{uid}/transactions/{id}   → { type, amount, category, note, date, createdAt }
users/{uid}/settings/finance    → { monthlyBudget }
```

Modul berikutnya (Waktu, Branding, Kesehatan) bakal nambah subcollection sendiri di bawah `users/{uid}/...` dengan pola yang sama.
