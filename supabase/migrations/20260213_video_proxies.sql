-- Video proxy tracking table
-- Stores Cloudflare Stream upload status and proxy URLs
-- for CDN-optimized video preview in the Remotion Player.

CREATE TABLE IF NOT EXISTS video_proxies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_url TEXT NOT NULL UNIQUE,
  stream_uid TEXT,                -- Cloudflare Stream video UID
  proxy_url TEXT,                 -- Direct MP4 download URL when ready
  hls_url TEXT,                   -- HLS manifest URL (for future adaptive streaming)
  thumbnail_url TEXT,             -- Thumbnail image URL
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'uploading', 'processing', 'ready', 'error')),
  error_message TEXT,
  duration_seconds REAL,          -- Video duration reported by CF Stream
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by original URL
CREATE INDEX IF NOT EXISTS idx_video_proxies_original_url ON video_proxies (original_url);

-- Index for finding pending/processing proxies
CREATE INDEX IF NOT EXISTS idx_video_proxies_status ON video_proxies (status)
  WHERE status IN ('pending', 'uploading', 'processing');
