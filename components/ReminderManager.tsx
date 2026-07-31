"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  REMINDER_INTERVAL_PRESETS,
  reminderStatus,
  reminderStatusBadgeClasses,
  buildRemindersICS,
} from "@/lib/utils";
import {
  createReminderAction,
  markReminderDoneAction,
  deleteReminderAction,
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
  const [intervalDays, setIntervalDays] = useState<number>(REMINDER_INTERVAL_PRESETS[0].days);
  const [notes, setNotes] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const propertyLabel = (id: string) => properties.find((p) => p.id === id)?.label || "(unknown property)";

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
    setFormStatus("Saving…");
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
      setFormStatus("Reminder added ✓");
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📅 Maintenance Calendar</h1>
        <button onClick={handleDownloadIcs} className="bg-gray-700 text-white px-4 py-2 rounded text-sm">
          ⬇ Download Calendar (.ics)
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Recurring maintenance across all your properties — HVAC filters,
        gutter cleaning, water heater flushes, and anything else on a
        schedule.
      </p>

      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Add a Reminder</h2>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Property</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full p-2 border rounded bg-white text-sm"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Replace HVAC filter"
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Repeats</label>
            <select
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              className="w-full p-2 border rounded bg-white text-sm"
            >
              {REMINDER_INTERVAL_PRESETS.map((p) => (
                <option key={p.days} value={p.days}>
                  {p.label} (every {p.days} days)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border rounded text-sm" />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Add Reminder"}
          </button>
        </form>
        {formStatus && <p className="text-sm text-gray-600 mt-2">{formStatus}</p>}
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Upcoming &amp; Overdue</h2>
        {reminders.length === 0 ? (
          <p className="text-gray-500">No reminders yet. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => {
              const dueMillis = new Date(r.nextDueAt).getTime();
              const status = reminderStatus(dueMillis);
              return (
                <div key={r.id} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <p>
                      <strong>{r.title}</strong>{" "}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${reminderStatusBadgeClasses(status)}`}>
                        {STATUS_TEXT[status]}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {propertyLabel(r.propertyId)} · due {new Date(r.nextDueAt).toLocaleDateString()} · every {r.intervalDays} days
                    </p>
                    {r.notes && <p className="text-sm text-gray-500">{r.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDone(r)}
                      disabled={actingId === r.id}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      Mark Done
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      disabled={actingId === r.id}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
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
