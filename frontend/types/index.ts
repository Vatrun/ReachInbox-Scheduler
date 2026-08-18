export interface Sender {
  id: number;
  name: string;
  email: string;
}

export interface EmailRow {
  id: number;
  recipient_email: string;
  subject: string;
  body?: string;
  status: "pending" | "sent" | "failed";
  scheduled_time?: string;
  sent_at?: string | null;
}

  export interface CreateCampaignBody {
    subject: string;
    body: string;
    senderId: number;
    startTime: string;
    delayBetweenEmailsMs: number;
    hourlyLimit: number;
    recipients: string[];
  }