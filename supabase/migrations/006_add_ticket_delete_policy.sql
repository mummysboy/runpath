-- Add DELETE policies for tickets, projects, and clients tables
-- Only admins can permanently delete these entities

-- Tickets: Only admins can delete tickets
CREATE POLICY "Admins can delete tickets"
  ON tickets FOR DELETE
  USING (
    org_id = current_org_id()
    AND EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.org_id = current_org_id()
        AND (ur.scope_type = 'org' AND ur.scope_id IS NULL)
    )
  );

-- Projects: Only admins can delete projects (project members can manage but not delete)
CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  USING (
    org_id = current_org_id()
    AND EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.org_id = current_org_id()
        AND (ur.scope_type = 'org' AND ur.scope_id IS NULL)
    )
  );

-- Clients: Only admins can delete clients
CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  USING (
    org_id = current_org_id()
    AND EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.org_id = current_org_id()
        AND (ur.scope_type = 'org' AND ur.scope_id IS NULL)
    )
  );
