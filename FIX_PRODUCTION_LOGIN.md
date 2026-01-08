# Fix: "No accounts are currently registered" Error

## What This Error Means

This error occurs when:
1. **The user doesn't exist** in the Supabase Auth system
2. **Environment variables point to a different Supabase project** than where the user was created (MOST COMMON)
3. **The Supabase project is paused** or inactive

## Quick Fix Steps

### Step 1: Verify Environment Variables Match

**The most common cause is that production environment variables point to a different Supabase project than your local setup.**

1. **Check your local `.env.local` file:**
   ```bash
   cat .env.local
   ```
   Note the `NEXT_PUBLIC_SUPABASE_URL` value (e.g., `https://tzjcjuwaciruwtvdsuhy.supabase.co`)

2. **Check your hosting platform's environment variables:**
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - Railway: Project → Variables
   - Render: Environment → Environment Variables

3. **Compare the Supabase URLs:**
   - The project ID in the URL should match between local and production
   - Example: If local has `tzjcjuwaciruwtvdsuhy`, production should have the same

4. **If they don't match:**
   - Update production environment variables to match your local `.env.local`
   - **Redeploy your application** (critical!)

### Step 2: Verify User Exists in Supabase

1. Go to **Supabase Dashboard**
2. Navigate to **Authentication → Users**
3. Check if your user email exists
4. If not, create the user:
   - Click "Add user" → "Create new user"
   - Enter email and password
   - **Check "Auto Confirm User"** ✅
   - Click "Create user"
   - **Copy the User ID** (UUID)

### Step 3: Verify User Profile Exists

Even if the user exists in Auth, you need a profile in the database:

1. Go to **Supabase Dashboard → SQL Editor**
2. Run this query (replace `YOUR_USER_ID` with the UUID from Step 2):

```sql
-- Check if profile exists
SELECT * FROM users_profile WHERE user_id = 'YOUR_USER_ID';
```

3. **If no profile exists**, create one:

```sql
-- Create user profile
INSERT INTO users_profile (user_id, org_id, full_name)
VALUES (
  'YOUR_USER_ID',  -- Replace with your user ID
  '00000000-0000-0000-0000-000000000001',  -- Default org ID
  'Your Name'  -- Your actual name
)
ON CONFLICT (user_id) DO NOTHING;

-- Assign Admin role
INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
VALUES (
  'YOUR_USER_ID',  -- Replace with your user ID
  '00000000-0000-0000-0000-000000000010',  -- Default Admin role ID
  'org',
  NULL
)
ON CONFLICT DO NOTHING;
```

### Step 4: Check Supabase Project Status

1. Go to **Supabase Dashboard**
2. Check if your project is **Active** (not paused)
3. If paused, you'll need to resume it

### Step 5: Verify Redirect URLs

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Ensure your production domain is in:
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**: `https://your-domain.com/app` and `https://your-domain.com/**`

## Debugging Checklist

Use browser DevTools (F12) on the login page to check:

1. **Console tab** - Look for `[Login Debug]` messages
2. **Network tab** - Check for failed requests to Supabase
3. **Application tab → Cookies** - Verify Supabase cookies are being set

## Common Scenarios

### Scenario 1: Different Supabase Projects
**Symptom:** Login works locally but fails in production  
**Cause:** Production env vars point to different Supabase project  
**Fix:** Update production environment variables to match local

### Scenario 2: User Doesn't Exist
**Symptom:** "No accounts registered" error  
**Cause:** User was never created in Supabase Auth  
**Fix:** Create user in Supabase Dashboard → Authentication → Users

### Scenario 3: User Exists But No Profile
**Symptom:** Login succeeds but redirects back to login  
**Cause:** User exists in Auth but no profile in database  
**Fix:** Run SQL to create user profile (Step 3 above)

## Still Not Working?

1. **Check browser console** for detailed error messages
2. **Compare Supabase project IDs** between local and production
3. **Verify all migrations have been run** in the production Supabase project
4. **Test with a fresh user** created directly in production Supabase project
5. **Check server logs** in your hosting platform for middleware errors
