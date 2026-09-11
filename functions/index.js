const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { getAuth } = require("firebase-admin/auth");
const logger = require("firebase-functions/logger");

initializeApp();

const TIMEZONE = "Asia/Jakarta";

function nowHHmm() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONE,
  });
}

function todayISO() {
  // en-CA locale formats as yyyy-mm-dd
  return new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

async function buildSummary(db, uid, today) {
  // A pillar the user switched off should not turn up in their reminders.
  const pillarsSnap = await db.doc(`users/${uid}/settings/pillars`).get();
  const pillars = pillarsSnap.data() || {};
  const wantsTime = pillars.time !== false;
  const wantsHealth = pillars.health !== false;

  const [tasksSnap, habitsSnap, logsSnap] = await Promise.all([
    wantsTime
      ? db.collection(`users/${uid}/tasks`).where("dueDate", "==", today).get()
      : { docs: [] },
    wantsHealth ? db.collection(`users/${uid}/habits`).get() : { docs: [] },
    wantsHealth
      ? db.collection(`users/${uid}/habitLogs`).where("date", "==", today).get()
      : { docs: [] },
  ]);

  const tasksLeft = tasksSnap.docs.filter((d) => {
    const status = d.data().status;
    return status !== "done" && status !== "ghosted";
  }).length;

  const doneHabitIds = new Set(logsSnap.docs.map((d) => d.data().habitId));
  const habitsLeft = habitsSnap.docs.filter((d) => !doneHabitIds.has(d.id)).length;

  const parts = [];
  if (tasksLeft > 0) parts.push(`${tasksLeft} task`);
  if (habitsLeft > 0) parts.push(`${habitsLeft} habit`);

  return parts.length > 0
    ? `Masih ada ${parts.join(" & ")} yang belum kelar hari ini.`
    : "Semua beres hari ini. Mantap! 🎉";
}

// ---------------------------------------------------------------------------
// Per-task reminders
//
// A task stores a wall-clock time ("09:00") rather than an instant, so all the
// arithmetic below happens in wall-clock minutes inside TIMEZONE. That keeps a
// "9 in the morning" task at 9 in the morning no matter where the phone is.
// ---------------------------------------------------------------------------

function dayIndex(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

function minutesFromHHmm(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function addDaysISO(isoDate, days) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Wall-clock minutes since the epoch, in TIMEZONE. */
function wallMinutes(isoDate, hhmm) {
  return dayIndex(isoDate) * 1440 + minutesFromHHmm(hhmm);
}

/**
 * Tasks whose reminder is due. Rather than matching a tick window exactly — the
 * cron only guarantees 15-minute granularity, so an exact match drops reminders
 * whenever the schedule drifts — a reminder is due from its lead time right up
 * until the task starts. The notifiedFor stamp keeps it from firing twice.
 */
async function dueTaskReminders(db, uid, today, nowWall) {
  const dates = [addDaysISO(today, -1), today, addDaysISO(today, 1)];
  const snap = await db.collection(`users/${uid}/tasks`).where("dueDate", "in", dates).get();

  const due = [];
  for (const docSnap of snap.docs) {
    const task = docSnap.data();
    if (task.status === "done" || task.status === "ghosted") continue;
    if (!/^\d{2}:\d{2}$/.test(task.startTime || "")) continue;

    const lead = typeof task.reminderMinutes === "number" ? task.reminderMinutes : 0;
    if (lead <= 0) continue;

    const slot = `${task.dueDate}T${task.startTime}`;
    if (task.notifiedFor === slot) continue;

    const minutesLeft = wallMinutes(task.dueDate, task.startTime) - nowWall;
    if (minutesLeft <= 0 || minutesLeft > lead) continue;

    due.push({ ref: docSnap.ref, task, slot, minutesLeft });
  }
  return due;
}

/**
 * Rima's bedtime nudge: 30 minutes before the sleep time set in the Kesehatan
 * module. Bedtime is a time of day, so the window wraps around midnight; the
 * stamp on the notifications doc keeps it to once per night.
 */
const BEDTIME_LEAD = 30;

function bedtimeReminderDue(health, settings, nowMinutes, today) {
  if (!health || !/^\d{2}:\d{2}$/.test(health.bedtime || "")) return null;

  const bed = minutesFromHHmm(health.bedtime);
  const remindAt = (bed - BEDTIME_LEAD + 1440) % 1440;
  // Cyclic distance, so a 00:15 bedtime still matches a 23:45 tick.
  const elapsed = (nowMinutes - remindAt + 1440) % 1440;
  if (elapsed >= BEDTIME_LEAD) return null;

  const slot = `${today}T${health.bedtime}`;
  if (settings.bedtimeNotifiedFor === slot) return null;
  return slot;
}

async function pruneInvalidTokens(db, uid, tokens, responses) {
  const invalid = [];
  responses.forEach((res, i) => {
    if (!res.success) {
      const code = res.error && res.error.code;
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        invalid.push(tokens[i]);
      }
    }
  });
  if (invalid.length === 0) return;

  await db
    .doc(`users/${uid}/settings/notifications`)
    .update({ fcmTokens: FieldValue.arrayRemove(...invalid) });
}

exports.sendDailyReminders = onSchedule(
  { schedule: "every 15 minutes", timeZone: TIMEZONE },
  async () => {
    const db = getFirestore();
    const currentTime = nowHHmm();
    const today = todayISO();

    const nowWall = wallMinutes(today, currentTime);

    const { users } = await getAuth().listUsers();

    for (const user of users) {
      const uid = user.uid;
      const settingsSnap = await db.doc(`users/${uid}/settings/notifications`).get();
      if (!settingsSnap.exists) continue;

      const settings = settingsSnap.data();
      if (!settings.enabled) continue;

      const tokens = Array.isArray(settings.fcmTokens) ? settings.fcmTokens : [];
      if (tokens.length === 0) continue;

      const messages = [];

      if (settings.reminderTime === currentTime) {
        messages.push({
          title: "Life Tracker",
          body: await buildSummary(db, uid, today),
          link: "/",
        });
      }

      const healthSnap = await db.doc(`users/${uid}/settings/health`).get();
      const bedtimeSlot = bedtimeReminderDue(
        healthSnap.data(),
        settings,
        minutesFromHHmm(currentTime),
        today
      );
      if (bedtimeSlot) {
        messages.push({
          title: "Waktunya siap-siap tidur",
          body: `${BEDTIME_LEAD} menit lagi jam tidurmu.`,
          link: "/kesehatan",
        });
      }

      const pillarsSnap = await db.doc(`users/${uid}/settings/pillars`).get();
      const timeOn = (pillarsSnap.data() || {}).time !== false;

      const reminders = timeOn ? await dueTaskReminders(db, uid, today, nowWall) : [];
      for (const { task, minutesLeft } of reminders) {
        messages.push({
          title: `${minutesLeft} menit lagi: ${task.title}`,
          body: task.note
            ? `${task.startTime} · ${task.note}`
            : `Mulai jam ${task.startTime}.`,
          link: "/waktu",
        });
      }

      if (messages.length === 0) continue;

      for (const message of messages) {
        const response = await getMessaging().sendEachForMulticast({
          tokens,
          notification: { title: message.title, body: message.body },
          webpush: { fcmOptions: { link: message.link } },
        });

        logger.info(`Notification sent to ${uid}`, {
          success: response.successCount,
          failure: response.failureCount,
        });

        if (response.failureCount > 0) {
          await pruneInvalidTokens(db, uid, tokens, response.responses);
        }
      }

      // Stamp the slots last: if a send above threw, the next tick retries
      // rather than silently swallowing the reminder.
      for (const { ref, slot } of reminders) {
        await ref.update({ notifiedFor: slot });
      }
      if (bedtimeSlot) {
        await db.doc(`users/${uid}/settings/notifications`).update({ bedtimeNotifiedFor: bedtimeSlot });
      }
    }
  }
);
