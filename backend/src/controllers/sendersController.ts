import { Request, Response } from "express";
import { pool } from "../config/db";

export async function getSenders(req: Request, res: Response) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email FROM senders ORDER BY id ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch senders:", err);
    res.status(500).json({ error: "Failed to fetch senders" });
  }
}
