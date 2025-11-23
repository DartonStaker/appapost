# Fix Supabase Site URL Configuration

## Issue
Your Supabase **Site URL** is currently set to `http://localhost:3000`, which can cause redirect issues in production.

## Solution

### Update Site URL in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `skerjjeuapdbshgbhvrh`

2. **Open URL Configuration**
   - Go to **Authentication** → **URL Configuration**

3. **Update Site URL**
   - In the **Site URL** field, change from:
     ```
     http://localhost:3000
     ```
   - To:
     ```
     https://appapost.vercel.app
     ```
   - Click **Save changes**

4. **Keep Redirect URLs as they are**
   - Your redirect URLs are already correct:
     - ✅ `https://appapost.vercel.app/auth/callback`
     - ✅ `http://localhost:3000/auth/callback` (for local dev)

## Why This Matters

The **Site URL** is used as the default redirect URL when:
- A redirect URL is not specified
- A redirect URL doesn't match one from the allow list

If it's set to localhost, Supabase might try to redirect there even in production.

## After Updating

1. **Test the flow again:**
   - Visit: https://appapost.vercel.app/login
   - Click "Continue with Google"
   - Should redirect to production dashboard

2. **If still having issues:**
   - Clear browser cache
   - Try incognito window
   - Check browser console for errors

