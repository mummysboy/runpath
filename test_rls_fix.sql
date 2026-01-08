-- Test if RLS fix worked
-- Run this AFTER applying the RLS fix

-- First, check if the policy exists and what it looks like
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users_profile'
AND policyname = 'Users can view profiles in own org';

-- The qual (WHERE clause) should contain: (user_id = auth.uid() OR org_id = current_org_id())
-- If you only see: (org_id = current_org_id()), then the fix wasn't applied

-- Test query as the authenticated user
-- This simulates what the app is trying to do
SELECT 
  user_id,
  full_name,
  org_id
FROM users_profile
WHERE user_id = auth.uid();

-- If the above returns a row, RLS is working!
-- If it returns nothing, the RLS fix wasn't applied correctly

