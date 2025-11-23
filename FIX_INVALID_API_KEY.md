# Fix "Invalid API key" Error - Step by Step

## Problem
You're seeing "Invalid Supabase API key" error on the login page. This means the `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variable is either missing, incorrect, or not applied in Vercel.

## Solution (5 Minutes)

### Step 1: Get Your Supabase API Key

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Sign in if needed

2. **Navigate to Your Project:**
   - Click on your project: `skerjjeuapdbshgbhvrh` (or select it from the list)

3. **Get the API Key:**
   - Click **Settings** (gear icon) in the left sidebar
   - Click **API** in the settings menu
   - Under **Project API keys**, find the **anon public** key
   - Click the **copy icon** (📋) next to it
   - **Important:** Copy the `anon public` key, NOT the `service_role` key

   The key should look like:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZXJqamV1YXBkYnNoZ2JodnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDIzNzEsImV4cCI6MjA3OTMxODM3MX0._jEnAlrRNGhomHixKzZBuffkz-osMDHFNNapmJTOcuE
   ```

### Step 2: Add/Update the Key in Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Sign in if needed

2. **Navigate to Your Project:**
   - Click on your project: **appapost**

3. **Go to Environment Variables:**
   - Click **Settings** tab
   - Click **Environment Variables** in the left sidebar

4. **Add or Update the Key:**
   - Look for `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the list
   - If it exists:
     - Click the **three dots** (⋯) on the right
     - Click **Edit**
     - Paste your new key
     - Click **Save**
   - If it doesn't exist:
     - Click **Add New**
     - **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **Value:** Paste the anon key you copied
     - **Environment:** Select **Production, Preview, Development** (or just **Production**)
     - Click **Save**

5. **Verify Other Variables:**
   While you're here, make sure these are also set:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://skerjjeuapdbshgbhvrh.supabase.co`
   - `NEXT_PUBLIC_SITE_URL` = `https://appapost.vercel.app`

### Step 3: Redeploy (CRITICAL!)

**You MUST redeploy after changing environment variables!**

1. **Go to Deployments Tab:**
   - Click **Deployments** tab in Vercel

2. **Redeploy:**
   - Find the latest deployment
   - Click the **three dots** (⋯) on the right
   - Click **Redeploy**
   - Confirm the redeploy

   **OR**

   - Push a new commit to trigger a new deployment:
     ```bash
     git commit --allow-empty -m "Trigger redeploy after env var update"
     git push
     ```

3. **Wait for Deployment:**
   - Wait 1-2 minutes for the deployment to complete
   - You'll see a green checkmark when it's done

### Step 4: Test

1. **Clear Browser Cache:**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear cookies and cache for the last hour
   - Or use an **Incognito/Private window**

2. **Test Login:**
   - Go to: https://appapost.vercel.app/login
   - Try "Continue with Google"
   - The error should be gone!

## Common Mistakes to Avoid

### ❌ Wrong Key Type
- Using `service_role` key instead of `anon public` key
- **Fix:** Always use the `anon public` key for client-side code

### ❌ Extra Spaces
- Copying the key with extra spaces or line breaks
- **Fix:** Copy exactly, no spaces before/after

### ❌ Not Redeploying
- Adding the variable but forgetting to redeploy
- **Fix:** Always redeploy after changing environment variables

### ❌ Wrong Environment
- Setting the variable only for "Development" but deploying to "Production"
- **Fix:** Set for "Production, Preview, Development" or at least "Production"

## Quick Checklist

- [ ] Copied `anon public` key from Supabase (not `service_role`)
- [ ] Added/updated `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
- [ ] Verified `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] Verified `NEXT_PUBLIC_SITE_URL` is set
- [ ] Redeployed on Vercel
- [ ] Cleared browser cache
- [ ] Tested login

## Still Not Working?

If you still see the error after following these steps:

1. **Double-check the key:**
   - Go back to Supabase → Settings → API
   - Copy the `anon public` key again
   - Make sure it matches exactly in Vercel

2. **Check the deployment:**
   - Go to Vercel → Deployments
   - Click on the latest deployment
   - Check the build logs for any errors

3. **Verify in browser:**
   - Open DevTools (F12) → Console
   - Look for any error messages
   - Check if the environment variable is being loaded

4. **Check Supabase Auth Logs:**
   - Go to Supabase Dashboard → Logs → Auth Logs
   - Look for API key validation errors

## Need Help?

If you're still stuck, share:
- Screenshot of your Vercel environment variables (hide the actual key values)
- Screenshot of Supabase API settings (hide the actual key values)
- Any error messages from the browser console (F12)

