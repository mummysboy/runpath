-- CRITICAL FIX: Run this now to fix the login redirect issue
-- Copy everything below and paste into Supabase SQL Editor, then click Run

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles in own org" ON users_profile;

-- Step 2: Create the fixed policy
CREATE POLICY "Users can view profiles in own org"
  ON users_profile FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    org_id = current_org_id()
  );

-- Step 3: Verify it worked (should show the new policy)
SELECT 
  policyname,
  qual as policy_condition
FROM pg_policies
WHERE tablename = 'users_profile'
AND policyname = 'Users can view profiles in own org';

-- If you see the policy with condition showing both "user_id = auth.uid()" and "org_id = current_org_id()", 
-- then the fix was applied successfully!

