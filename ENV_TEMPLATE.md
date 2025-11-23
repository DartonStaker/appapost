# Environment Variables Template

Copy this to your `.env.local` file and fill in the values:

```env
# ============================================
# SUPABASE DATABASE CONNECTION (Required)
# ============================================
# Get this from: Supabase Dashboard → Settings → Database → Connection string (URI)
# Replace [YOUR_PASSWORD] with your actual database password
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.skerjjeuapdbshgbhvrh.supabase.co:5432/postgres

# ============================================
# SUPABASE CLIENT (Optional - for future Supabase features)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://skerjjeuapdbshgbhvrh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZXJqamV1YXBkYnNoZ2JodnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDIzNzEsImV4cCI6MjA3OTMxODM3MX0._jEnAlrRNGhomHixKzZBuffkz-osMDHFNNapmJTOcuE

# ============================================
# NEXTAUTH CONFIGURATION (Required)
# ============================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here

# ============================================
# APPARELY CREDENTIALS (Required for login)
# ============================================
APPARELY_EMAIL=apparelydotcoza@gmail.com
APPARELY_PASSWORD=H@ppines5

# ============================================
# OAUTH PROVIDERS (Optional)
# ============================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ============================================
# EMAIL PROVIDER (Optional)
# ============================================
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@example.com
EMAIL_SERVER_PASSWORD=your-email-password
EMAIL_FROM=noreply@appapost.com

# ============================================
# AI SERVICES (Optional)
# ============================================
XAI_API_KEY=your-xai-api-key
OPENAI_API_KEY=your-openai-api-key

# ============================================
# SOCIAL MEDIA APIs (Optional)
# ============================================
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret

# ============================================
# WEBHOOK (Optional)
# ============================================
WEBHOOK_SECRET=your-webhook-secret
DEFAULT_USER_ID=default-user-id

# ============================================
# REDIS/QUEUE (Optional)
# ============================================
REDIS_URL=redis://default:password@host:6379
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

## Quick Setup (Minimum Required)

For the app to run, you only need:

```env
# Replace [YOUR_PASSWORD] with your actual Supabase database password
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.skerjjeuapdbshgbhvrh.supabase.co:5432/postgres
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=qMDvVOKcUo1WFmf+1s0+TooWb53w891uIn0SsnWksP4=
```

## Getting Your Database Password

1. Go to your Supabase project dashboard
2. Go to **Settings** → **Database**
3. If you forgot your password, you can reset it there
4. The password is the one you set when creating the project

## Next Steps

1. Create `.env.local` with the minimum required variables above
2. Replace `[YOUR_PASSWORD]` with your actual password
3. Run: `npm run db:push` to create database tables
4. Run: `npm run dev` to start the app

