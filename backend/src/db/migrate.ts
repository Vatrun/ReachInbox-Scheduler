import fs from "fs";
import path from "path";
import { pool } from "../config/db";

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  console.log("Running schema migration...");
  await pool.query(schema);
  console.log("Migration complete.");

  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});