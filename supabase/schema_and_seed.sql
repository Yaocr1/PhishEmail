-- PhishBERT Supabase Schema + Seed
-- Run this entire file in Supabase SQL Editor (Browser)

create extension if not exists "pgcrypto";

-- Keep updated_at columns in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.phish_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  role text not null default 'USER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.phish_email_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.phish_users(id) on delete set null,
  source_email_id text unique,
  provider text not null default 'GMAIL',
  subject text not null,
  sender text not null,
  snippet text not null,
  body text,
  is_phishing boolean not null,
  confidence double precision not null,
  phishing_prob double precision not null default 0,
  label text not null default 'legitimate',
  request_id text,
  timestamp timestamptz not null default now()
);

create index if not exists idx_phish_email_scans_timestamp on public.phish_email_scans(timestamp desc);
create index if not exists idx_phish_email_scans_is_phishing on public.phish_email_scans(is_phishing);

create table if not exists public.phish_system_settings (
  id text primary key default '1',
  phishing_threshold double precision not null default 0.6,
  auto_block_enabled boolean not null default false,
  gmail_connected boolean not null default false,
  gmail_email text,
  gmail_access_token text,
  gmail_refresh_token text,
  gmail_expiry_date timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.phish_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.phish_users(id) on delete set null,
  action text not null,
  details text,
  timestamp timestamptz not null default now()
);

-- Triggers

drop trigger if exists trg_phish_users_set_updated_at on public.phish_users;
create trigger trg_phish_users_set_updated_at
before update on public.phish_users
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_phish_system_settings_set_updated_at on public.phish_system_settings;
create trigger trg_phish_system_settings_set_updated_at
before update on public.phish_system_settings
for each row execute procedure public.set_updated_at();

-- Seed default system row
insert into public.phish_system_settings (id)
values ('1')
on conflict (id) do nothing;

-- Seed sample user (email/password for demo only; change in production)
insert into public.phish_users (email, password_hash, role)
values (
  'admin@phishbert.local',
  '$2a$10$P7x2Q1QjV2q0O.i1S1xYCOhoDE13L6l5dI5YfR8uAKOtM6kM3M6aW',
  'ADMIN'
)
on conflict (email) do nothing;

-- Seed sample scan rows
insert into public.phish_email_scans (provider, subject, sender, snippet, is_phishing, confidence, phishing_prob, label)
values
  ('SIMULATION', 'Weekly Team Update', 'team@company.com', 'Please find the weekly report attached.', false, 0.93, 0.07, 'legitimate'),
  ('SIMULATION', 'URGENT: Verify your account', 'security@alerts-login.com', 'Click here to verify your account immediately.', true, 0.96, 0.96, 'phishing')
on conflict do nothing;

-- Seed one audit log
insert into public.phish_audit_logs (action, details)
values ('SYSTEM_BOOTSTRAP', 'Supabase schema initialized from schema_and_seed.sql')
on conflict do nothing;
