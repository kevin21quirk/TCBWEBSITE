import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)?.[1].trim();
if (!url) throw new Error("DATABASE_URL missing in .env.local");

const sql = neon(url);

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin','staff')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    message TEXT,
    source TEXT NOT NULL DEFAULT 'website',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','won','lost')),
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS lead_activities (
    id SERIAL PRIMARY KEY,
    lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'note',
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status)`,
  `CREATE INDEX IF NOT EXISTS leads_assigned_idx ON leads(assigned_to)`,
  `CREATE INDEX IF NOT EXISTS lead_activities_lead_idx ON lead_activities(lead_id)`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin_url TEXT`,
  `CREATE TABLE IF NOT EXISTS visitors (
    id SERIAL PRIMARY KEY,
    ip TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    isp TEXT,
    geo_checked BOOLEAN NOT NULL DEFAULT false,
    visit_count INT NOT NULL DEFAULT 0,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    visitor_id INT NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    referrer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS page_views_visitor_idx ON page_views(visitor_id)`,
  `CREATE INDEX IF NOT EXISTS page_views_created_idx ON page_views(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS visitors_last_seen_idx ON visitors(last_seen DESC)`,
  `CREATE TABLE IF NOT EXISTS follow_ups (
    id SERIAL PRIMARY KEY,
    lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false,
    done_at TIMESTAMPTZ,
    auto BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS follow_ups_lead_idx ON follow_ups(lead_id)`,
  `CREATE INDEX IF NOT EXISTS follow_ups_due_idx ON follow_ups(due_at) WHERE done = false`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value NUMERIC(12,2)`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS landing_page TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS ip TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ`,
  `CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(lower(email))`,
  `CREATE INDEX IF NOT EXISTS leads_source_idx ON leads(source)`,
];

for (const s of statements) {
  await sql.query(s);
  console.log("ok:", s.split("\n")[0].trim().slice(0, 60));
}

const hash = bcrypt.hashSync("a15Dz6fl!", 10);
await sql.query(
  `INSERT INTO users (email, name, password_hash, role)
   VALUES ($1, $2, $3, 'super_admin')
   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'super_admin'`,
  ["kevin@aibridgesolutions.co.uk", "Kevin", hash]
);
console.log("seeded super admin: kevin@aibridgesolutions.co.uk");

const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
console.log("tables:", tables.map((t) => t.table_name).join(", "));
