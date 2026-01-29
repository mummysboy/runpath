-- Make tags project-scoped instead of organization-scoped
-- Tags created in a project are only visible/usable within that project

-- Add project_id column to ticket_tags
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_tags' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE ticket_tags ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for project-scoped queries
CREATE INDEX IF NOT EXISTS idx_ticket_tags_project_id ON ticket_tags(project_id);

-- Update unique constraint to be project-scoped instead of org-scoped
-- First drop the old constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ticket_tags_org_id_name_key'
    AND table_name = 'ticket_tags'
  ) THEN
    ALTER TABLE ticket_tags DROP CONSTRAINT ticket_tags_org_id_name_key;
  END IF;
END $$;

-- Add new unique constraint for project-scoped tag names
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ticket_tags_project_id_name_key'
    AND table_name = 'ticket_tags'
  ) THEN
    ALTER TABLE ticket_tags ADD CONSTRAINT ticket_tags_project_id_name_key UNIQUE(project_id, name);
  END IF;
END $$;

-- Update existing tags to be associated with projects based on their ticket assignments
-- This migrates existing tags to the project of the first ticket they're assigned to
UPDATE ticket_tags tt
SET project_id = (
  SELECT t.project_id
  FROM ticket_tag_assignments tta
  JOIN tickets t ON t.id = tta.ticket_id
  WHERE tta.tag_id = tt.id
  LIMIT 1
)
WHERE tt.project_id IS NULL
AND EXISTS (
  SELECT 1 FROM ticket_tag_assignments tta WHERE tta.tag_id = tt.id
);

-- Delete any orphan tags that aren't assigned to any tickets
DELETE FROM ticket_tags WHERE project_id IS NULL;

COMMENT ON COLUMN ticket_tags.project_id IS 'Project this tag belongs to. Tags are scoped to individual projects.';
