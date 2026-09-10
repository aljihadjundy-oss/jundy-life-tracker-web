"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import SettingsLink from "@/components/SettingsLink";
import { useAuth } from "@/lib/auth-context";
import { subscribeTransactions } from "@/lib/finance";
import { subscribeTasks } from "@/lib/waktu";
import { subscribeContent } from "@/lib/branding";
import { subscribeHabitLogs, subscribeHabits } from "@/lib/kesehatan";
import type { Transaction } from "@/types/finance";
import type { Task } from "@/types/waktu";
import type { ContentItem } from "@/types/branding";
import type { Habit, HabitLog } from "@/types/kesehatan";
import { formatCurrency, currentMonthKey, todayISO, addDaysISO } from "@/lib/format";

const MODULES = [
  { href: "/keuangan", label: "Keuangan", emoji: "💰", gradient: "from-emerald-400 to-teal-500", live: true },
  { href: "/waktu", label: "Waktu", emoji: "🗓️", gradient: "from-blue-400 to-indigo-500", live: true },
  { href: "/branding", label: "Branding", emoji: "✨", gradient: "from-pink-400 to-fuchsia-500", live: true },
  { href: "/kesehatan", label: "Kesehatan", emoji: "❤️", gradient: "from-orange-400 to-red-500", live: true },
] as const;

export default function HomePage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubTx = subscribeTransactions(user.uid, setTransactions);
    const unsubTasks = subscribeTasks(user.uid, setTasks);
    const unsubContent = subscribeContent(user.uid, setContent);
    const unsubHabits = subscribeHabits(user.uid, setHabits);
    const unsubHabitLogs = subscribeHabitLogs(user.uid, setHabitLogs);
    return () => {
      unsubTx();
      unsubTasks();
      unsubContent();
      unsubHabits();
      unsubHabitLogs();
    };
  }, [user]);

  const { balance, monthExpense } = useMemo(() => {
    const month = currentMonthKey();
    let income = 0;
    let expense = 0;
    let monthExpense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
      if (t.type === "expense" && t.date.startsWith(month)) monthExpense += t.amount;
    }
    return { balance: income - expense, monthExpense };
  }, [transactions]);

  const { todayTaskCount, overdueTaskCount } = useMemo(() => {
    const today = todayISO();
    let todayTaskCount = 0;
    let overdueTaskCount = 0;
    for (const t of tasks) {
      if (t.status === "done") continue;
      if (t.dueDate === today) todayTaskCount++;
      else if (t.dueDate < today) overdueTaskCount++;
    }
    return { todayTaskCount, overdueTaskCount };
  }, [tasks]);

  const streak = useMemo(() => {
    const postedDates = new Set(content.filter((c) => c.status === "posted").map((c) => c.postDate));
    const today = todayISO();
    let streak = 0;
    for (let i = 0; ; i++) {
      const date = addDaysISO(today, -i);
      if (postedDates.has(date)) streak++;
      else break;
    }
    return streak;
  }, [content]);

  const { habitStreak, doneToday, totalHabits } = useMemo(() => {
    const today = todayISO();
    const logsByDate = new Map<string, Set<string>>();
    for (const log of habitLogs) {
      if (!logsByDate.has(log.date)) logsByDate.set(log.date, new Set());
      logsByDate.get(log.date)!.add(log.habitId);
    }
    const isComplete = (date: string) => {
      if (habits.length === 0) return false;
      const ids = logsByDate.get(date);
      return !!ids && habits.every((h) => ids.has(h.id));
    };
    let habitStreak = 0;
    for (let i = 0; ; i++) {
      if (isComplete(addDaysISO(today, -i))) habitStreak++;
      else break;
    }
    const todayIds = logsByDate.get(today);
    const doneToday = todayIds ? habits.filter((h) => todayIds.has(h.id)).length : 0;
    return { habitStreak, doneToday, totalHabits: habits.length };
  }, [habits, habitLogs]);

  const otherModules = MODULES.filter((m) => !m.live);

  const firstName = user?.displayName?.split(" ")[0] ?? "";

  return (
    <>
      <TopBar
        title={`Halo, ${firstName || "Jundy"} 👋`}
        subtitle="Ini ringkasan hari ini"
        extra={<SettingsLink />}
      />

      <section className="mt-2 px-5">
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {MODULES.map((m) => (
            <Link key={m.href} href={m.href} className="flex flex-col items-center gap-1.5">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${m.gradient} p-[2.5px]`}>
                <div className="flex h-full w-full items-center justify-center rounded-full bg-surface text-2xl">
                  {m.emoji}
                </div>
              </div>
              <span className="text-[11px] font-medium text-ink-muted">{m.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5 flex flex-col gap-3 px-5">
        <Link
          href="/keuangan"
          className="block rounded-3xl bg-gradient-to-br from-brand-start via-brand-mid to-brand-end p-5 text-white shadow-lg shadow-brand-mid/20 transition active:scale-[0.98]"
        >
          <p className="text-xs font-medium text-white/80">Saldo Kamu</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{formatCurrency(balance)}</p>
          <p className="mt-3 text-xs text-white/85">
            Pengeluaran bulan ini: {formatCurrency(monthExpense)}
          </p>
        </Link>

        <Link
          href="/waktu"
          className="block rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 p-5 text-white shadow-lg shadow-indigo-500/20 transition active:scale-[0.98]"
        >
          <p className="text-xs font-medium text-white/80">Task Hari Ini</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            {todayTaskCount} task{overdueTaskCount > 0 ? `, ${overdueTaskCount} telat` : ""}
          </p>
          <p className="mt-3 text-xs text-white/85">Tap buat lihat agenda lengkap</p>
        </Link>

        <Link
          href="/branding"
          className="block rounded-3xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-400 p-5 text-white shadow-lg shadow-pink-500/20 transition active:scale-[0.98]"
        >
          <p className="text-xs font-medium text-white/80">Konsistensi Posting</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            {streak > 0 ? `🔥 ${streak} hari beruntun` : "Belum ada streak"}
          </p>
          <p className="mt-3 text-xs text-white/85">Tap buat lihat content calendar</p>
        </Link>

        <Link
          href="/kesehatan"
          className="block rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-500 p-5 text-white shadow-lg shadow-orange-500/20 transition active:scale-[0.98]"
        >
          <p className="text-xs font-medium text-white/80">Habit Streak</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            {habitStreak > 0 ? `🔥 ${habitStreak} hari beruntun` : "Belum ada streak"}
          </p>
          <p className="mt-3 text-xs text-white/85">
            {totalHabits > 0 ? `${doneToday}/${totalHabits} habit selesai hari ini` : "Tap buat mulai tracking"}
          </p>
        </Link>
      </section>

      {otherModules.length > 0 && (
        <section className="mt-6 px-5">
          <h2 className="mb-3 text-sm font-bold text-ink">Modul Lain</h2>
          <div className="flex flex-col gap-2.5">
            {otherModules.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="flex items-center gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60 transition active:scale-[0.98]"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${m.gradient} text-lg`}>
                  {m.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{m.label}</p>
                  <p className="text-xs text-ink-muted">Segera hadir</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-muted">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
