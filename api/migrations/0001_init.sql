CREATE TABLE companies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  report_token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE counts (
  company TEXT NOT NULL REFERENCES companies(code),
  department TEXT NOT NULL,
  device TEXT NOT NULL,
  day TEXT NOT NULL,
  tool TEXT NOT NULL,
  task TEXT NOT NULL,
  prompts INTEGER NOT NULL DEFAULT 0,
  iban INTEGER NOT NULL DEFAULT 0,
  card INTEGER NOT NULL DEFAULT 0,
  tckn INTEGER NOT NULL DEFAULT 0,
  vkn INTEGER NOT NULL DEFAULT 0,
  phone INTEGER NOT NULL DEFAULT 0,
  email INTEGER NOT NULL DEFAULT 0,
  plate INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (company, device, day, tool, task)
);

CREATE INDEX counts_company_day ON counts (company, day);
