import { Worker, Job, DelayedError } from "bullmq";
import { redisConnection } from "../config/redis";
import { pool } from "../config/db";
import { env } from "../config/env";
import { EMAIL_QUEUE_NAME } from "../queues/emailQueue";
import { canSendNow, recordSend, msUntilCapacityFrees } from "../utils/rateLimiter";
import { sendEmailViaEthereal } from "../utils/sendEmail";

interface EmailJobData {
  emailId: number;
}

async function processEmailJob(job: Job<EmailJobData>, token?: string) {
  const { emailId } = job.data;

  const { rows } = await pool.query(
    `SELECT e.id, e.recipient_email, e.status, e.campaign_id,
            c.subject, c.body, c.sender_id,
            s.smtp_host, s.smtp_port, s.smtp_user, s.smtp_pass
     FROM emails e
     JOIN campaigns c ON c.id = e.campaign_id
     JOIN senders s ON s.id = c.sender_id
     WHERE e.id = $1`,
    [emailId]
  );

  if (rows.length === 0) {
    console.warn(`Email ${emailId} not found, skipping.`);
    return;
  }

  const email = rows[0];

  // skip if already sent (covers the case where a job was re-processed)
  if (email.status === "sent") {
    console.log(`Email ${emailId} already sent, skipping.`);
    return;
  }

  const allowed = await canSendNow(email.sender_id);
  if (!allowed) {
    const waitMs = await msUntilCapacityFrees(email.sender_id);
    const delayMs = waitMs > 0 ? waitMs : 60000;
    console.log(
      `Rate limit hit for sender ${email.sender_id}. Rescheduling email ${emailId} in ${delayMs}ms.`
    );

    if (!token) {
      throw new Error("Missing worker lock token while rate-limited");
    }

    // move back to delayed without counting an attempt, then let the
    // worker know not to finalize the job
    await job.moveToDelayed(Date.now() + delayMs, token);
    throw new DelayedError();
  }

  try {
    const result = await sendEmailViaEthereal({
      sender: {
        smtp_host: email.smtp_host,
        smtp_port: email.smtp_port,
        smtp_user: email.smtp_user,
        smtp_pass: email.smtp_pass,
      },
      to: email.recipient_email,
      subject: email.subject,
      body: email.body,
    });

    await pool.query(
      `UPDATE emails SET status = 'sent', sent_at = NOW(), error_message = NULL WHERE id = $1`,
      [emailId]
    );

    await recordSend(email.sender_id);

    console.log(`Email ${emailId} sent. Preview: ${result.previewUrl}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await pool.query(
      `UPDATE emails SET status = 'failed', error_message = $2 WHERE id = $1`,
      [emailId, message]
    );
    throw err;
  }
}

export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  processEmailJob,
  {
    connection: redisConnection,
    concurrency: env.workerConcurrency,
    limiter: {
      max: 1,
      duration: env.minDelayBetweenEmailsMs,
    },
  }
);

emailWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed.`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err?.message);
});

console.log(
  `Email worker started with concurrency ${env.workerConcurrency} and a global minimum of ${env.minDelayBetweenEmailsMs}ms between sends`
);
