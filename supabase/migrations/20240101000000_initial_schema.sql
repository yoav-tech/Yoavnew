-- =============================================================================
-- LEADERS Ads Hub — Initial Database Schema
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE clients (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT          NOT NULL,
  slug          TEXT          UNIQUE NOT NULL,
  contact_email TEXT,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  is_active     BOOLEAN       DEFAULT TRUE
);

CREATE TABLE ad_accounts (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform            TEXT        NOT NULL CHECK (platform IN ('meta','google','tiktok','linkedin')),
  account_name        TEXT        NOT NULL,
  platform_account_id TEXT        NOT NULL,
  currency            TEXT        DEFAULT 'USD',
  is_active           BOOLEAN     DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_metrics (
  id              BIGSERIAL     PRIMARY KEY,
  ad_account_id   UUID          NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  date            DATE          NOT NULL,
  campaign_id     TEXT          NOT NULL DEFAULT '',
  campaign_name   TEXT,
  adset_id        TEXT          NOT NULL DEFAULT '',
  adset_name      TEXT,
  ad_id           TEXT          NOT NULL DEFAULT '',
  ad_name         TEXT,
  impressions     BIGINT        DEFAULT 0,
  clicks          BIGINT        DEFAULT 0,
  spend           NUMERIC(12,2) DEFAULT 0,
  conversions     INTEGER       DEFAULT 0,
  revenue         NUMERIC(12,2) DEFAULT 0,
  leads           INTEGER       DEFAULT 0,
  video_views     BIGINT        DEFAULT 0,
  reach           BIGINT        DEFAULT 0,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT uq_daily_metrics UNIQUE (ad_account_id, date, campaign_id, adset_id, ad_id)
);

CREATE TABLE user_profiles (
  id           UUID  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT  NOT NULL CHECK (role IN ('admin','client')) DEFAULT 'client',
  client_id    UUID  REFERENCES clients(id) ON DELETE SET NULL,
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sync_log (
  id              BIGSERIAL   PRIMARY KEY,
  sync_type       TEXT        NOT NULL CHECK (sync_type IN ('scheduled','manual')),
  status          TEXT        NOT NULL CHECK (status IN ('started','completed','failed')),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  rows_synced     INTEGER     DEFAULT 0,
  error_message   TEXT
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_daily_metrics_account_date  ON daily_metrics(ad_account_id, date DESC);
CREATE INDEX idx_daily_metrics_campaign_date ON daily_metrics(campaign_id, date DESC);
CREATE INDEX idx_daily_metrics_date          ON daily_metrics(date DESC);
CREATE INDEX idx_ad_accounts_client          ON ad_accounts(client_id);
CREATE INDEX idx_user_profiles_client        ON user_profiles(client_id);

-- =============================================================================
-- MATERIALIZED VIEWS
-- =============================================================================

CREATE MATERIALIZED VIEW mv_account_daily_summary AS
SELECT
  ad_account_id,
  date,
  SUM(impressions)  AS impressions,
  SUM(clicks)       AS clicks,
  SUM(spend)        AS spend,
  SUM(conversions)  AS conversions,
  SUM(revenue)      AS revenue,
  SUM(leads)        AS leads,
  SUM(video_views)  AS video_views,
  SUM(reach)        AS reach
FROM daily_metrics
GROUP BY ad_account_id, date;

CREATE UNIQUE INDEX idx_mv_account_daily_pk   ON mv_account_daily_summary(ad_account_id, date);
CREATE        INDEX idx_mv_account_daily_date ON mv_account_daily_summary(date DESC);

CREATE MATERIALIZED VIEW mv_platform_summary AS
SELECT
  aa.platform,
  aa.client_id,
  dm.date,
  SUM(dm.impressions)  AS impressions,
  SUM(dm.clicks)       AS clicks,
  SUM(dm.spend)        AS spend,
  SUM(dm.conversions)  AS conversions,
  SUM(dm.revenue)      AS revenue,
  SUM(dm.leads)        AS leads,
  SUM(dm.video_views)  AS video_views,
  SUM(dm.reach)        AS reach
FROM daily_metrics dm
JOIN ad_accounts aa ON aa.id = dm.ad_account_id
GROUP BY aa.platform, aa.client_id, dm.date;

CREATE UNIQUE INDEX idx_mv_platform_summary_pk   ON mv_platform_summary(platform, client_id, date);
CREATE        INDEX idx_mv_platform_summary_date ON mv_platform_summary(date DESC);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_accounts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log      ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER avoids repeated subqueries per row)
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_user_client_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT client_id FROM user_profiles WHERE id = auth.uid();
$$;

-- clients
CREATE POLICY "admin: all on clients" ON clients
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY "client: read own client" ON clients
  FOR SELECT TO authenticated
  USING (id = auth_user_client_id());

-- ad_accounts
CREATE POLICY "admin: all on ad_accounts" ON ad_accounts
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY "client: read own ad_accounts" ON ad_accounts
  FOR SELECT TO authenticated
  USING (client_id = auth_user_client_id());

-- daily_metrics
CREATE POLICY "admin: all on daily_metrics" ON daily_metrics
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY "client: read own daily_metrics" ON daily_metrics
  FOR SELECT TO authenticated
  USING (
    ad_account_id IN (
      SELECT id FROM ad_accounts WHERE client_id = auth_user_client_id()
    )
  );

-- user_profiles
CREATE POLICY "users: read own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users: update own display_name" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "admin: all on user_profiles" ON user_profiles
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- service role can insert profiles (called from Edge Function after signup)
CREATE POLICY "service: insert user_profiles" ON user_profiles
  FOR INSERT TO service_role
  WITH CHECK (true);

-- sync_log
CREATE POLICY "admin: all on sync_log" ON sync_log
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- =============================================================================
-- RPC FUNCTIONS
-- =============================================================================

-- KPI summary with prior-period comparison
CREATE OR REPLACE FUNCTION get_kpi_summary(
  p_date_from DATE,
  p_date_to   DATE,
  p_client_id UUID    DEFAULT NULL,
  p_platforms TEXT[]  DEFAULT NULL
)
RETURNS JSON LANGUAGE SQL SECURITY INVOKER STABLE AS $$
  WITH curr AS (
    SELECT
      COALESCE(SUM(dm.spend),0)::NUMERIC       AS spend,
      COALESCE(SUM(dm.revenue),0)::NUMERIC     AS revenue,
      COALESCE(SUM(dm.clicks),0)::BIGINT       AS clicks,
      COALESCE(SUM(dm.impressions),0)::BIGINT  AS impressions,
      COALESCE(SUM(dm.conversions),0)::BIGINT  AS conversions,
      COALESCE(SUM(dm.leads),0)::BIGINT        AS leads
    FROM daily_metrics dm
    JOIN ad_accounts aa ON aa.id = dm.ad_account_id
    WHERE dm.date BETWEEN p_date_from AND p_date_to
      AND (p_client_id IS NULL OR aa.client_id = p_client_id)
      AND (p_platforms IS NULL OR aa.platform = ANY(p_platforms))
  ),
  prior AS (
    SELECT
      COALESCE(SUM(dm.spend),0)::NUMERIC       AS spend,
      COALESCE(SUM(dm.revenue),0)::NUMERIC     AS revenue,
      COALESCE(SUM(dm.clicks),0)::BIGINT       AS clicks,
      COALESCE(SUM(dm.impressions),0)::BIGINT  AS impressions,
      COALESCE(SUM(dm.conversions),0)::BIGINT  AS conversions,
      COALESCE(SUM(dm.leads),0)::BIGINT        AS leads
    FROM daily_metrics dm
    JOIN ad_accounts aa ON aa.id = dm.ad_account_id
    WHERE dm.date BETWEEN
            (p_date_from - (p_date_to - p_date_from + 1)) AND (p_date_from - 1)
      AND (p_client_id IS NULL OR aa.client_id = p_client_id)
      AND (p_platforms IS NULL OR aa.platform = ANY(p_platforms))
  )
  SELECT json_build_object('current', row_to_json(c), 'prior', row_to_json(p))
  FROM curr c, prior p;
$$;

-- Daily spend + revenue trend
CREATE OR REPLACE FUNCTION get_daily_trend(
  p_date_from DATE,
  p_date_to   DATE,
  p_client_id UUID    DEFAULT NULL,
  p_platforms TEXT[]  DEFAULT NULL
)
RETURNS TABLE(date DATE, spend NUMERIC, revenue NUMERIC, clicks BIGINT, conversions BIGINT)
LANGUAGE SQL SECURITY INVOKER STABLE AS $$
  SELECT
    dm.date,
    SUM(dm.spend)::NUMERIC        AS spend,
    SUM(dm.revenue)::NUMERIC      AS revenue,
    SUM(dm.clicks)::BIGINT        AS clicks,
    SUM(dm.conversions)::BIGINT   AS conversions
  FROM daily_metrics dm
  JOIN ad_accounts aa ON aa.id = dm.ad_account_id
  WHERE dm.date BETWEEN p_date_from AND p_date_to
    AND (p_client_id IS NULL OR aa.client_id = p_client_id)
    AND (p_platforms IS NULL OR aa.platform = ANY(p_platforms))
  GROUP BY dm.date
  ORDER BY dm.date ASC;
$$;

-- Per-platform breakdown
CREATE OR REPLACE FUNCTION get_platform_breakdown(
  p_date_from DATE,
  p_date_to   DATE,
  p_client_id UUID DEFAULT NULL
)
RETURNS TABLE(platform TEXT, spend NUMERIC, revenue NUMERIC, clicks BIGINT, impressions BIGINT, conversions BIGINT, leads BIGINT)
LANGUAGE SQL SECURITY INVOKER STABLE AS $$
  SELECT
    aa.platform,
    SUM(dm.spend)::NUMERIC        AS spend,
    SUM(dm.revenue)::NUMERIC      AS revenue,
    SUM(dm.clicks)::BIGINT        AS clicks,
    SUM(dm.impressions)::BIGINT   AS impressions,
    SUM(dm.conversions)::BIGINT   AS conversions,
    SUM(dm.leads)::BIGINT         AS leads
  FROM daily_metrics dm
  JOIN ad_accounts aa ON aa.id = dm.ad_account_id
  WHERE dm.date BETWEEN p_date_from AND p_date_to
    AND (p_client_id IS NULL OR aa.client_id = p_client_id)
  GROUP BY aa.platform
  ORDER BY SUM(dm.spend) DESC;
$$;

-- Top N campaigns
CREATE OR REPLACE FUNCTION get_top_campaigns(
  p_date_from DATE,
  p_date_to   DATE,
  p_client_id UUID    DEFAULT NULL,
  p_platform  TEXT    DEFAULT NULL,
  p_limit     INT     DEFAULT 10
)
RETURNS TABLE(
  campaign_id   TEXT,
  campaign_name TEXT,
  platform      TEXT,
  account_name  TEXT,
  spend         NUMERIC,
  revenue       NUMERIC,
  clicks        BIGINT,
  impressions   BIGINT,
  conversions   BIGINT,
  leads         BIGINT
)
LANGUAGE SQL SECURITY INVOKER STABLE AS $$
  SELECT
    dm.campaign_id,
    MAX(dm.campaign_name)           AS campaign_name,
    aa.platform,
    MAX(aa.account_name)            AS account_name,
    SUM(dm.spend)::NUMERIC          AS spend,
    SUM(dm.revenue)::NUMERIC        AS revenue,
    SUM(dm.clicks)::BIGINT          AS clicks,
    SUM(dm.impressions)::BIGINT     AS impressions,
    SUM(dm.conversions)::BIGINT     AS conversions,
    SUM(dm.leads)::BIGINT           AS leads
  FROM daily_metrics dm
  JOIN ad_accounts aa ON aa.id = dm.ad_account_id
  WHERE dm.date BETWEEN p_date_from AND p_date_to
    AND (p_client_id IS NULL OR aa.client_id = p_client_id)
    AND (p_platform  IS NULL OR aa.platform  = p_platform)
    AND dm.campaign_id != ''
  GROUP BY dm.campaign_id, aa.platform
  ORDER BY SUM(dm.spend) DESC
  LIMIT p_limit;
$$;

-- Campaign hierarchy for drill-down
CREATE OR REPLACE FUNCTION get_campaign_hierarchy(
  p_campaign_id TEXT,
  p_date_from   DATE,
  p_date_to     DATE
)
RETURNS JSON LANGUAGE SQL SECURITY INVOKER STABLE AS $$
  WITH camp AS (
    SELECT
      dm.campaign_id,
      MAX(dm.campaign_name)          AS campaign_name,
      aa.platform,
      MAX(aa.account_name)           AS account_name,
      SUM(dm.spend)::NUMERIC         AS spend,
      SUM(dm.revenue)::NUMERIC       AS revenue,
      SUM(dm.clicks)::BIGINT         AS clicks,
      SUM(dm.impressions)::BIGINT    AS impressions,
      SUM(dm.conversions)::BIGINT    AS conversions,
      SUM(dm.leads)::BIGINT          AS leads
    FROM daily_metrics dm
    JOIN ad_accounts aa ON aa.id = dm.ad_account_id
    WHERE dm.campaign_id = p_campaign_id
      AND dm.date BETWEEN p_date_from AND p_date_to
    GROUP BY dm.campaign_id, aa.platform
  ),
  adsets AS (
    SELECT
      dm.adset_id,
      MAX(dm.adset_name)             AS adset_name,
      SUM(dm.spend)::NUMERIC         AS spend,
      SUM(dm.revenue)::NUMERIC       AS revenue,
      SUM(dm.clicks)::BIGINT         AS clicks,
      SUM(dm.impressions)::BIGINT    AS impressions,
      SUM(dm.conversions)::BIGINT    AS conversions,
      SUM(dm.leads)::BIGINT          AS leads
    FROM daily_metrics dm
    JOIN ad_accounts aa ON aa.id = dm.ad_account_id
    WHERE dm.campaign_id = p_campaign_id
      AND dm.date BETWEEN p_date_from AND p_date_to
      AND dm.adset_id != ''
    GROUP BY dm.adset_id
    ORDER BY SUM(dm.spend) DESC
  ),
  ads AS (
    SELECT
      dm.adset_id,
      dm.ad_id,
      MAX(dm.ad_name)                AS ad_name,
      SUM(dm.spend)::NUMERIC         AS spend,
      SUM(dm.revenue)::NUMERIC       AS revenue,
      SUM(dm.clicks)::BIGINT         AS clicks,
      SUM(dm.impressions)::BIGINT    AS impressions,
      SUM(dm.conversions)::BIGINT    AS conversions,
      SUM(dm.leads)::BIGINT          AS leads
    FROM daily_metrics dm
    JOIN ad_accounts aa ON aa.id = dm.ad_account_id
    WHERE dm.campaign_id = p_campaign_id
      AND dm.date BETWEEN p_date_from AND p_date_to
      AND dm.ad_id != ''
    GROUP BY dm.adset_id, dm.ad_id
    ORDER BY SUM(dm.spend) DESC
  )
  SELECT json_build_object(
    'campaign', (SELECT row_to_json(c) FROM camp c),
    'adsets', (
      SELECT json_agg(
        json_build_object(
          'adset', row_to_json(a),
          'ads',   (SELECT json_agg(row_to_json(ad)) FROM ads ad WHERE ad.adset_id = a.adset_id)
        )
      )
      FROM adsets a
    )
  );
$$;

-- Funnel metrics
CREATE OR REPLACE FUNCTION get_funnel_metrics(
  p_date_from DATE,
  p_date_to   DATE,
  p_client_id UUID    DEFAULT NULL,
  p_platforms TEXT[]  DEFAULT NULL
)
RETURNS JSON LANGUAGE SQL SECURITY INVOKER STABLE AS $$
  SELECT json_build_object(
    'impressions', COALESCE(SUM(dm.impressions),0)::BIGINT,
    'clicks',      COALESCE(SUM(dm.clicks),0)::BIGINT,
    'leads',       COALESCE(SUM(dm.leads),0)::BIGINT,
    'conversions', COALESCE(SUM(dm.conversions),0)::BIGINT
  )
  FROM daily_metrics dm
  JOIN ad_accounts aa ON aa.id = dm.ad_account_id
  WHERE dm.date BETWEEN p_date_from AND p_date_to
    AND (p_client_id IS NULL OR aa.client_id = p_client_id)
    AND (p_platforms IS NULL OR aa.platform = ANY(p_platforms));
$$;

-- Funnel breakdown by platform
CREATE OR REPLACE FUNCTION get_funnel_by_platform(
  p_date_from DATE,
  p_date_to   DATE,
  p_client_id UUID    DEFAULT NULL,
  p_platforms TEXT[]  DEFAULT NULL
)
RETURNS TABLE(platform TEXT, impressions BIGINT, clicks BIGINT, leads BIGINT, conversions BIGINT)
LANGUAGE SQL SECURITY INVOKER STABLE AS $$
  SELECT
    aa.platform,
    SUM(dm.impressions)::BIGINT   AS impressions,
    SUM(dm.clicks)::BIGINT        AS clicks,
    SUM(dm.leads)::BIGINT         AS leads,
    SUM(dm.conversions)::BIGINT   AS conversions
  FROM daily_metrics dm
  JOIN ad_accounts aa ON aa.id = dm.ad_account_id
  WHERE dm.date BETWEEN p_date_from AND p_date_to
    AND (p_client_id IS NULL OR aa.client_id = p_client_id)
    AND (p_platforms IS NULL OR aa.platform = ANY(p_platforms))
  GROUP BY aa.platform
  ORDER BY SUM(dm.impressions) DESC;
$$;

-- Refresh materialized views (called by Edge Functions)
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_account_daily_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_platform_summary;
END;
$$;
