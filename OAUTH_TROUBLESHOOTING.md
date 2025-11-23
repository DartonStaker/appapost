# OAuth Authentication Troubleshooting

## Common Error: `auth_failed`

If you're seeing `?error=auth_failed` after Google login, check the following:

### 1. Check Browser Console

Open browser DevTools (F12) → Console tab and look for error messages. The callback page now logs detailed errors.

### 2. Verify Supabase Configuration

**Site URL:**
- Should be: `https://appapost.vercel.app` ✅ (You have this set correctly)

**Redirect URLs:**
- Must include: `https://appapost.vercel.app/auth/callback` ✅ (You have this)

### 3. Verify Google Cloud Console

**Authorized redirect URIs:**
- Must have: `https://skerjjeuapdbshgbhvrh.supabase.co/auth/v1/callback` ✅ (You have this)
- Should NOT have: `https://appapost.vercel.app/auth/callback` (This is handled by Supabase)

**Note:** Google redirects to Supabase, then Supabase redirects to your app. The flow is:
1. User → Google
2. Google → Supabase (`https://skerjjeuapdbshgbhvrh.supabase.co/auth/v1/callback`)
3. Supabase → Your App (`https://appapost.vercel.app/auth/callback`)

### 4. Check Vercel Environment Variables

Ensure these are set:
- `NEXT_PUBLIC_SUPABASE_URL=https://skerjjeuapdbshgbhvrh.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`
- `NEXT_PUBLIC_SITE_URL=https://appapost.vercel.app` ✅ (You have this)

### 5. Common Causes of `auth_failed`

#### A. Code Already Used
- OAuth codes are single-use
- If you refresh the callback page, the code is already consumed
- **Solution:** Start a fresh login flow

#### B. Code Expired
- OAuth codes expire quickly (usually within minutes)
- **Solution:** Complete the flow quickly or start over

#### C. Redirect URL Mismatch
- The redirect URL in Supabase must exactly match what's configured
- **Check:** Supabase → Authentication → URL Configuration
- Ensure: `https://appapost.vercel.app/auth/callback` (no trailing slash)

#### D. Session Cookie Issues
- Cookies might be blocked or not set properly
- **Solution:** 
  - Check browser settings (allow cookies)
  - Try incognito window
  - Check if third-party cookies are blocked

#### E. CORS Issues
- If you see CORS errors in console
- **Solution:** Verify `NEXT_PUBLIC_SUPABASE_URL` matches your Supabase project URL exactly

### 6. Debug Steps

1. **Check Supabase Auth Logs:**
   - Go to Supabase Dashboard → Logs → Auth Logs
   - Look for errors around the time of login attempt

2. **Check Browser Network Tab:**
   - Open DevTools → Network tab
   - Try logging in again
   - Look for failed requests to `/auth/callback`
   - Check the response for error details

3. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Deployments → Latest deployment
   - Check Functions tab for any errors

4. **Test with Email/Password:**
   - Try email/password login to verify Supabase auth is working
   - If email works but Google doesn't, it's an OAuth-specific issue

### 7. Quick Fixes to Try

1. **Clear browser cache and cookies**
2. **Try incognito/private window**
3. **Verify Google OAuth credentials in Supabase:**
   - Go to Supabase → Authentication → Providers → Google
   - Ensure Client ID and Secret are correct
   - Toggle Google provider OFF and ON again
4. **Redeploy on Vercel** (to ensure latest code is deployed)
5. **Wait a few minutes** (Google OAuth changes can take time to propagate)

### 8. Check the Actual Error

The callback page now shows more specific errors:
- `no_code` - No authorization code received
- `no_session` - Session creation failed
- `auth_failed` - Generic authentication failure
- Any other error message from Supabase

Check the browser console for detailed error logs.

