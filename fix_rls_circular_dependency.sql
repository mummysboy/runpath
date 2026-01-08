-- Fix RLS circular dependency issue
-- The current RLS policy has a circular dependency that prevents users from seeing their own profile
-- This SQL will fix it

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view profiles in own org" ON users_profile;

-- Create a better policy that allows users to see their own profile first
-- This breaks the circular dependency
CREATE POLICY "Users can view profiles in own org"
  ON users_profile FOR SELECT
  USING (
    -- Allow users to see their own profile (no org check needed)
    user_id = auth.uid()
    OR
    -- Allow users to see other profiles in their org
    org_id = current_org_id()
  );

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE tablename = 'users_profile'
AND policyname = 'Users can view profiles in own org';

