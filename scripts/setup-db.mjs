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
    lead_id INT REFERENCES leads(id) ON DELETE SET NULL,
    path TEXT NOT NULL,
    referrer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS page_views_visitor_idx ON page_views(visitor_id)`,
  `CREATE INDEX IF NOT EXISTS page_views_lead_idx ON page_views(lead_id)`,
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
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin_step INT NOT NULL DEFAULT 0`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ`,
  `CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(lower(email))`,
  `CREATE INDEX IF NOT EXISTS leads_source_idx ON leads(source)`,
  `CREATE TABLE IF NOT EXISTS attachment_uploads (
    id BIGSERIAL PRIMARY KEY,
    upload_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    chunk_index INT NOT NULL,
    data_hex TEXT NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (upload_id, chunk_index)
  )`,
  `CREATE INDEX IF NOT EXISTS attachment_uploads_upload_idx ON attachment_uploads(upload_id)`,
  `CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    template TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    total INT NOT NULL DEFAULT 0,
    sent INT NOT NULL DEFAULT 0,
    failed INT NOT NULL DEFAULT 0,
    skipped INT NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS email_sends (
    id BIGSERIAL PRIMARY KEY,
    resend_id TEXT,
    lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    campaign_id INT REFERENCES campaigns(id) ON DELETE SET NULL,
    subject TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    open_count INT NOT NULL DEFAULT 0,
    opened_at TIMESTAMPTZ,
    click_count INT NOT NULL DEFAULT 0,
    clicked_at TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS email_sends_resend_idx ON email_sends(resend_id)`,
  `CREATE INDEX IF NOT EXISTS email_sends_lead_idx ON email_sends(lead_id)`,
  `CREATE TABLE IF NOT EXISTS sequence_enrolments (
    id SERIAL PRIMARY KEY,
    lead_id INT NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
    step INT NOT NULL DEFAULT 0,
    next_send_at TIMESTAMPTZ NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS seq_enrol_due_idx ON sequence_enrolments(next_send_at) WHERE active = true`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT,
    entity_id INT,
    detail TEXT,
    ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS audit_log_user_idx ON audit_log(user_id)`,
  `CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log(action)`,
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
