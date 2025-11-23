# Supabase Database Setup Guide

## 🗄️ Setting Up Supabase for AppaPost

### Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Sign up or log in
3. Click **New Project**
4. Fill in:
   - **Name**: AppaPost (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
5. Click **Create new project**
6. Wait 2-3 minutes for setup to complete

### Step 2: Get Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 3: Update Environment Variables

Add to your `.env.local` file:

```env
# Supabase Database Connection
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Alternative: You can also use POSTGRES_URL (both work)
POSTGRES_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Important**: Replace `[YOUR-PASSWORD]` with your actual database password!

### Step 4: Run Database Migrations

```bash
npm run db:push
```

This will create all the necessary tables in your Supabase database.

### Step 5: Verify Setup

1. Go to Supabase Dashboard → **Table Editor**
2. You should see tables like:
   - `users`
   - `posts`
   - `post_variations`
   - `scheduled_posts`
   - `social_accounts`
   - `templates`
   - `brand_settings`
   - etc.

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use Supabase Row Level Security (RLS)** - Consider enabling for production
3. **Use Connection Pooling** - Supabase provides connection pooling URLs
   - Go to Settings → Database → Connection Pooling
   - Use the pooled connection string for better performance

## 🔗 Connection Pooling (Recommended for Production)

For better performance and connection management:

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection Pooling**
3. Select **Session mode** or **Transaction mode**
4. Copy the pooled connection string
5. Use it as your `DATABASE_URL`

Pooled connection string format:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

## 🛠️ Troubleshooting

**"Connection refused"**
- Check your database password is correct
- Verify the connection string format
- Make sure your IP is allowed (Supabase allows all by default)

**"Database does not exist"**
- The default database name is `postgres`
- Don't change it unless you created a custom database

**"Too many connections"**
- Use connection pooling (see above)
- Check your connection pool settings in code

## 📊 Supabase Dashboard Features

Once set up, you can:
- **Table Editor**: View and edit data directly
- **SQL Editor**: Run custom queries
- **API**: Access REST and GraphQL APIs (optional)
- **Auth**: Use Supabase Auth (optional, we're using NextAuth)

## ✅ Next Steps

After database setup:
1. Start your dev server: `npm run dev`
2. Sign in to the app
3. Your data will be stored in Supabase!

For more help, see `README.md` or `SETUP.md`.

