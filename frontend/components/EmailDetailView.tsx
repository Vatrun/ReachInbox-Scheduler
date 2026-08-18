"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Star,
  Archive,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { EmailRow } from "@/types";
import { formatTimestamp } from "@/lib/format";

interface EmailDetailViewProps {
  email: EmailRow;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  index: number;
  total: number;
  onBack: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

function SenderAvatar({ name }: { name?: string | null }) {
  const initial = (name || "A").trim().charAt(0).toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green text-sm font-semibold text-white">
      {initial}
    </div>
  );
}

export function EmailDetailView({
  email,
  user,
  index,
  total,
  onBack,
  onPrev,
  onNext,
}: EmailDetailViewProps) {
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

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8">
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex min-w-0 items-start gap-3">
              <SenderAvatar name={email.sender_name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {email.sender_name || "Sender"}
                  {email.sender_email && (
                    <span className="font-normal text-gray-400">
                      {" "}
                      &lt;{email.sender_email}&gt;
                    </span>
                  )}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                  to {email.recipient_email}
                  <ChevronDown size={12} />
                </p>
              </div>
            </div>
            {time && (
              <span className="shrink-0 text-xs text-gray-500">
                {formatTimestamp(time)}
              </span>
            )}
          </div>

          <div className="py-4 text-sm whitespace-pre-wrap text-gray-800">
            {email.body || "No body"}
          </div>
        </div>
      </div>

      {(onPrev || onNext) && (
        <div className="flex justify-center px-8 pb-6">
          <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-1.5 shadow-sm">
            <button
              onClick={onPrev}
              disabled={!onPrev}
              aria-label="Previous email"
              className="text-gray-400 transition hover:text-gray-600 disabled:opacity-40"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="text-sm text-gray-600">
              {index + 1} / {total}
            </span>
            <button
              onClick={onNext}
              disabled={!onNext}
              aria-label="Next email"
              className="text-gray-400 transition hover:text-gray-600 disabled:opacity-40"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
