# Google OAuth Setup for Supabase + Vercel

## Error: "Unsupported provider: provider is not enabled"

This error means Google OAuth is not enabled in your Supabase project. Follow these steps to enable it.

## Step 1: Enable Google Provider in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `skerjjeuapdbshgbhvrh`

2. **Open Authentication Settings**
   - Click on **Authentication** in the left sidebar
   - Click on **Providers** tab

3. **Enable Google Provider**
   - Find **Google** in the list of providers
   - Toggle it to **Enabled**
   - You'll see fields for:
     - **Client ID (for OAuth)**
     - **Client Secret (for OAuth)**

## Step 2: Get Google OAuth Credentials

### Option A: Use Existing Google Cloud Project

If you already have a Google Cloud project:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Copy the **Client ID** and **Client Secret**

### Option B: Create New Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

3. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - If prompted, configure the OAuth consent screen first:
     - User Type: **External** (or Internal if using Google Workspace)
     - App name: **AppaPost**
     - User support email: Your email
     - Developer contact: Your email
     - Click **Save and Continue**
     - Scopes: Click **Save and Continue** (default scopes are fine)
     - Test users: Add your email, click **Save and Continue**

4. **Create OAuth Client ID**
   - Application type: **Web application**
   - Name: **AppaPost Web Client**
   - **Authorized JavaScript origins:**
     ```
     https://skerjjeuapdbshgbhvrh.supabase.co
     https://appapost.vercel.app
     http://localhost:3000 (for local development)
     ```
   - **Authorized redirect URIs:**
     ```
     https://skerjjeuapdbshgbhvrh.supabase.co/auth/v1/callback
     https://appapost.vercel.app/auth/callback
     http://localhost:3000/auth/callback (for local development)
     ```
   - Click **Create**
   - Copy the **Client ID** and **Client Secret**

## Step 3: Configure Supabase with Google Credentials

1. **Back in Supabase Dashboard**
   - Go to **Authentication** → **Providers** → **Google**
   - Paste your **Client ID** into the "Client ID (for OAuth)" field
   - Paste your **Client Secret** into the "Client Secret (for OAuth)" field
   - Click **Save**

## Step 4: Configure Supabase Redirect URLs

1. **In Supabase Dashboard**
   - Go to **Authentication** → **URL Configuration**
   - Under **Redirect URLs**, add:
     ```
     https://appapost.vercel.app/auth/callback
     http://localhost:3000/auth/callback
     ```
   - Click **Save**

## Step 5: Verify Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Select your **AppaPost** project
   - Go to **Settings** → **Environment Variables**

2. **Verify these variables are set:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://skerjjeuapdbshgbhvrh.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_SITE_URL=https://appapost.vercel.app
   ```

3. **If NEXT_PUBLIC_SITE_URL is missing:**
   - Click **Add New**
   - Key: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://appapost.vercel.app`
   - Environment: Select all (Production, Preview, Development)
   - Click **Save**

## Step 6: Redeploy on Vercel

After making changes:

1. **Trigger a new deployment:**
   - Go to **Deployments** tab in Vercel
   - Click **Redeploy** on the latest deployment
   - Or push a new commit to trigger auto-deploy

## Step 7: Test Google OAuth

1. **Visit your app:**
   - Go to: https://appapost.vercel.app/login
   - Click **Continue with Google**
   - You should be redirected to Google sign-in
   - After signing in, you should be redirected back to `/dashboard`

## Troubleshooting

### Still getting "provider is not enabled" error?

1. **Double-check Supabase:**
   - Go to **Authentication** → **Providers**
   - Verify Google is **Enabled** (toggle is ON)
   - Verify Client ID and Secret are saved (not empty)

2. **Check redirect URLs:**
   - In Supabase: **Authentication** → **URL Configuration**
   - Ensure `https://appapost.vercel.app/auth/callback` is listed
   - Ensure it's saved

3. **Clear browser cache:**
   - Sometimes cached redirects cause issues
   - Try incognito/private window

4. **Check Vercel logs:**
   - Go to Vercel Dashboard → **Deployments** → Click on latest deployment
   - Check **Functions** tab for any errors

### "Redirect URI mismatch" error?

This means the redirect URL in Google Cloud Console doesn't match what Supabase is using.

1. **Check Google Cloud Console:**
   - Go to **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Under **Authorized redirect URIs**, ensure you have:
     ```
     https://skerjjeuapdbshgbhvrh.supabase.co/auth/v1/callback
     ```

2. **The redirect flow:**
   - User clicks "Continue with Google" → Goes to Supabase
   - Supabase redirects to Google → User signs in
   - Google redirects back to Supabase: `https://skerjjeuapdbshgbhvrh.supabase.co/auth/v1/callback`
   - Supabase redirects to your app: `https://appapost.vercel.app/auth/callback`

### OAuth consent screen issues?

If you see "This app isn't verified":

1. **For testing:**
   - Add your email as a test user in Google Cloud Console
   - Go to **OAuth consent screen** → **Test users** → Add your email

2. **For production:**
   - You'll need to verify your app with Google
   - This requires submitting for verification (can take weeks)
   - For now, test users work fine

## Quick Checklist

- [ ] Google provider enabled in Supabase
- [ ] Google Client ID and Secret added to Supabase
- [ ] Redirect URL added in Supabase: `https://appapost.vercel.app/auth/callback`
- [ ] Google Cloud Console has redirect URI: `https://skerjjeuapdbshgbhvrh.supabase.co/auth/v1/callback`
- [ ] `NEXT_PUBLIC_SITE_URL` set in Vercel: `https://appapost.vercel.app`
- [ ] Vercel deployment is up to date
- [ ] Tested in incognito window

## Support

If issues persist:
1. Check Supabase logs: **Logs** → **Auth Logs**
2. Check Vercel function logs: **Deployments** → **Functions**
3. Check browser console for errors
4. Verify all URLs match exactly (no trailing slashes, correct protocol)

