"use client";

import { useEffect, useState } from "react";
import { Search, Filter, RefreshCw, Clock, Star } from "lucide-react";
import { getScheduledEmails, getSentEmails } from "@/lib/api";
import { EmailRow } from "@/types";

function formatRecipient(email: string) {
  const local = email.split("@")[0];
  return local
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatScheduledTime(value: string) {
  const date = new Date(value);
  const day = date.toLocaleDateString("en-US", { weekday: "short" });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return `${day} ${time}`;
}

export function EmailList({ view }: { view: "scheduled" | "sent" }) {
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data =
        view === "scheduled"
          ? await getScheduledEmails()
          : await getSentEmails();
      setEmails(data);
    } catch {
      setError("Failed to load emails. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [view]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 px-8 py-6">
        <div className="flex flex-1 items-center gap-3 rounded-full bg-input-bg px-5 py-3">
          <Search size={18} className="shrink-0 text-gray-400" />
          <input
            placeholder="Search"
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>
        <button
          type="button"
          className="text-gray-400 transition hover:text-gray-600"
          aria-label="Filter"
        >
          <Filter size={20} />
        </button>
        <button
          type="button"
          onClick={load}
          className="text-gray-400 transition hover:text-gray-600"
          aria-label="Refresh"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-8 py-6 text-sm text-gray-400">Loading...</div>
        )}

        {error && (
          <div className="px-8 py-6 text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && emails.length === 0 && (
          <div className="px-8 py-6 text-sm text-gray-400">
            No {view} emails yet.
          </div>
        )}

        {!loading &&
          !error &&
          emails.map((email) => (
            <div
              key={email.id}
              className="flex items-center gap-5 px-8 py-5 transition hover:bg-gray-50/80"
            >
              <span className="w-40 shrink-0 text-sm font-semibold text-gray-900">
                To: {formatRecipient(email.recipient_email)}
              </span>

              {view === "scheduled" ? (
                <>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-time-badge-bg px-3 py-1 text-xs font-medium whitespace-nowrap text-time-badge-text">
                    <Clock size={12} />
                    {email.scheduled_time &&
                      formatScheduledTime(email.scheduled_time)}
                  </span>
                  <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium whitespace-nowrap text-gray-500">
                    Pending
                  </span>
                </>
              ) : (
                <>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                      email.status === "sent"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {email.status === "sent" ? "Sent" : "Failed"}
                  </span>
                  {email.sent_at && (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium whitespace-nowrap text-gray-500">
                      <Clock size={12} />
                      {formatScheduledTime(email.sent_at)}
                    </span>
                  )}
                </>
              )}

              <p className="min-w-0 flex-1 truncate text-sm">
                <span className="font-semibold text-gray-900">
                  {email.subject}
                </span>
                {email.body && (
                  <span className="font-normal text-gray-400">
                    {" "}
                    - {email.body}
                  </span>
                )}
              </p>

              <Star
                size={18}
                className="shrink-0 text-gray-300"
                strokeWidth={1.5}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
