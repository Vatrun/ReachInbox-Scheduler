import { pool } from "../config/db";

// nodemailer caches the test account unless ETHEREAL_CACHE is off, which would
// return the same account every time. Must be set before nodemailer loads,
// hence the dynamic import below.
process.env.ETHEREAL_CACHE = "false";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedSenders(count: number, reset: boolean) {
  const nodemailer = (await import("nodemailer")).default;

  async function createUniqueAccount(seen: Set<string>) {
    for (let attempt = 1; attempt <= 8; attempt++) {
      const account = await nodemailer.createTestAccount();
      if (!seen.has(account.user)) {
        seen.add(account.user);
        return account;
      }
      const wait = 3000 * attempt;
      console.log(
        `  Ethereal returned a duplicate (${account.user}); retrying in ${wait / 1000}s...`
      );
      await sleep(wait);
    }
    throw new Error(
      "Ethereal kept returning duplicate accounts; try again in a minute"
    );
  }

  if (reset) {
    console.log(
      "Resetting senders, campaigns and emails (users are left untouched)..."
    );
    await pool.query(
      "TRUNCATE senders, campaigns, emails RESTART IDENTITY CASCADE"
    );
  }

  const maxIdResult = await pool.query(
    "SELECT COALESCE(MAX(id), 0)::int AS max_id FROM senders"
  );
  let senderNumber = maxIdResult.rows[0].max_id + 1;

  console.log(`Creating ${count} Ethereal test accounts...`);
  const seen = new Set<string>();

  for (let i = 0; i < count; i++) {
    const testAccount = await createUniqueAccount(seen);
    const name = `Sender ${senderNumber}`;

    const result = await pool.query(
      `INSERT INTO senders (name, email, smtp_host, smtp_port, smtp_user, smtp_pass)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [
        name,
        testAccount.user,
        testAccount.smtp.host,
        testAccount.smtp.port,
        testAccount.user,
        testAccount.pass,
      ]
    );

    if (result.rows.length > 0) {
      console.log(`  ${name} (id ${result.rows[0].id}): ${testAccount.user}`);
      senderNumber++;
    } else {
      console.log(`  ${name}: skipped (${testAccount.user} already exists)`);
    }

    // Small gap to be gentle with the Ethereal API
    await sleep(1500);
  }

  const { rows } = await pool.query(
    "SELECT id, name, email FROM senders ORDER BY id"
  );
  console.log("\nSenders now in DB:");
  for (const row of rows) {
    console.log(`  ${row.id}: ${row.name} <${row.email}>`);
  }

  console.log("Done.");
  process.exit(0);
}

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const countArg = args.find((a) => /^\d+$/.test(a));
const count = Math.max(1, parseInt(countArg || "3", 10));

seedSenders(count, reset).catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
