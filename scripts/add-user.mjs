// Add or update an admin/CRM user.
// usage: node scripts/add-user.mjs <email> <name> <password> [role]
// role defaults to staff; use "super_admin" for full access.
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const [email, name, password, role = "staff"] = process.argv.slice(2);
if (!email || !name || !password) {
  console.error("usage: node scripts/add-user.mjs <email> <name> <password> [role]");
  process.exit(1);
}
if (!["staff", "super_admin"].includes(role)) {
  console.error("role must be staff or super_admin");
  process.exit(1);
}

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)?.[1].trim();
if (!url) throw new Error("DATABASE_URL missing in .env.local");

const sql = neon(url);
const hash = bcrypt.hashSync(password, 10);
await sql.query(
  `INSERT INTO users (email, name, password_hash, role)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT (email) DO UPDATE
     SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
  [email.toLowerCase(), name, hash, role]
);
console.log(`ok: ${email} (${role})`);
