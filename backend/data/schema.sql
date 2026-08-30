-- Production database target schema for SCHOOLS SOLUTIONS HUB PAKISTAN.
-- The current runtime uses the storage adapter; this schema defines the relational target.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','staff','customer','teacher','school','contributor')),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE service_requests (
  id TEXT PRIMARY KEY,
  service TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  requirement TEXT NOT NULL,
  action TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  service_request_id TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service TEXT NOT NULL,
  amount_minor INTEGER,
  currency TEXT DEFAULT 'PKR',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  quote_id TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service TEXT NOT NULL,
  amount_minor INTEGER,
  currency TEXT DEFAULT 'PKR',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient TEXT NOT NULL,
  entity_id TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity_id TEXT,
  type TEXT,
  actor TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL
);
