-- Add assignee field to tickets
-- Allows assigning tickets to specific team members

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE tickets ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for querying tickets by assignee
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);

COMMENT ON COLUMN tickets.assigned_to IS 'User ID of the team member assigned to this ticket. NULL means unassigned.';
