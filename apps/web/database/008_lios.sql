-- LIOS V1 domain isolated from clinical tables. Applied transactionally by migration runner.
CREATE SCHEMA IF NOT EXISTS lios;
SET LOCAL search_path TO lios;




CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  publication_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rag_documents (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  rag_type TEXT NOT NULL CHECK (rag_type IN ('avatar','offer','signals')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  source_url TEXT,
  source_name TEXT,
  observed_at TEXT,
  checksum TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rag_lookup ON rag_documents(application_id, rag_type, active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rag_checksum ON rag_documents(application_id, rag_type, checksum);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  current_stage TEXT NOT NULL,
  audit_score REAL,
  revision_count INTEGER NOT NULL DEFAULT 0,
  article_id TEXT,
  error TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_runs_app ON pipeline_runs(application_id, started_at DESC);

CREATE TABLE IF NOT EXISTS pipeline_events (
  id BIGSERIAL PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_run ON pipeline_events(run_id, id);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  hook TEXT NOT NULL,
  image_prompt TEXT NOT NULL,
  image_url TEXT,
  seo_json TEXT NOT NULL,
  sources_json TEXT NOT NULL,
  audit_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  published_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_articles_app ON articles(application_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cache_entries (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  fresh_until TEXT NOT NULL,
  stale_until TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);

ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS topic_hint TEXT NOT NULL DEFAULT '';
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS force_demo_signal BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS lios_one_active_run ON pipeline_runs(application_id) WHERE status IN ('queued','running');
ALTER TABLE articles ADD COLUMN IF NOT EXISTS blog_post_id UUID UNIQUE REFERENCES public.educativo_posts(id) ON DELETE SET NULL;
REVOKE ALL ON SCHEMA lios FROM PUBLIC;
SET LOCAL search_path TO public;
