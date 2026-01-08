-- CRITICAL FIX: Fix infinite recursion in project_members RLS policy
-- This fixes the error: "infinite recursion detected in policy for relation project_members"
-- Copy everything below and paste into Supabase SQL Editor, then click Run

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Users can view project members" ON project_members;

-- Step 2: Create the fixed policy without circular dependency
-- The fix: Remove the circular reference to project_members itself
-- Users can see members of any project in their org (which is sufficient)
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  USING (
    -- Users can see members of any project in their org
    project_id IN (
      SELECT id FROM projects WHERE org_id = current_org_id()
    )
  );

-- Step 3: Verify it worked
SELECT 
  policyname,
  qual as policy_condition
FROM pg_policies
WHERE tablename = 'project_members'
AND policyname = 'Users can view project members';

-- If you see the policy, the fix was applied successfully!
-- The policy now only checks if the project is in the user's org,
-- which avoids the circular dependency that was causing infinite recursion.
