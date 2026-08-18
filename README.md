# ReachInbox Email Scheduler

A full-stack email scheduler I built for the ReachInbox internship assignment. You paste in (or upload) a list of email addresses, pick a start time, and it sends each one automatically through Ethereal, which is a fake SMTP service. A dashboard shows what's scheduled and what's already gone out.

Backend is Express + TypeScript with BullMQ on top of Redis, and Postgres for storage. The frontend is Next.js with Tailwind, and login works with Google or a plain email/password.

## What's implemented

Backend:
- Scheduler that stores campaigns and queues each email as a delayed BullMQ job (no cron)
- Survives restarts: delayed jobs and records are persisted, and already-sent emails are never re-sent
- Per-sender hourly rate limit backed by Redis counters
- Configurable worker concurrency, plus a global minimum delay between sends
- Multiple senders, each its own Ethereal account, with the hourly limit tracked per sender

Frontend:
- Google login and email/password signup (passwords hashed with bcrypt)
- Dashboard with Scheduled and Sent views and live sidebar counts
- Compose screen with subject, body, CSV upload, send-later time, delay and hourly limit
- Email lists with loading and empty states

## Running it

You'll need Node.js and Docker.

1. Start Redis and Postgres:

```
docker compose up -d
```

2. Backend:

```
cd backend
npm install
cp .env.example .env
npm run migrate
npm run seed:sender
```

Then run these in two separate terminals:

```
npm run dev
npm run worker
```

3. Frontend:

```
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000, log in, and hit Compose.

## How scheduling works

When you schedule a campaign, the API saves one row per recipient in Postgres, then adds each one to BullMQ as a delayed job. The delay on each job is set so the job becomes ready right when that email should send. The worker picks the job up, checks the hourly limit for the sender, sends it through that sender's SMTP credentials, and marks the row as sent.

Restart safety is handled by where things live. Redis runs with AOF enabled, so delayed jobs are still there after a restart, and Postgres holds the actual records. There's also a status check in the worker, so if a crash happens in the middle of a send, that email isn't sent twice.

## Rate limiting and concurrency

The worker runs with some concurrency (5 by default), but two things keep the actual send rate under control.

- **Minimum gap between sends.** The worker has a BullMQ limiter set to one job per `MIN_DELAY_BETWEEN_EMAILS_MS` (2 seconds by default). BullMQ enforces this using a shared Redis key, so it applies even if you run more than one worker.
- **Hourly limit per sender.** Before a send, the worker looks at a Redis set containing timestamps of the sender's sends from the past hour. If it's already at `MAX_EMAILS_PER_HOUR` (100 by default), the job is put back into the delayed queue until an old entry drops out of the window. This doesn't count as a retry and the job is never dropped, so a big batch just slowly drains over the following hours.

Both values are read from `.env`, nothing is hardcoded. If a thousand emails are scheduled for the same time, they're all queued and the limiter plus the hourly cap just stretch them out, so the extras wait for the next window and go out then, roughly in the order they were scheduled.

## Ethereal

`npm run seed:sender` creates a few Ethereal test accounts and stores them in the `senders` table. Every time an email is sent, the worker prints a preview URL, so you can open it and actually read the delivered message. (The script disables Nodemailer's test-account cache, otherwise it keeps returning the same account for all senders.)

## Project layout

```
backend/
  src/config/      env, db pool, redis connection
  src/controllers/ auth, campaigns, emails, senders
  src/db/          schema, migration, sender seeding
  src/queues/      bullmq queue and delayed scheduling
  src/utils/       rate limiter, smtp sender
  src/workers/     the worker that sends emails
  src/index.ts     express server
  src/worker.ts    worker entrypoint
frontend/
  app/             pages and the next-auth route
  components/      sidebar, email lists, compose, login forms
  lib/             next-auth config, api client
  types/           shared types
docker-compose.yml redis + postgres
```

## Environment variables

Backend `.env`: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `MIN_DELAY_BETWEEN_EMAILS_MS`, `MAX_EMAILS_PER_HOUR`, `WORKER_CONCURRENCY`. Check `.env.example` for defaults.

Frontend `.env.local`: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `NEXT_PUBLIC_API_URL`. Google OAuth credentials come from the Google Cloud console.

## API

- `POST /api/campaigns` schedules a batch (subject, body, senderId, startTime, delay, hourlyLimit, recipients)
- `GET /api/senders` lists senders
- `GET /api/emails/scheduled` and `GET /api/emails/sent` feed the dashboard
- `POST /api/auth/register` and `POST /api/auth/login` handle email accounts

## Known trade-offs

Emails are sent as plain text, not HTML. The compose form has per-campaign delay and hourly limit fields; the delay controls how the scheduled times are spaced, but the enforced hourly cap is the per-sender value from `.env`. The backend endpoints themselves aren't auth protected, the dashboard is.
