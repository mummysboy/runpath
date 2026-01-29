-- Add tags/labels system for grouping tickets
-- Tags are organization-scoped and can be assigned to multiple tickets

-- Create ticket_tags table for storing available tags
CREATE TABLE IF NOT EXISTS ticket_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#5ea0ff', -- Default blue color
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name) -- Tag names must be unique within an organization
);

-- Create junction table for ticket-tag assignments (many-to-many)
CREATE TABLE IF NOT EXISTS ticket_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES ticket_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ticket_id, tag_id) -- A tag can only be assigned once per ticket
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_tags_org_id ON ticket_tags(org_id);
CREATE INDEX IF NOT EXISTS idx_ticket_tag_assignments_ticket_id ON ticket_tag_assignments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_tag_assignments_tag_id ON ticket_tag_assignments(tag_id);

-- RLS Policies for ticket_tags
ALTER TABLE ticket_tags ENABLE ROW LEVEL SECURITY;

-- Users can view tags in their organization
CREATE POLICY "Users can view tags in their organization"
  ON ticket_tags FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM users_profile WHERE user_id = auth.uid()
    )
  );

-- Users can create tags in their organization (admin, ux, dev roles)
CREATE POLICY "Users can create tags in their organization"
  ON ticket_tags FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM users_profile WHERE user_id = auth.uid()
    )
  );

-- Users can update tags in their organization
CREATE POLICY "Users can update tags in their organization"
  ON ticket_tags FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM users_profile WHERE user_id = auth.uid()
    )
  );

-- Admins can delete tags
CREATE POLICY "Admins can delete tags"
  ON ticket_tags FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM users_profile WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for ticket_tag_assignments
ALTER TABLE ticket_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view tag assignments for tickets they can access
CREATE POLICY "Users can view tag assignments"
  ON ticket_tag_assignments FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets WHERE org_id IN (
        SELECT org_id FROM users_profile WHERE user_id = auth.uid()
      )
    )
  );

-- Users can assign tags to tickets
CREATE POLICY "Users can assign tags to tickets"
  ON ticket_tag_assignments FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM tickets WHERE org_id IN (
        SELECT org_id FROM users_profile WHERE user_id = auth.uid()
      )
    )
  );

-- Users can remove tag assignments
CREATE POLICY "Users can remove tag assignments"
  ON ticket_tag_assignments FOR DELETE
  USING (
    ticket_id IN (
      SELECT id FROM tickets WHERE org_id IN (
        SELECT org_id FROM users_profile WHERE user_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE ticket_tags IS 'Available tags/labels for categorizing tickets within an organization';
COMMENT ON TABLE ticket_tag_assignments IS 'Junction table linking tickets to their assigned tags';
