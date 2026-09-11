import { formatDate } from "./format";
import type { Task } from "@/types/waktu";

function escapeCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Builds the CSV the ops tracker exports. The BOM makes Excel on Windows read
 * it as UTF-8 instead of mangling the accented names.
 */
export function tasksToCsv(
  tasks: Task[],
  strikes: Record<string, number>,
  label: (key: string) => string
) {
  const header = [
    label("time.taskTitle"),
    label("finance.note"),
    label("ops.category"),
    label("ops.owner"),
    label("ops.unit"),
    label("time.status"),
    label("time.dueDate"),
    label("ops.startTime"),
    label("ops.strike"),
    label("ops.link"),
    label("ops.createdAt"),
    label("ops.completedAt"),
    label("ops.source"),
  ];

  const rows = tasks.map((task) => [
    task.title,
    task.note,
    label(`category.task.${task.category}`),
    task.owner,
    task.unit,
    label(`status.${task.status}`),
    task.dueDate,
    task.startTime,
    task.category === "delegation" && task.owner ? (strikes[task.owner] ?? 0) : "",
    task.link,
    formatDate(new Date(task.createdAt).toISOString().slice(0, 10)),
    task.completedAt ? formatDate(new Date(task.completedAt).toISOString().slice(0, 10)) : "",
    label(`ops.source.${task.source}`),
  ]);

  return [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
}

/** Hands the file to the browser. No-op outside the browser. */
export function downloadCsv(filename: string, csv: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
