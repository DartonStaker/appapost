-- Migration for Phases 2-3: Social connections + AI generation

-- Create brand_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS brand_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_voice TEXT,
  default_hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on brand_settings
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_settings
CREATE POLICY "Users can view own brand settings"
  ON brand_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own brand settings"
  ON brand_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand settings"
  ON brand_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand settings"
  ON brand_settings FOR DELETE
  USING (auth.uid() = user_id);

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

-- Create templates table for AI prompt templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  prompt TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
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
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Users can view own templates"
  ON templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE
  USING (auth.uid() = user_id);

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
CREATE INDEX IF NOT EXISTS templates_user_id_idx ON templates(user_id);
CREATE INDEX IF NOT EXISTS templates_platform_idx ON templates(platform);
CREATE INDEX IF NOT EXISTS post_variants_post_id_idx ON post_variants(post_id);
CREATE INDEX IF NOT EXISTS post_variants_platform_idx ON post_variants(platform);
CREATE INDEX IF NOT EXISTS posting_queue_post_id_idx ON posting_queue(post_id);
CREATE INDEX IF NOT EXISTS posting_queue_status_idx ON posting_queue(status);
CREATE INDEX IF NOT EXISTS posting_queue_scheduled_time_idx ON posting_queue(scheduled_time);
CREATE INDEX IF NOT EXISTS social_accounts_ayrshare_profile_id_idx ON social_accounts(ayrshare_profile_id);
CREATE INDEX IF NOT EXISTS social_accounts_is_active_idx ON social_accounts(is_active);

