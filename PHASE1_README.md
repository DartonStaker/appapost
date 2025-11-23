# Phase 1: Supabase Auth + Basic Data Layer

## Overview

Phase 1 implements Supabase authentication (Google + Email) and a basic data layer with Row Level Security (RLS) policies. This phase focuses on user authentication, data storage, and dashboard functionality.

## Prerequisites

- Node.js 18+ installed
- Supabase account and project created
- Vercel account (for deployment)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy your `Project URL` and `anon public` key

3. **Configure environment variables:**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Set up database schema:**
   - Go to Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the SQL script to create tables and RLS policies

5. **Enable Google OAuth (optional):**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Google provider
   - Add your OAuth credentials (Client ID and Secret)
   - Add redirect URL: `https://your-domain.vercel.app/auth/callback`

## Database Schema

### Tables Created:

1. **profiles** - User profile information
   - Extends Supabase auth.users
   - Automatically created on user signup via trigger

2. **posts** - Content posts
   - `id` (UUID, primary key)
   - `user_id` (UUID, foreign key to auth.users)
   - `title` (TEXT)
   - `excerpt` (TEXT, nullable)
   - `image_url` (TEXT, nullable)
   - `type` ('product' | 'blog')
   - `status` ('draft' | 'queued' | 'posted')
   - `created_at`, `updated_at` (timestamps)

3. **schedules** - Scheduled posts
   - `id` (UUID, primary key)
   - `post_id` (UUID, foreign key to posts)
   - `platform` (TEXT)
   - `scheduled_time` (TIMESTAMPTZ)

4. **social_accounts** - Connected social media accounts
   - `id` (UUID, primary key)
   - `user_id` (UUID, foreign key to auth.users)
   - `platform` (TEXT)
   - `access_token` (TEXT)
   - `refresh_token` (TEXT, nullable)

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only view/edit/delete their own data
- Schedules are protected through post ownership
- Automatic profile creation on user signup

## Features

### Authentication
- ✅ Email/Password login
- ✅ Google OAuth login
- ✅ Protected routes via middleware
- ✅ Automatic session management
- ✅ User profile creation

### Dashboard
- ✅ Real-time data fetching from Supabase
- ✅ Statistics: Total Posts, Scheduled, Posted, Connected Accounts
- ✅ Recent Posts list (last 5)
- ✅ Quick Actions buttons

### API Routes
- ✅ `GET /api/posts` - Fetch user's posts
- ✅ `POST /api/posts` - Create draft post
- ✅ `POST /api/seed` - Seed sample posts (for testing)

## Testing

### 1. Test Authentication Flow

1. Start dev server: `npm run dev`
2. Navigate to `/login`
3. Try email/password signup (Supabase will create account)
4. Try Google OAuth (if configured)
5. Verify redirect to `/dashboard`

### 2. Seed Sample Data

After logging in, you can seed sample posts:

```bash
# Using curl (replace with your auth token)
curl -X POST http://localhost:3000/api/seed \
  -H "Cookie: your-session-cookie"
```

Or create a test button in the dashboard to call this endpoint.

### 3. Test Dashboard

1. Login and navigate to `/dashboard`
2. Verify statistics are displayed correctly
3. Check Recent Posts section
4. Test Quick Actions buttons

### 4. Test API Routes

```bash
# Get posts
curl http://localhost:3000/api/posts \
  -H "Cookie: your-session-cookie"

# Create post
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "title": "Test Post",
    "excerpt": "This is a test",
    "type": "blog",
    "image_url": "https://example.com/image.jpg"
  }'
```

## Deployment to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Phase 1: Supabase Auth + Data Layer"
   git push
   ```

2. **Deploy to Vercel:**
   - Connect your GitHub repo to Vercel
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Update Supabase OAuth redirect URL:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL: `https://your-app.vercel.app/auth/callback`

4. **Test deployment:**
   - Visit your Vercel URL
   - Test login flow
   - Verify dashboard loads correctly

## Security Notes

- ✅ All database queries use RLS policies
- ✅ Middleware protects `/dashboard` routes
- ✅ API routes verify user authentication
- ✅ Environment variables are properly scoped
- ✅ No sensitive data exposed to client

## Next Steps (Phase 2)

- Social media account connection
- AI content generation
- Post scheduling
- Template management

## Troubleshooting

### "Unauthorized" errors
- Check that RLS policies are enabled
- Verify user is authenticated
- Check Supabase logs for RLS policy violations

### OAuth not working
- Verify redirect URL is correct in Supabase
- Check OAuth credentials are valid
- Ensure callback route is accessible

### Database connection issues
- Verify environment variables are set
- Check Supabase project is active
- Review Supabase dashboard for connection status

## Support

For issues or questions:
1. Check Supabase logs in dashboard
2. Review Vercel deployment logs
3. Check browser console for client errors
4. Review Next.js server logs

