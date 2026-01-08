-- Fix ticket creation RLS policy to allow admins and project members
-- Drop the existing policy
DROP POLICY IF EXISTS "UX can create tickets" ON tickets;

-- Create updated policy that allows:
-- 1. Users with tickets.create permission
-- 2. Project members with ux or admin role  
-- 3. Org admins (users with admin.manage_projects permission)
-- 4. Any user who is a project member (to allow devs and others to create tickets too)
CREATE POLICY "Users can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    org_id = current_org_id()
    AND (
      -- Users with tickets.create permission
      has_permission('tickets.create')
      OR
      -- Org admins can create tickets for any project in their org
      has_permission('admin.manage_projects')
      OR
      -- Project members can create tickets (any role)
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tickets.project_id
          AND pm.user_id = auth.uid()
      )
    )
  );
