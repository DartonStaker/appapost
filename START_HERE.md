# 🚀 START HERE - Get AppaPost Running

## ✅ What's Already Done

- ✅ All code files created
- ✅ Dependencies installed
- ✅ Project structure complete

## 📋 What You Need to Do Now

### 1. Create `.env.local` File

Create a file named `.env.local` in the root directory with this content:

```env
# Minimum required to start the app
# Supabase Database Connection (get from Supabase Dashboard → Settings → Database)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

**To generate NEXTAUTH_SECRET:**
- Windows PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))`
- Or use an online generator

### 2. Set Up Database (Supabase)

**Recommended: Supabase (Free tier available)**
1. Go to https://supabase.com/
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the connection string (URI format)
5. Add to `.env.local` as `DATABASE_URL`
6. Run: `npm run db:push`

**See `SUPABASE_SETUP.md` for detailed instructions!**

**Alternative: Local PostgreSQL**
- Install PostgreSQL
- Create database: `createdb appapost`
- Update `.env.local` with local connection
- Run: `npm run db:push`

### 3. Start the Development Server

```bash
npm run dev
```

Then visit: **http://localhost:3000**

## 🎯 What You'll See

- **Landing Page** - Beautiful marketing page
- **Sign In** - Authentication (Google or Email)
- **Dashboard** - Main app interface

## ⚡ Quick Test (Without Full Setup)

If you just want to see the UI without database:

1. Comment out database calls temporarily
2. Or use a mock database connection
3. The landing page will work without database

## 📚 More Help

- See `QUICKSTART.md` for detailed steps
- See `README.md` for full documentation
- See `SETUP.md` for troubleshooting

## 🎉 Once Running

1. Sign in (Google or Email)
2. Explore the dashboard
3. Connect social accounts (Settings)
4. Configure brand settings
5. Test webhook endpoint

---

**Need help?** Check the error messages in the terminal - they'll tell you what's missing!

