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
  const [tasksSnap, habitsSnap, logsSnap] = await Promise.all([
    db.collection(`users/${uid}/tasks`).where("dueDate", "==", today).get(),
    db.collection(`users/${uid}/habits`).get(),
    db.collection(`users/${uid}/habitLogs`).where("date", "==", today).get(),
  ]);

  const tasksLeft = tasksSnap.docs.filter((d) => d.data().status !== "done").length;

  const doneHabitIds = new Set(logsSnap.docs.map((d) => d.data().habitId));
  const habitsLeft = habitsSnap.docs.filter((d) => !doneHabitIds.has(d.id)).length;

  const parts = [];
  if (tasksLeft > 0) parts.push(`${tasksLeft} task`);
  if (habitsLeft > 0) parts.push(`${habitsLeft} habit`);

  return parts.length > 0
    ? `Masih ada ${parts.join(" & ")} yang belum kelar hari ini.`
    : "Semua beres hari ini. Mantap! 🎉";
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

    const { users } = await getAuth().listUsers();

    for (const user of users) {
      const uid = user.uid;
      const settingsSnap = await db.doc(`users/${uid}/settings/notifications`).get();
      if (!settingsSnap.exists) continue;

      const settings = settingsSnap.data();
      if (!settings.enabled || settings.reminderTime !== currentTime) continue;

      const tokens = Array.isArray(settings.fcmTokens) ? settings.fcmTokens : [];
      if (tokens.length === 0) continue;

      const body = await buildSummary(db, uid, today);

      const response = await getMessaging().sendEachForMulticast({
        tokens,
        notification: { title: "Life Tracker", body },
        webpush: { fcmOptions: { link: "/" } },
      });

      logger.info(`Reminder sent to ${uid}`, { success: response.successCount, failure: response.failureCount });

      if (response.failureCount > 0) {
        await pruneInvalidTokens(db, uid, tokens, response.responses);
      }
    }
  }
);
