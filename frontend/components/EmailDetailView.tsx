"use client";

import { useState } from "react";
import { ArrowLeft, Star, Archive, Trash2 } from "lucide-react";
import { EmailRow } from "@/types";
import { formatDateTime } from "@/lib/format";

interface EmailDetailViewProps {
  email: EmailRow;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onBack: () => void;
}

function SenderAvatar({ name }: { name?: string | null }) {
  const initial = (name || "S").trim().charAt(0).toUpperCase();
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nav-active-bg text-sm font-semibold text-brand-green">
      {initial}
    </div>
  );
}

export function EmailDetailView({ email, user, onBack }: EmailDetailViewProps) {
  const [starred, setStarred] = useState(false);
  const time = email.status === "sent" ? email.sent_at : email.scheduled_time;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4 px-8 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="truncate text-lg font-semibold text-gray-900">
            {email.subject}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <button
            onClick={() => setStarred((s) => !s)}
            aria-label="Star"
            className={
              starred
                ? "text-yellow-400"
                : "text-gray-400 transition hover:text-gray-600"
            }
          >
            <Star size={20} fill={starred ? "currentColor" : "none"} />
          </button>
          <button
            aria-label="Archive"
            className="text-gray-400 transition hover:text-gray-600"
          >
            <Archive size={20} />
          </button>
          <button
            aria-label="Trash"
            className="text-gray-400 transition hover:text-gray-600"
          >
            <Trash2 size={20} />
          </button>
          <span className="h-5 w-px bg-gray-200" />
          {user.image ? (
            <img src={user.image} alt="" className="h-8 w-8 rounded-full" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-300" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-8 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <SenderAvatar name={email.sender_name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {email.sender_name || "Sender"}
            </p>
            <p className="truncate text-xs text-gray-500">
              to {email.recipient_email}
            </p>
          </div>
        </div>
        {time && (
          <span className="shrink-0 text-xs text-gray-500">
            {formatDateTime(time)}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-10">
        <div className="rounded-xl bg-input-bg p-5 text-sm whitespace-pre-wrap text-gray-800">
          {email.body || "No body"}
        </div>
      </div>
    </div>
  );
}
