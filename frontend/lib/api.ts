const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getScheduledEmails() {
  const res = await fetch(`${API_URL}/api/emails/scheduled`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch scheduled emails");
  return res.json();
}

export async function getSentEmails() {
  const res = await fetch(`${API_URL}/api/emails/sent`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch sent emails");
  return res.json();
}

export async function registerUser(payload: {
  name?: string;
  email: string;
  password: string;
}) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Failed to register");
  }
  return data;
}

import { CreateCampaignBody, Sender } from "@/types";

export async function getSenders() {
  const res = await fetch(`${API_URL}/api/senders`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch senders");
  return res.json() as Promise<Sender[]>;
}

export async function createCampaign(payload: CreateCampaignBody) {
  const res = await fetch(`${API_URL}/api/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create campaign");
  return res.json();
}