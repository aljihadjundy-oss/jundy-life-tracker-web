"use client";

import { useSyncExternalStore } from "react";
import { translations, type Lang } from "./translations";

const STORAGE_KEY = "lang";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "id" ? stored : "id";
  } catch {
    return "id";
  }
}

function getServerSnapshot(): Lang {
  return "id";
}

export function setLanguage(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // private mode — language just won't persist across reloads
  }
  document.documentElement.lang = lang;
  listeners.forEach((l) => l());
}

export function useLanguage(): Lang {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

function translate(lang: Lang, key: string, vars?: Record<string, string | number>) {
  const dict = translations[lang];
  let text = dict[key] ?? translations.id[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

export function useT(): Translate {
  const lang = useLanguage();
  return (key, vars) => translate(lang, key, vars);
}

// Locale for Intl formatting (currency, dates, weekdays).
export function useLocale() {
  return useLanguage() === "en" ? "en-US" : "id-ID";
}
