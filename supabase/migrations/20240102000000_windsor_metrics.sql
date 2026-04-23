-- Flat table for Windsor.ai → PostgreSQL sync
-- Columns match Windsor.ai field names directly (no FK lookups needed)

CREATE TABLE IF NOT EXISTS windsor_metrics (
  id           BIGSERIAL    PRIMARY KEY,
  date         DATE         NOT NULL,
  datasource   TEXT         NOT NULL,  -- e.g. 'google_ads', 'facebook_ads'
  account_name TEXT         NOT NULL,
  source       TEXT,                   -- campaign source label from Windsor
  campaign     TEXT,
  clicks       BIGINT       DEFAULT 0,
  spend        NUMERIC(12,2) DEFAULT 0,
  impressions  BIGINT       DEFAULT 0,
  conversions  NUMERIC      DEFAULT 0,
  revenue      NUMERIC(12,2) DEFAULT 0,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT uq_windsor_metrics UNIQUE (date, datasource, account_name, campaign)
);

-- Index for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_windsor_metrics_date ON windsor_metrics (date DESC);
CREATE INDEX IF NOT EXISTS idx_windsor_metrics_datasource ON windsor_metrics (datasource);

-- Allow the dashboard (anon/authenticated) to read
ALTER TABLE windsor_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read windsor_metrics"
  ON windsor_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert windsor_metrics"
  ON windsor_metrics FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update windsor_metrics"
  ON windsor_metrics FOR UPDATE
  TO service_role
  USING (true);
