"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { EmailList } from "@/components/EmailList";
import { ComposeView } from "@/components/ComposeView";

export type View = "scheduled" | "sent" | "compose";

interface DashboardShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function DashboardShell({ user }: DashboardShellProps) {
  const [activeView, setActiveView] = useState<View>("scheduled");

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} activeView={activeView} onNavigate={setActiveView} />
      <div className="min-w-0 flex-1 overflow-y-auto border-l border-gray-100">
        {activeView === "compose" ? (
          <ComposeView onBack={() => setActiveView("scheduled")} />
        ) : (
          <EmailList view={activeView} />
        )}
      </div>
    </div>
  );
}
