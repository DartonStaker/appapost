# Fix: Google OAuth Redirecting to Localhost

## Problem
After Google login, users are redirected to `http://localhost:3000/?code=...` instead of the production URL.

## Root Cause
The redirect URL is using `window.location.origin` which can resolve to localhost in some cases, or Supabase redirect URL configuration is pointing to localhost.

## Solution

### 1. Verify Vercel Environment Variable

**In Vercel Dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Ensure `NEXT_PUBLIC_SITE_URL` is set to:
   ```
   https://appapost.vercel.app
   ```
3. Make sure it's enabled for **Production**, **Preview**, and **Development**
4. **Redeploy** your application

### 2. Update Supabase Redirect URLs

**In Supabase Dashboard:**
1. Go to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, ensure you have:
   ```
   https://appapost.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
3. **Remove** any localhost URLs that shouldn't be there
4. Click **Save**

### 3. Verify Google Cloud Console Redirect URIs

**In Google Cloud Console:**
1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, ensure you have:
   ```
   https://skerjjeuapdbshgbhvrh.supabase.co/auth/v1/callback
   ```
4. **Do NOT** add `https://appapost.vercel.app/auth/callback` here - Supabase handles the OAuth flow
5. Click **Save**

### 4. Clear Browser Cache

Sometimes cached redirects cause issues:
- Clear browser cache and cookies
- Or use an incognito/private window
- Or clear site data for `appapost.vercel.app`

### 5. Test the Flow

1. Visit: `https://appapost.vercel.app/login`
2. Click "Continue with Google"
3. Sign in with Google
4. You should be redirected to: `https://appapost.vercel.app/dashboard`

## How the Redirect Flow Works

1. **User clicks "Continue with Google"**
   - App redirects to: `https://skerjjeuapdbshgbhvrh.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://appapost.vercel.app/auth/callback`

2. **Supabase redirects to Google**
   - User signs in with Google

3. **Google redirects back to Supabase**
   - URL: `https://skerjjeuapdbshgbhvrh.supabase.co/auth/v1/callback?code=...`

4. **Supabase processes auth and redirects to your app**
   - URL: `https://appapost.vercel.app/auth/callback?code=...`

5. **Your app exchanges code for session**
   - Redirects to: `https://appapost.vercel.app/dashboard`

## Troubleshooting

### Still redirecting to localhost?

1. **Check browser console** for any errors
2. **Check Vercel function logs** for redirect issues
3. **Verify `NEXT_PUBLIC_SITE_URL`** is set correctly in Vercel
4. **Check Supabase Auth logs**:
   - Go to Supabase Dashboard → **Logs** → **Auth Logs**
   - Look for redirect errors

### Getting "redirect_uri_mismatch" error?

This means the redirect URL in Supabase doesn't match what's configured:
- Check Supabase → **Authentication** → **URL Configuration**
- Ensure `https://appapost.vercel.app/auth/callback` is in the list
- Make sure there are no typos or trailing slashes

### Code is working but redirect fails?

The code has been updated to:
- Use `NEXT_PUBLIC_SITE_URL` environment variable when available
- Fall back to `window.location.origin` for local development
- Use `window.location.href` for full page redirects to ensure session is set

## Quick Checklist

- [ ] `NEXT_PUBLIC_SITE_URL` set in Vercel: `https://appapost.vercel.app`
- [ ] Supabase redirect URL includes: `https://appapost.vercel.app/auth/callback`
- [ ] Google Cloud Console has: `https://skerjjeuapdbshgbhvrh.supabase.co/auth/v1/callback`
- [ ] Vercel deployment is up to date
- [ ] Browser cache cleared
- [ ] Tested in incognito window

