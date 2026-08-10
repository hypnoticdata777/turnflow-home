"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  REMINDER_INTERVAL_PRESETS,
  buildRemindersICS,
  reminderStatus,
  reminderStatusBadgeClasses,
} from "@/lib/utils";
import {
  createReminderAction,
  deleteReminderAction,
  markReminderDoneAction,
} from "@/lib/actions/reminders";

const STATUS_TEXT: Record<string, string> = {
  overdue: "Overdue",
  upcoming: "Due soon",
  ok: "Scheduled",
};

export type ReminderData = {
  id: string;
  propertyId: string;
  title: string;
  intervalDays: number;
  nextDueAt: string | Date;
  notes: string | null;
};

export function ReminderManager({
  properties,
  reminders: initialReminders,
}: {
  properties: { id: string; label: string }[];
  reminders: ReminderData[];
}) {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState(properties[0]?.id || "");
  const [title, setTitle] = useState("");
  const [intervalDays, setIntervalDays] = useState<number>(
    REMINDER_INTERVAL_PRESETS[0].days
  );
  const [notes, setNotes] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const propertyLabel = (id: string) =>
    properties.find((p) => p.id === id)?.label || "(unknown property)";

  const reminders = [...initialReminders].sort(
    (a, b) => new Date(a.nextDueAt).getTime() - new Date(b.nextDueAt).getTime()
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!propertyId || !title.trim()) {
      setFormStatus("Property and title are required.");
      return;
    }

    setSubmitting(true);
    setFormStatus("Saving...");
    try {
      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("intervalDays", String(intervalDays));
      formData.set("notes", notes.trim());

      const result = await createReminderAction(propertyId, formData);
      if ("error" in result) {
        setFormStatus(result.error);
        return;
      }

      setTitle("");
      setIntervalDays(REMINDER_INTERVAL_PRESETS[0].days);
      setNotes("");
      setFormStatus("Reminder added.");
      router.refresh();
    } catch (err) {
      console.error("Error creating reminder:", err);
      setFormStatus("Failed to add reminder. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDone(r: ReminderData) {
    setActingId(r.id);
    try {
      await markReminderDoneAction(r.propertyId, r.id);
      router.refresh();
    } catch (err) {
      console.error("Error marking reminder done:", err);
      alert("Failed to update reminder. Please try again.");
    } finally {
      setActingId(null);
    }
  }

  async function handleDelete(r: ReminderData) {
    if (!confirm("Delete this reminder? This cannot be undone.")) return;
    setActingId(r.id);
    try {
      await deleteReminderAction(r.propertyId, r.id);
      router.refresh();
    } catch (err) {
      console.error("Error deleting reminder:", err);
      alert("Failed to update reminder. Please try again.");
    } finally {
      setActingId(null);
    }
  }

  function handleDownloadIcs() {
    const icsReminders = reminders
      .filter((r) => r.nextDueAt)
      .map((r) => ({
        id: r.id,
        title: `${r.title} (${propertyLabel(r.propertyId)})`,
        nextDueAt: new Date(r.nextDueAt),
        notes: r.notes,
      }));
    const ics = buildRemindersICS(icsReminders);
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "turnflow-home-maintenance.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Recurring reminders</h2>
        <button
          onClick={handleDownloadIcs}
          className="rounded bg-gray-700 px-4 py-2 text-sm text-white"
        >
          Download calendar (.ics)
        </button>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Schedule HVAC filters, gutter cleaning, water heater flushes, and any
        other routine that should not depend on memory.
      </p>

      <div className="mb-6 rounded-xl bg-white p-4 shadow">
        <h2 className="mb-4 text-xl font-semibold">Add a reminder</h2>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-5 md:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium">Property</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded border bg-white p-2 text-sm"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Replace HVAC filter"
              className="w-full rounded border p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Repeats</label>
            <select
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              className="w-full rounded border bg-white p-2 text-sm"
            >
              {REMINDER_INTERVAL_PRESETS.map((p) => (
                <option key={p.days} value={p.days}>
                  {p.label} (every {p.days} days)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded border p-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Add reminder"}
          </button>
        </form>
        {formStatus && <p className="mt-2 text-sm text-gray-600">{formStatus}</p>}
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-4 text-xl font-semibold">Upcoming and overdue</h2>
        {reminders.length === 0 ? (
          <p className="text-gray-500">No reminders yet. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => {
              const dueMillis = new Date(r.nextDueAt).getTime();
              const status = reminderStatus(dueMillis);
              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p>
                      <strong>{r.title}</strong>{" "}
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${reminderStatusBadgeClasses(
                          status
                        )}`}
                      >
                        {STATUS_TEXT[status]}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {propertyLabel(r.propertyId)} - due{" "}
                      {new Date(r.nextDueAt).toLocaleDateString()} - every{" "}
                      {r.intervalDays} days
                    </p>
                    {r.notes && <p className="text-sm text-gray-500">{r.notes}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleDone(r)}
                      disabled={actingId === r.id}
                      className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                    >
                      Mark done
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      disabled={actingId === r.id}
                      className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
