-- Migration for Phases 2-3: Social connections + AI generation

-- Extend social_accounts table for Ayrshare integration
ALTER TABLE social_accounts 
  ADD COLUMN IF NOT EXISTS ayrshare_profile_id TEXT,
  ADD COLUMN IF NOT EXISTS account_name TEXT,
  ADD COLUMN IF NOT EXISTS account_id TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_post BOOLEAN DEFAULT false;

-- Create post_variants table for AI-generated content
CREATE TABLE IF NOT EXISTS post_variants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  variant_json JSONB NOT NULL, -- {text, format, media_urls, char_limit, hashtags}
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, platform)
);

-- Create posting_queue table for tracking queued posts
CREATE TABLE IF NOT EXISTS posting_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  variant_id UUID REFERENCES post_variants(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('queued', 'processing', 'posted', 'failed')) DEFAULT 'queued' NOT NULL,
  scheduled_time TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE post_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_variants
CREATE POLICY "Users can view own post variants"
  ON post_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_variants.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own post variants"
  ON post_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_variants.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own post variants"
  ON post_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_variants.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own post variants"
  ON post_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_variants.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- RLS Policies for posting_queue
CREATE POLICY "Users can view own queue items"
  ON posting_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = posting_queue.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own queue items"
  ON posting_queue FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = posting_queue.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own queue items"
  ON posting_queue FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = posting_queue.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS post_variants_post_id_idx ON post_variants(post_id);
CREATE INDEX IF NOT EXISTS post_variants_platform_idx ON post_variants(platform);
CREATE INDEX IF NOT EXISTS posting_queue_post_id_idx ON posting_queue(post_id);
CREATE INDEX IF NOT EXISTS posting_queue_status_idx ON posting_queue(status);
CREATE INDEX IF NOT EXISTS posting_queue_scheduled_time_idx ON posting_queue(scheduled_time);
CREATE INDEX IF NOT EXISTS social_accounts_ayrshare_profile_id_idx ON social_accounts(ayrshare_profile_id);
CREATE INDEX IF NOT EXISTS social_accounts_is_active_idx ON social_accounts(is_active);

