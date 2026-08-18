import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/db";

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  const trimmedEmail = email?.trim().toLowerCase();
  const trimmedName = name?.trim();

  if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  if (!password || password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      trimmedEmail,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [trimmedName || trimmedEmail.split("@")[0], trimmedEmail, passwordHash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Registration failed:", err);
    res.status(500).json({ error: "Failed to register" });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  const trimmedEmail = email?.trim().toLowerCase();

  if (!trimmedEmail || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [trimmedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
    });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ error: "Failed to login" });
  }
}
