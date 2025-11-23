# Auth Failed Error Diagnosis

## Current Status
You're seeing `?error=auth_failed` after Google OAuth login. Let's diagnose step by step.

## Step 1: Check Browser Console

**Open DevTools (F12) → Console tab** and look for error messages when you try to log in. The callback page now logs detailed errors:

- `"Exchanging code for session..."` - Code received
- `"Error exchanging code:"` - Code exchange failed
- `"No session returned"` - Session creation failed
- `"OAuth error from provider:"` - Error from Google/Supabase

**What to look for:**
- Specific error messages (not just "auth_failed")
- Error status codes
- Network errors

## Step 2: Verify Supabase Configuration

### A. Site URL
1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. **Site URL** should be: `https://appapost.vercel.app` ✅ (You have this)

### B. Redirect URLs
1. In the same section, check **Redirect URLs**
2. Must include exactly: `https://appapost.vercel.app/auth/callback`
3. **Important:** No trailing slash, no query parameters
4. If it's missing, click **Add URL** and add it

### C. Google Provider Settings
1. Go to **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
2. Ensure:
   - Google provider is **Enabled** (toggle ON)
   - **Client ID** matches your Google Cloud Console
   - **Client Secret** matches your Google Cloud Console
3. **Save** if you made changes

## Step 3: Verify Google Cloud Console

### Authorized Redirect URIs
1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, ensure you have:
   - `https://skerjjeuapdbshgbhvrh.supabase.co/auth/v1/callback` ✅ (You have this)

**Note:** You should NOT have `https://appapost.vercel.app/auth/callback` here. The flow is:
- Google → Supabase → Your App

## Step 4: Check Vercel Environment Variables

1. Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
2. Verify these are set:
   - `NEXT_PUBLIC_SUPABASE_URL=https://skerjjeuapdbshgbhvrh.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`
   - `NEXT_PUBLIC_SITE_URL=https://appapost.vercel.app` ✅ (You have this)

3. **Important:** After adding/changing env vars, you must **redeploy** for changes to take effect.

## Step 5: Check Supabase Auth Logs

1. Go to **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Filter by time of your login attempt
3. Look for:
   - Failed authentication attempts
   - Error messages
   - Redirect issues

## Step 6: Common Issues & Fixes

### Issue 1: Code Already Used
**Symptom:** Error on refresh or second attempt
**Fix:** OAuth codes are single-use. Start a fresh login flow (don't refresh the callback page).

### Issue 2: Code Expired
**Symptom:** Error after waiting too long
**Fix:** Complete the OAuth flow quickly (within a few minutes).

### Issue 3: Redirect URL Mismatch
**Symptom:** `redirect_uri_mismatch` error
**Fix:** 
- Check Supabase redirect URL matches exactly: `https://appapost.vercel.app/auth/callback`
- No trailing slash, no extra query params
- Check Google redirect URI: `https://skerjjeuapdbshgbhvrh.supabase.co/auth/v1/callback`

### Issue 4: Cookie Issues
**Symptom:** Session not persisting
**Fix:**
- Check browser settings (allow cookies)
- Try incognito/private window
- Check if third-party cookies are blocked
- Verify SameSite cookie settings

### Issue 5: CORS Issues
**Symptom:** CORS errors in console
**Fix:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` matches your Supabase project URL exactly
- Check Supabase project settings for allowed origins

## Step 7: Test Email/Password Login

Try email/password login to verify Supabase auth is working:
- If email works but Google doesn't → OAuth-specific issue
- If email also fails → General Supabase auth issue

## Step 8: Debug Checklist

After making changes, test in this order:

1. ✅ Clear browser cache and cookies
2. ✅ Try incognito/private window
3. ✅ Check browser console for specific errors
4. ✅ Check Supabase Auth logs
5. ✅ Verify all URLs match exactly (no typos, no trailing slashes)
6. ✅ Redeploy on Vercel after env var changes
7. ✅ Wait a few minutes (OAuth changes can take time to propagate)

## Step 9: Get Specific Error Message

The updated code now shows more specific errors:
- `auth_failed` - Generic failure (check console for details)
- `no_code` - No authorization code received
- `no_session` - Session creation failed
- Any other message from Supabase

**Check the browser console** for the actual error message, not just the URL parameter.

## Still Not Working?

If you've checked all of the above:

1. **Share the browser console error** (F12 → Console)
2. **Share Supabase Auth logs** (Dashboard → Logs → Auth Logs)
3. **Share the exact error message** from the login page (not just "auth_failed")

The updated code now logs detailed errors to help diagnose the issue.

