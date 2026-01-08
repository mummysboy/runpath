# Login Troubleshooting Guide

If login is not working, follow these steps to diagnose and fix the issue:

## Step 1: Check if User Exists in Supabase Auth

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Users**
3. Check if your user exists
4. If not, create one:
   - Click "Add user" → "Create new user"
   - Enter email and password
   - **Check "Auto Confirm User"** ✅
   - Click "Create user"
   - **Copy the User ID** (UUID)

## Step 2: Verify Database Migration Was Run

1. Go to Supabase Dashboard > **SQL Editor**
2. Run this query to check if tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users_profile', 'organizations', 'roles', 'user_roles');
```

If tables don't exist, you need to run the migration:
1. Open `supabase/migrations/001_initial_schema.sql`
2. Copy all contents
3. Paste into SQL Editor
4. Click "Run"

## Step 3: Create User Profile and Assign Admin Role

After creating the user in Auth (Step 1), you need to:

1. Go to Supabase Dashboard > **SQL Editor**
2. Run this SQL (replace `YOUR_USER_ID` with the UUID from Step 1):

```sql
-- Create user profile
INSERT INTO users_profile (user_id, org_id, full_name)
VALUES (
  'YOUR_USER_ID',  -- Replace with your user ID from Auth
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

## Step 4: Verify Environment Variables

Check that `.env.local` has correct values:

```bash
# Should look like this (not the placeholder values):
NEXT_PUBLIC_SUPABASE_URL=https://tzjcjuwaciruwtvdsuhy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**Important**: After changing `.env.local`, restart your dev server:
```bash
# Stop server (Ctrl+C)
npm run dev
```

## Step 5: Check Browser Console

1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Try to log in
4. Look for error messages
5. Check Network tab for failed requests

Common errors you might see:

### "Invalid login credentials"
- User doesn't exist in Supabase Auth
- Email/password is incorrect
- User was not confirmed (check "Auto Confirm User" when creating)

### "User not found" or redirects back to login
- User exists in Auth but no profile in `users_profile` table
- Run Step 3 SQL queries

### "Permission denied" or RLS errors
- Migration not run properly
- User profile missing `org_id`
- Run Step 2 to verify tables exist

## Step 6: Test Connection to Supabase

You can test if your Supabase connection works by running this in the browser console on the login page:

```javascript
// Test Supabase connection
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Check if we can reach Supabase
supabase.auth.getSession().then(console.log);
```

## Common Issues and Fixes

### Issue: Login button does nothing
**Fix**: Check browser console for JavaScript errors. Make sure all dependencies are installed: `npm install`

### Issue: "Session is missing"
**Fix**: Make sure middleware is properly configured. The session should be saved in cookies automatically.

### Issue: Redirects to /login after successful login
**Fix**: Check that user has a profile in `users_profile` table (Step 3)

### Issue: CORS errors
**Fix**: Verify `NEXT_PUBLIC_SUPABASE_URL` is correct (should be `https://your-project.supabase.co`, not the dashboard URL)

## Quick Test Checklist

- [ ] User exists in Supabase Auth
- [ ] User is auto-confirmed (no email verification needed)
- [ ] Database migration has been run
- [ ] User profile exists in `users_profile` table
- [ ] User has Admin role assigned
- [ ] `.env.local` has correct Supabase credentials
- [ ] Dev server was restarted after changing `.env.local`
- [ ] Browser console shows no errors
- [ ] Network requests to Supabase succeed (check Network tab)

## Still Not Working?

If after following all steps login still doesn't work:

1. Check the exact error message in browser console
2. Check Supabase Dashboard > Logs for any errors
3. Verify the user ID matches exactly in both Auth and `users_profile` table
4. Try creating a fresh user and following all steps again

