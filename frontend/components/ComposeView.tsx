"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Paperclip,
  Clock,
  Upload,
  ChevronDown,
  Calendar,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  List,
  ListOrdered,
  IndentDecrease,
  IndentIncrease,
  Quote,
  Link2,
  Code2,
} from "lucide-react";
import { createCampaign, getSenders } from "@/lib/api";
import { Sender } from "@/types";

interface ComposeViewProps {
  onBack: () => void;
}

export function ComposeView({ onBack }: ComposeViewProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delaySeconds, setDelaySeconds] = useState("2");
  const [hourlyLimit, setHourlyLimit] = useState("100");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [sendLaterOpen, setSendLaterOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [sendLaterLabel, setSendLaterLabel] = useState<string | null>(null);
  const [toInput, setToInput] = useState("");
  const [senders, setSenders] = useState<Sender[]>([]);
  const [senderId, setSenderId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSenders() {
      try {
        const list = await getSenders();
        if (cancelled) return;
        setSenders(list);
        setSenderId((prev) => prev ?? list[0]?.id ?? null);
      } catch {
        // backend down, leave the dropdown empty
      }
    }

    loadSenders();
    return () => {
      cancelled = true;
    };
  }, []);

  const recipients = parseRecipients(to);
  const visibleRecipients = recipients.slice(0, 1);
  const hiddenRecipientCount = Math.max(0, recipients.length - 1);

  function setRecipients(emails: string[]) {
    setTo(Array.from(new Set(emails)).join("\n"));
  }

  function addRecipient(raw: string) {
    const trimmed = raw.trim().replace(/,$/, "");
    if (!trimmed) return;

    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const found = trimmed.match(emailPattern);

    if (!found?.length) return;

    setRecipients([...recipients, ...found]);
    setToInput("");
  }

  function handleToKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addRecipient(toInput);
    } else if (e.key === "Backspace" && !toInput && recipients.length > 0) {
      setRecipients(recipients.slice(0, -1));
    }
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const found = text.match(emailPattern) || [];
      const unique = Array.from(new Set(found));

      setTo((prev) => {
        const existing = parseRecipients(prev);
        const combined = Array.from(new Set([...existing, ...unique]));
        return combined.join("\n");
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function toLocalDatetime(date: Date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }

  function pickTomorrowTime(hour: number, minute: number, label: string) {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(hour, minute, 0, 0);
    setScheduledFor(toLocalDatetime(date));
    setSendLaterLabel(label);
  }

  function pickTomorrow(label: string) {
    pickTomorrowTime(9, 0, label);
  }

  async function handleSend() {
    setError(null);
    setSuccess(null);

    const recipients = to
      .split(/[\n,]/)
      .map((r) => r.trim())
      .filter(Boolean);

    if (!subject || !body || recipients.length === 0) {
      setError("Subject, body, and at least one recipient are required.");
      return;
    }

    if (senderId === null) {
      setError("No sender available. Seed senders on the backend first.");
      return;
    }

    const startTime = scheduledFor
      ? new Date(scheduledFor).toISOString()
      : new Date().toISOString();

    setSending(true);
    try {
      const result = await createCampaign({
        subject,
        body,
        senderId,
        startTime,
        delayBetweenEmailsMs: (parseInt(delaySeconds, 10) || 2) * 1000,
        hourlyLimit: parseInt(hourlyLimit, 10) || 100,
        recipients,
      });

      setSuccess(`Scheduled ${result.emailsScheduled} email(s).`);
      setTo("");
      setSubject("");
      setBody("");
      setScheduledFor("");
      setSendLaterLabel(null);
      setSendLaterOpen(false);
    } catch {
      setError("Failed to schedule campaign. Is the backend running?");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between px-8 py-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-900"
        >
          <ArrowLeft size={18} />
          Compose New Email
        </button>

        <div className="flex items-center gap-4">
          <Paperclip size={18} className="text-gray-400" />
          <button
            type="button"
            onClick={() => setSendLaterOpen((v) => !v)}
            aria-label="Schedule send"
          >
            <Clock
              size={18}
              className={sendLaterLabel ? "text-brand-green" : "text-gray-400"}
            />
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="rounded-full border border-brand-green px-6 py-1.5 text-sm font-medium text-brand-green transition hover:bg-nav-active-bg disabled:opacity-50"
          >
            {sending ? "Sending..." : sendLaterLabel ? "Send Later" : "Send"}
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
          {success && (
            <p className="mb-4 text-sm text-brand-green">{success}</p>
          )}

          <div className="flex flex-col gap-6">
            <Field label="From">
              <div className="relative w-full max-w-md">
                <select
                  value={senderId ?? ""}
                  onChange={(e) => setSenderId(Number(e.target.value))}
                  className="w-full appearance-none rounded-lg bg-input-bg py-2.5 pr-10 pl-4 text-sm text-gray-700 outline-none"
                >
                  {senders.length === 0 ? (
                    <option value="">No senders available</option>
                  ) : (
                    senders.map((sender) => (
                      <option key={sender.id} value={sender.id}>
                        {sender.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
                />
              </div>
            </Field>

            <Field label="To">
              <div className="flex w-full items-center gap-4 border-b border-gray-200 py-2">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {visibleRecipients.map((email) => (
                    <span
                      key={email}
                      className="rounded-md border border-brand-green bg-nav-active-bg px-2.5 py-1 text-xs font-medium text-brand-green"
                    >
                      {email}
                    </span>
                  ))}
                  {hiddenRecipientCount > 0 && (
                    <span className="rounded-md border border-brand-green bg-nav-active-bg px-2.5 py-1 text-xs font-medium text-brand-green">
                      +{hiddenRecipientCount}
                    </span>
                  )}
                  <input
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    onKeyDown={handleToKeyDown}
                    onBlur={() => addRecipient(toInput)}
                    placeholder={
                      recipients.length === 0 ? "recipient@example.com" : ""
                    }
                    className="min-w-[140px] flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>

                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-green hover:opacity-80">
                  <Upload size={16} strokeWidth={2} />
                  Upload List
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {recipients.length > 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  {recipients.length} email address
                  {recipients.length === 1 ? "" : "es"} detected
                </p>
              )}
            </Field>

            <Field label="Subject">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full border-b border-gray-200 bg-transparent py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </Field>

            <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
              <div className="flex items-center gap-4">
                <span className="w-40 shrink-0 text-sm text-gray-500">
                  Delay between 2 emails
                </span>
                <input
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(e.target.value)}
                  type="number"
                  className="w-16 rounded-lg bg-input-bg px-3 py-2 text-center text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="shrink-0 text-sm text-gray-500">
                  Hourly Limit
                </span>
                <input
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(e.target.value)}
                  type="number"
                  className="w-16 rounded-lg bg-input-bg px-3 py-2 text-center text-sm outline-none"
                />
              </div>
            </div>

            <div className="mt-2 overflow-hidden rounded-xl bg-input-bg">
              <EditorToolbar />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type Your Reply..."
                rows={14}
                className="min-h-[320px] w-full resize-none bg-transparent p-5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {sendLaterOpen && (
          <div className="absolute top-0 right-8 z-10 w-80 rounded-xl border border-gray-100 bg-white p-6 shadow-lg">
            <p className="mb-4 text-base font-semibold text-gray-900">
              Send Later
            </p>

            <div className="relative mb-4">
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => {
                  setScheduledFor(e.target.value);
                  setSendLaterLabel("Custom");
                }}
                placeholder="Pick date & time"
                className="w-full rounded-lg border border-gray-200 py-2.5 pr-10 pl-3 text-sm text-gray-600 outline-none"
              />
              <Calendar
                size={16}
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
              />
            </div>

            <div className="mb-6 flex flex-col">
              <QuickOption
                label="Tomorrow"
                onClick={() => pickTomorrow("Tomorrow")}
              />
              <QuickOption
                label="Tomorrow, 10:00 AM"
                onClick={() => pickTomorrowTime(10, 0, "Tomorrow, 10:00 AM")}
              />
              <QuickOption
                label="Tomorrow, 11:00 AM"
                onClick={() => pickTomorrowTime(11, 0, "Tomorrow, 11:00 AM")}
              />
              <QuickOption
                label="Tomorrow, 3:00 PM"
                onClick={() => pickTomorrowTime(15, 0, "Tomorrow, 3:00 PM")}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setScheduledFor("");
                  setSendLaterLabel(null);
                  setSendLaterOpen(false);
                }}
                className="px-3 py-1.5 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setSendLaterOpen(false)}
                className="rounded-full border border-brand-green px-5 py-1.5 text-sm font-medium text-brand-green transition hover:bg-nav-active-bg"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function parseRecipients(value: string) {
  return value
    .split(/[\n,]/)
    .map((r) => r.trim())
    .filter(Boolean);
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-6">
      <label className="w-40 shrink-0 pt-2 text-sm text-gray-500">
        {label}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function EditorToolbar() {
  const tools = [
    Undo2,
    Redo2,
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    List,
    ListOrdered,
    IndentDecrease,
    IndentIncrease,
    Quote,
    Link2,
    Code2,
  ];

  return (
    <div className="flex items-center gap-1 border-b border-gray-200/80 px-4 py-2.5">
      {tools.map((Icon, index) => (
        <button
          key={index}
          type="button"
          className="rounded p-1.5 text-gray-400 transition hover:bg-white hover:text-gray-600"
          aria-hidden
          tabIndex={-1}
        >
          <Icon size={15} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}

function QuickOption({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="py-2.5 text-left text-sm text-gray-600 transition hover:text-gray-900"
    >
      {label}
    </button>
  );
}
