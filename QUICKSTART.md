# Quick Start Guide - AppaPost

## 🚀 Get the App Running in 3 Steps

### Step 1: Create Environment File

Create a `.env.local` file in the root directory with these minimum required variables:

```env
# Supabase Database Connection
# Get this from: Supabase Dashboard → Settings → Database → Connection string (URI)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# NextAuth - Generate a secret key
# Windows PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here

# Optional: For full functionality, add these later
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# OPENAI_API_KEY=...
# XAI_API_KEY=...
```

### Step 2: Set Up Supabase Database

**Follow the detailed guide in `SUPABASE_SETUP.md`**

Quick steps:
1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the connection string (URI format)
5. Replace `[YOUR-PASSWORD]` with your database password
6. Add to `.env.local` as `DATABASE_URL`
7. Run: `npm run db:push`

### Step 3: Start Development Server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser!

## 🎯 What You'll See

1. **Landing Page** (`/`) - Marketing page for AppaPost
2. **Sign In** (`/api/auth/signin`) - Authentication page
3. **Dashboard** (`/dashboard`) - Main hub (requires authentication)

## ⚠️ Important Notes

- **Database is required** - The app won't work without a database connection
- **Supabase is free** - Free tier includes 500MB database and 2GB bandwidth
- **Authentication** - You can sign in with Google (if configured) or Email
- **Social Media APIs** - Optional for now, add them later to enable posting
- **AI Generation** - Optional for now, add API keys later to enable content generation

## 🔧 Troubleshooting

**"Cannot connect to database"**
- Check your `DATABASE_URL` is correct
- Verify database password is correct (replace `[YOUR-PASSWORD]` in connection string)
- Check Supabase project is active
- Try using connection pooling URL (see `SUPABASE_SETUP.md`)

**"NEXTAUTH_SECRET is missing"**
- Generate a secret: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))`
- Add it to `.env.local`

**Port 3000 already in use**
- Change port: `npm run dev -- -p 3001`
- Or stop the process using port 3000

**Database migration errors**
- Make sure `DATABASE_URL` is correct
- Check Supabase project is active
- Verify you have proper permissions

## 📝 Next Steps After Setup

1. **Connect Social Accounts** - Go to Settings → Connect your social media accounts
2. **Configure Brand** - Set your brand voice and default hashtags
3. **Set Up Webhook** - Add webhook URL to your Apparely store
4. **Add API Keys** - Add AI and social media API keys for full functionality

## 🔗 Useful Links

- **Supabase Setup**: See `SUPABASE_SETUP.md` for detailed database setup
- **Full Documentation**: See `README.md` for complete guide
- **Troubleshooting**: See `SETUP.md` for common issues

For detailed setup instructions, see `README.md` and `SUPABASE_SETUP.md`.
