"use client";

import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { View } from "@/components/DashboardShell";
import { getScheduledEmails, getSentEmails } from "@/lib/api";
import { Clock, Send, ChevronDown } from "lucide-react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  activeView: View;
  onNavigate: (view: View) => void;
}

export function Sidebar({ user, activeView, onNavigate }: SidebarProps) {
  const [scheduledCount, setScheduledCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    async function loadCounts() {
      try {
        const [scheduled, sent] = await Promise.all([
          getScheduledEmails(),
          getSentEmails(),
        ]);
        setScheduledCount(scheduled.length);
        setSentCount(sent.length);
      } catch {
        // Keep counts at 0 if backend is unavailable
      }
    }

    loadCounts();
  }, [activeView]);

  return (
    <aside className="flex w-[280px] shrink-0 flex-col px-6 py-8">
      <div className="mb-8 px-1 text-2xl font-black tracking-tight">ONB</div>

      <div className="mb-5 flex items-center gap-3 rounded-xl bg-input-bg px-3 py-2.5">
        {user.image ? (
          <img src={user.image} alt="" className="h-10 w-10 rounded-full" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-300" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {user.name ?? "User"}
          </p>
          <p className="truncate text-xs text-gray-500">{user.email}</p>
        </div>
        <ChevronDown size={16} className="shrink-0 text-gray-400" />
      </div>

      <button
        onClick={() => onNavigate("compose")}
        className="mb-8 rounded-full border border-brand-green py-2.5 text-sm font-medium text-brand-green transition hover:bg-nav-active-bg"
      >
        Compose
      </button>

      <p className="mb-3 px-3 text-[11px] font-medium tracking-wide text-gray-400">
        CORE
      </p>

      <nav className="flex flex-col gap-1">
        <NavItem
          label="Scheduled"
          count={scheduledCount}
          icon={<Clock size={16} />}
          active={activeView === "scheduled"}
          onClick={() => onNavigate("scheduled")}
        />
        <NavItem
          label="Sent"
          count={sentCount}
          icon={<Send size={16} />}
          active={activeView === "sent"}
          onClick={() => onNavigate("sent")}
        />
      </nav>

      <div className="mt-auto pt-6">
        <LogoutButton />
      </div>
    </aside>
  );
}

function NavItem({
  label,
  count,
  icon,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? "bg-nav-active-bg font-medium text-gray-900"
          : "font-normal text-gray-500 hover:bg-gray-50"
      }`}
    >
      <span className="flex items-center gap-2.5">
        {icon}
        {label}
      </span>
      <span className={`text-xs ${active ? "text-gray-600" : "text-gray-400"}`}>
        {count}
      </span>
    </button>
  );
}
