export interface CreateCampaignBody {
    subject: string;
    body: string;
    senderId: number;
    startTime: string;
    delayBetweenEmailsMs: number;
    hourlyLimit: number;
    recipients: string[];
  }
  
  export interface EmailRow {
    id: number;
    campaign_id: number;
    recipient_email: string;
    scheduled_time: string;
    status: "pending" | "sent" | "failed";
    sent_at: string | null;
    error_message: string | null;
    subject?: string;
  }