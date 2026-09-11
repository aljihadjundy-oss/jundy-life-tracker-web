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
import { useT } from "@/lib/i18n";
import GameHeader from "@/components/GameHeader";
import BadgeCoverflow from "@/components/BadgeCoverflow";
import SummaryCoverflow, { type SummaryCard } from "@/components/SummaryCoverflow";
import { subscribeStats } from "@/lib/gamification";
import { EMPTY_STATS, type GameStats } from "@/types/gamification";

const MODULES = [
  { href: "/keuangan", labelKey: "home.modules.finance", emoji: "💰", gradient: "from-emerald-400 to-teal-500" },
  { href: "/waktu", labelKey: "home.modules.time", emoji: "🗓️", gradient: "from-blue-400 to-indigo-500" },
  { href: "/branding", labelKey: "home.modules.branding", emoji: "✨", gradient: "from-pink-400 to-fuchsia-500" },
  { href: "/kesehatan", labelKey: "home.modules.health", emoji: "❤️", gradient: "from-orange-400 to-red-500" },
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
  const t = useT();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>(EMPTY_STATS);

  useEffect(() => {
    if (!user) return;
    const unsubTx = subscribeTransactions(user.uid, setTransactions);
    const unsubTasks = subscribeTasks(user.uid, setTasks);
    const unsubContent = subscribeContent(user.uid, setContent);
    const unsubHabits = subscribeHabits(user.uid, setHabits);
    const unsubHabitLogs = subscribeHabitLogs(user.uid, setHabitLogs);
    const unsubStats = subscribeStats(user.uid, setGameStats);
    return () => {
      unsubTx();
      unsubTasks();
      unsubContent();
      unsubHabits();
      unsubHabitLogs();
      unsubStats();
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

  const firstName = user?.displayName?.split(" ")[0] ?? "";

  const summaryCards: SummaryCard[] = [
    {
      href: "/keuangan",
      gradient: "from-brand-start via-brand-mid to-brand-end",
      label: t("home.balance"),
      value: formatCurrency(balance),
      hint: t("home.monthExpense", { amount: formatCurrency(monthExpense) }),
    },
    {
      href: "/waktu",
      gradient: "from-blue-500 via-indigo-500 to-violet-500",
      label: t("home.todayTasks"),
      value:
        t("home.taskCount", { count: todayTaskCount }) +
        (overdueTaskCount > 0 ? t("home.taskOverdue", { count: overdueTaskCount }) : ""),
      hint: t("home.tapAgenda"),
    },
    {
      href: "/branding",
      gradient: "from-fuchsia-500 via-pink-500 to-rose-400",
      label: t("home.postingConsistency"),
      value: streak > 0 ? t("home.streakDays", { count: streak }) : t("home.noStreak"),
      hint: t("home.tapCalendar"),
    },
    {
      href: "/kesehatan",
      gradient: "from-orange-500 via-red-500 to-rose-500",
      label: t("home.habitStreak"),
      value:
        habitStreak > 0 ? t("home.streakDays", { count: habitStreak }) : t("home.noStreak"),
      hint:
        totalHabits > 0
          ? t("home.habitDone", { done: doneToday, total: totalHabits })
          : t("home.tapStartTracking"),
    },
  ];

  return (
    <>
      <TopBar
        title={t("home.greeting", { name: firstName || "Jundy" })}
        subtitle={t("home.subtitle")}
        extra={<SettingsLink />}
      />

      <div className="mt-2">
        <GameHeader stats={gameStats} />
      </div>

      <section className="mt-5 px-5">
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {MODULES.map((m) => (
            <Link key={m.href} href={m.href} className="flex flex-col items-center gap-1.5">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${m.gradient} p-[2.5px]`}>
                <div className="flex h-full w-full items-center justify-center rounded-full bg-surface text-2xl">
                  {m.emoji}
                </div>
              </div>
              <span className="text-[11px] font-medium text-ink-muted">{t(m.labelKey)}</span>
            </Link>
          ))}
        </div>
      </section>

      <SummaryCoverflow cards={summaryCards} />

      <BadgeCoverflow stats={gameStats} />
    </>
  );
}
