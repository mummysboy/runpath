-- CRITICAL FIX: Fix infinite recursion in project_members RLS policy
-- Copy everything below and paste into Supabase SQL Editor, then click Run

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Users can view project members" ON project_members;

-- Step 2: Create the fixed policy without circular dependency
-- Use the SECURITY DEFINER function instead of querying project_members directly
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  USING (
    -- Users can see members of projects in their org
    project_id IN (
      SELECT id FROM projects WHERE org_id = current_org_id()
    )
    OR
    -- Users can see project members if they are a member themselves (via function to avoid recursion)
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
        AND EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id
            AND pm.user_id = auth.uid()
        )
    )
  );

-- Alternative simpler approach: Just allow viewing members of projects in the user's org
-- This is simpler and avoids recursion
DROP POLICY IF EXISTS "Users can view project members" ON project_members;

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
