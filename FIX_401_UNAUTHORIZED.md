# Fix 401 Unauthorized Error

## Problem
You're seeing:
- `401 (Unauthorized)` error when calling `POST https://skerjjeuapdbshgbhvrh.supabase.co/auth/v1/token?grant_type=pkce`
- "Error: Invalid API key" on the login page

## Root Cause
The `401 Unauthorized` error means Supabase is rejecting the token exchange request. This typically happens when:

1. **Invalid or Missing API Key**: The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is incorrect or not set
2. **Redirect URL Mismatch**: The redirect URL used doesn't match what's configured in Supabase
3. **Code Already Used/Expired**: The OAuth code has been consumed or expired

## Fix Steps

### Step 1: Verify Supabase Anon Key

1. Go to **Supabase Dashboard** → **Project Settings** → **API**
2. Copy the **anon/public** key (not the service_role key)
3. Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
4. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches exactly
5. **Important**: After updating, you MUST redeploy for changes to take effect

### Step 2: Verify Supabase Redirect URL

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, ensure you have exactly:
   ```
   https://appapost.vercel.app/auth/callback
   ```
3. **Critical**: 
   - No trailing slash
   - No query parameters in the redirect URL list
   - Must match exactly (case-sensitive)

### Step 3: Verify Site URL

1. In the same **URL Configuration** section
2. **Site URL** should be:
   ```
   https://appapost.vercel.app
   ```
3. No trailing slash

### Step 4: Check Vercel Environment Variables

Ensure these are set in Vercel (Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://skerjjeuapdbshgbhvrh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZXJqamV1YXBkYnNoZ2JodnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDIzNzEsImV4cCI6MjA3OTMxODM3MX0._jEnAlrRNGhomHixKzZBuffkz-osMDHFNNapmJTOcuE
NEXT_PUBLIC_SITE_URL=https://appapost.vercel.app
```

**Important**: After adding/changing environment variables:
1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or trigger a new deployment by pushing to GitHub

### Step 5: Clear Browser Cache

1. Clear browser cache and cookies
2. Try in an incognito/private window
3. Test the login flow again

### Step 6: Verify Google OAuth Configuration

1. Go to **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
2. Ensure:
   - Google provider is **Enabled** (toggle ON)
   - **Client ID** matches Google Cloud Console
   - **Client Secret** matches Google Cloud Console
3. Click **Save**

### Step 7: Check Supabase Auth Logs

1. Go to **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Filter by the time of your login attempt
3. Look for:
   - Failed token exchange attempts
   - Error messages about invalid redirect URIs
   - API key validation errors

## Common Mistakes

### ❌ Wrong API Key
- Using `service_role` key instead of `anon` key
- Key has extra spaces or line breaks
- Key is from a different Supabase project

### ❌ Redirect URL Mismatch
- Trailing slash: `https://appapost.vercel.app/auth/callback/` ❌
- Missing protocol: `appapost.vercel.app/auth/callback` ❌
- Query params in redirect list: `https://appapost.vercel.app/auth/callback?next=/dashboard` ❌
- Wrong domain: `https://appapost.vercel.com/auth/callback` ❌

### ❌ Environment Variable Not Applied
- Added to Vercel but didn't redeploy
- Variable name has typo: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (must be exact)
- Variable not set for production environment

## Quick Test

After making changes:

1. **Redeploy on Vercel** (critical!)
2. **Clear browser cache**
3. **Open DevTools Console** (F12)
4. **Try Google login**
5. **Check console for errors**

If you still see `401 Unauthorized`, check:
- Supabase Auth Logs for the exact error message
- Network tab in DevTools to see the full request/response
- Verify the anon key is correct in Vercel

## Debugging

To see what's being sent to Supabase, check the Network tab in DevTools:

1. Open DevTools → **Network** tab
2. Filter by "token"
3. Click on the failed request
4. Check:
   - **Request Headers**: Should include `apikey` header with your anon key
   - **Request Payload**: Should include the code
   - **Response**: Will show the exact error from Supabase

