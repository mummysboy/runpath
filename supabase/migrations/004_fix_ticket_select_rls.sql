-- Fix ticket SELECT RLS policy to allow admins and ticket creators
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view tickets in own org" ON tickets;

-- Create updated policy that allows:
-- 1. Admins can see all tickets in their org
-- 2. Project members can see tickets (clients only see client-visible ones)
-- 3. Users who created the ticket can see it
CREATE POLICY "Users can view tickets in own org"
  ON tickets FOR SELECT
  USING (
    org_id = current_org_id()
    AND (
      -- Admins can see all tickets
      has_permission('admin.manage_projects')
      OR
      -- Users who created the ticket can see it
      created_by = auth.uid()
      OR
      -- Project members can see tickets
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tickets.project_id
          AND pm.user_id = auth.uid()
          AND (
            -- Non-client members see all tickets
            pm.member_role != 'client'
            OR
            -- Client members only see client-visible tickets
            (pm.member_role = 'client' AND tickets.client_visible = true)
          )
      )
    )
  );
