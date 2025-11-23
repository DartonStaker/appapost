# Phases 2-3: Social Connections + AI Auto-Posting

## Overview

Phases 2-3 implement social media account connections via OAuth and Ayrshare, plus AI-powered content generation and auto-posting with rate limiting.

## Features

- **Unified Social Posting**: Ayrshare API for 90% of posting (handles Instagram, Facebook, X, LinkedIn, TikTok, Pinterest)
- **OAuth Connections**: Connect accounts via platform OAuth flows
- **AI Generation**: Grok (xAI) with OpenAI GPT-4o-mini fallback for platform-optimized content
- **Rate Limiting**: BullMQ queue system with Upstash Redis for respecting platform limits
- **Platform-Specific**: Character limits, formats (text/carousel/video), hashtags

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Ayrshare Setup

1. Sign up at https://www.ayrshare.com (free tier available)
2. Get your API key from the dashboard
3. Add to Vercel: `AYRSHARE_API_KEY=your-key-here`

### 3. Platform OAuth Apps

Create OAuth apps for each platform:

#### Meta (Instagram/Facebook)
- Go to https://developers.facebook.com/apps
- Create app → Add Instagram Basic Display + Facebook Login
- Scopes: `pages_show_list,instagram_basic,pages_manage_posts,pages_read_engagement`
- Add redirect: `https://appapost.vercel.app/api/social/callback/instagram` (and `/facebook`)
- Add env vars: `META_APP_ID`, `META_APP_SECRET`

#### X (Twitter)
- Go to https://developer.twitter.com/en/portal/dashboard
- Create app → Enable OAuth 2.0
- Scopes: `tweet.read tweet.write users.read offline.access`
- Note: Twitter requires manual token entry or full PKCE implementation
- Add env vars: `TWITTER_API_KEY`, `TWITTER_API_SECRET`

#### LinkedIn
- Go to https://www.linkedin.com/developers/apps
- Create app → Auth tab
- Scopes: `w_member_social r_liteprofile w_organization_social`
- Add redirect: `https://appapost.vercel.app/api/social/callback/linkedin`
- Add env vars: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`

#### TikTok
- Go to https://developers.tiktok.com/
- Create app → Content Posting API
- Scopes: `user.info.basic video.upload video.publish`
- Add redirect: `https://appapost.vercel.app/api/social/callback/tiktok`
- Add env vars: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`

#### Pinterest
- Go to https://developers.pinterest.com/apps/
- Create app → OAuth
- Scopes: `user_accounts:read boards:read pins:read pins:write`
- Add redirect: `https://appapost.vercel.app/api/social/callback/pinterest`
- Add env vars: `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET`

### 4. AI API Keys

- **Grok (xAI)**: Get key from https://x.ai → Add `GROK_API_KEY`
- **OpenAI**: Get key from https://platform.openai.com → Add `OPENAI_API_KEY` (fallback)

### 5. Redis (Upstash)

1. Create account at https://upstash.com
2. Create Redis database
3. Add env vars: `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`

### 6. Encryption Key

Generate a random key for token encryption:
```bash
openssl rand -base64 32
```
Add to Vercel: `ENCRYPTION_KEY=your-generated-key`

### 7. Database Migration

Run the migration in Supabase SQL Editor:
```sql
-- Copy contents of supabase/migrations/002_phases_2_3.sql
```

## Environment Variables

Add all these to Vercel:

```env
# Ayrshare (Required)
AYRSHARE_API_KEY=your-ayrshare-key

# Meta (Instagram/Facebook)
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret

# Twitter/X
TWITTER_API_KEY=your-twitter-key
TWITTER_API_SECRET=your-twitter-secret

# LinkedIn
LINKEDIN_CLIENT_ID=your-linkedin-id
LINKEDIN_CLIENT_SECRET=your-linkedin-secret

# TikTok
TIKTOK_CLIENT_KEY=your-tiktok-key
TIKTOK_CLIENT_SECRET=your-tiktok-secret

# Pinterest
PINTEREST_APP_ID=your-pinterest-id
PINTEREST_APP_SECRET=your-pinterest-secret

# AI
GROK_API_KEY=your-grok-key
OPENAI_API_KEY=your-openai-key

# Redis (Upstash)
UPSTASH_REDIS_URL=your-redis-url
UPSTASH_REDIS_TOKEN=your-redis-token

# Encryption
ENCRYPTION_KEY=your-encryption-key
```

## Usage

### 1. Connect Social Accounts

1. Go to `/dashboard/settings/connections`
2. Click "Connect [Platform]" for each platform
3. Complete OAuth flow
4. Account is automatically registered with Ayrshare

### 2. Create Post

1. Go to `/dashboard/posts`
2. Click "Create Post"
3. Fill in title, excerpt, image URL, type
4. Click "Create"

### 3. Generate Variants

1. Click "Generate & Post" on a post
2. Click "Generate Variants"
3. AI generates 3-5 variants per platform
4. Review and edit variants in platform tabs
5. Select variants to post

### 4. Post to Platforms

1. In the generate modal, select variants for each platform
2. Edit text if needed (char counters show limits)
3. Click "Post Selected"
4. Posts are queued with rate limiting
5. Success: Confetti animation + toast

## Rate Limits

Platform limits are automatically respected:

- **Instagram/Facebook**: 25 posts/hour
- **Twitter**: 50 posts/day (free tier)
- **LinkedIn**: 100 posts/day
- **TikTok**: 10 posts/day
- **Pinterest**: 1000 posts/hour

Posts are automatically queued and staggered to respect limits.

## Testing

1. **Connect Account**: Test OAuth flow for one platform
2. **Create Post**: Add a test post with image
3. **Generate**: Click generate and verify AI creates variants
4. **Post**: Select one platform and post (check Ayrshare dashboard)
5. **Queue**: Post to multiple platforms to test rate limiting

## Production Notes

- **Ayrshare**: Free tier has limits. Upgrade to Pro ($29/mo) for unlimited posting
- **Rate Limits**: Queue system handles limits automatically
- **Token Refresh**: Implemented for platforms that support it
- **Error Handling**: Toast notifications for all errors
- **Mobile**: Fully responsive design

## Troubleshooting

### "Ayrshare API key not configured"
- Verify `AYRSHARE_API_KEY` is set in Vercel
- Redeploy after adding env var

### "OAuth callback failed"
- Check redirect URLs match exactly in platform apps
- Verify env vars are correct
- Check Supabase Auth logs

### "AI generation failed"
- Verify `GROK_API_KEY` or `OPENAI_API_KEY` is set
- Check API quota/limits
- Fallback variant is created if AI fails

### "Rate limit exceeded"
- Posts are automatically queued
- Check queue status in dashboard
- Wait for rate limit window to reset

## Next Steps (Phase 4)

- Webhook integration for auto-posting on new products
- Scheduled posting calendar
- Analytics and engagement metrics
- Template management

