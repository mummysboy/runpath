# Quick Fix for Login Redirect Issue

## The Problem
You're being redirected back to login even though your profile exists.

## Most Likely Cause: RLS Policy Not Fixed

The RLS policy has a circular dependency that prevents you from seeing your own profile.

## Quick Fix (2 minutes)

### Step 1: Fix RLS Policy
1. Go to **Supabase Dashboard → SQL Editor**
2. Copy and paste this SQL:

```sql
-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view profiles in own org" ON users_profile;

-- Create a better policy that allows users to see their own profile first
CREATE POLICY "Users can view profiles in own org"
  ON users_profile FOR SELECT
  USING (
    -- Allow users to see their own profile (no org check needed)
    user_id = auth.uid()
    OR
    -- Allow users to see other profiles in their org
    org_id = current_org_id()
  );
```

3. Click **Run**
4. You should see "Success. No rows returned"

### Step 2: Verify It Worked
Run this in SQL Editor to verify:

```sql
-- Replace YOUR_USER_ID with your actual user ID from Auth > Users
SELECT 
  user_id,
  full_name,
  org_id
FROM users_profile
WHERE user_id = 'YOUR_USER_ID';
```

If this returns your profile, the fix worked!

### Step 3: Try Logging In Again
1. Refresh your browser
2. Log in again
3. You should now be able to access `/app`

## Check Server Console
After the fix, check your **terminal** where `npm run dev` is running. You should see:
- `[MIDDLEWARE] User authenticated: your-email@example.com`
- `[SERVER] Profile found: ...`

## Still Not Working?

If it still doesn't work after running the SQL:

1. **Check your User ID**:
   - Go to Supabase Dashboard → Authentication → Users
   - Copy your User ID (UUID)

2. **Verify your profile exists**:
   ```sql
   SELECT * FROM users_profile WHERE user_id = 'YOUR_USER_ID';
   ```

3. **Check if you have an org_id**:
   ```sql
   SELECT user_id, org_id FROM users_profile WHERE user_id = 'YOUR_USER_ID';
   ```
   
   The org_id should be `00000000-0000-0000-0000-000000000001` (the default org from migration)

4. **If org_id is wrong or NULL**, fix it:
   ```sql
   UPDATE users_profile 
   SET org_id = '00000000-0000-0000-0000-000000000001'
   WHERE user_id = 'YOUR_USER_ID';
   ```

