-- Users: accounts created via email/password signup
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Senders: Ethereal SMTP accounts we send from
CREATE TABLE IF NOT EXISTS senders (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_user TEXT NOT NULL,
  smtp_pass TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns: one compose submit = one campaign
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sender_id INTEGER NOT NULL REFERENCES senders(id),
  start_time TIMESTAMPTZ NOT NULL,
  delay_between_emails_ms INTEGER NOT NULL,
  hourly_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Emails: one row per lead per campaign
CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  bullmq_job_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- no duplicate recipient inside the same campaign
  CONSTRAINT unique_recipient_per_campaign UNIQUE (campaign_id, recipient_email)
);

-- indexes for the dashboard and worker queries
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_campaign_id ON emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_emails_scheduled_time ON emails(scheduled_time);