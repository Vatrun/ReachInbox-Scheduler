import { Request, Response } from "express";
import { pool } from "../config/db";

export async function getScheduledEmails(req: Request, res: Response) {
  const { rows } = await pool.query(
    `SELECT e.id, e.recipient_email, e.scheduled_time, e.status, c.subject, c.body
     FROM emails e
     JOIN campaigns c ON c.id = e.campaign_id
     WHERE e.status = 'pending'
     ORDER BY e.scheduled_time ASC`
  );
  res.json(rows);
}

export async function getSentEmails(req: Request, res: Response) {
  const { rows } = await pool.query(
    `SELECT e.id, e.recipient_email, e.sent_at, e.status, c.subject, c.body
     FROM emails e
     JOIN campaigns c ON c.id = e.campaign_id
     WHERE e.status IN ('sent', 'failed')
     ORDER BY e.sent_at DESC NULLS LAST`
  );
  res.json(rows);
}