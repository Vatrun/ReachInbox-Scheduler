import { Request, Response } from "express";
import { pool } from "../config/db";
import { env } from "../config/env";
import { scheduleEmailJob } from "../queues/scheduleEmail";
import { CreateCampaignBody } from "../types";

export async function createCampaign(req: Request, res: Response) {
  const {
    subject,
    body,
    senderId,
    startTime,
    delayBetweenEmailsMs,
    hourlyLimit,
    recipients,
  } = req.body as CreateCampaignBody;

  if (!subject || !body || !senderId || !startTime || !recipients?.length) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const delayBetweenEmailsMsResolved =
    delayBetweenEmailsMs ?? env.minDelayBetweenEmailsMs;
  const hourlyLimitResolved = hourlyLimit ?? env.maxEmailsPerHour;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const campaignResult = await client.query(
      `INSERT INTO campaigns (subject, body, sender_id, start_time, delay_between_emails_ms, hourly_limit)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        subject,
        body,
        senderId,
        startTime,
        delayBetweenEmailsMsResolved,
        hourlyLimitResolved,
      ]
    );

    const campaignId = campaignResult.rows[0].id;
    const baseTime = new Date(startTime).getTime();
    const insertedEmails: { id: number; scheduledTime: Date }[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const scheduledTime = new Date(baseTime + i * delayBetweenEmailsMsResolved);

      const emailResult = await client.query(
        `INSERT INTO emails (campaign_id, recipient_email, scheduled_time)
         VALUES ($1, $2, $3)
         ON CONFLICT (campaign_id, recipient_email) DO NOTHING
         RETURNING id`,
        [campaignId, recipients[i], scheduledTime]
      );

      if (emailResult.rows.length > 0) {
        insertedEmails.push({ id: emailResult.rows[0].id, scheduledTime });
      }
    }

    await client.query("COMMIT");

    for (const email of insertedEmails) {
      const jobId = await scheduleEmailJob({
        emailId: email.id,
        scheduledTime: email.scheduledTime,
      });

      await pool.query(`UPDATE emails SET bullmq_job_id = $1 WHERE id = $2`, [
        jobId,
        email.id,
      ]);
    }

    res.status(201).json({
      campaignId,
      emailsScheduled: insertedEmails.length,
      duplicatesSkipped: recipients.length - insertedEmails.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to create campaign:", err);
    res.status(500).json({ error: "Failed to create campaign" });
  } finally {
    client.release();
  }
}