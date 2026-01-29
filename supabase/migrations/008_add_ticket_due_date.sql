-- Add optional due_date field to tickets table
-- This allows setting a deadline for when the ticket should be completed

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE tickets ADD COLUMN due_date DATE DEFAULT NULL;
  END IF;
END $$;

-- Add index for due_date to optimize queries filtering/sorting by due date
CREATE INDEX IF NOT EXISTS idx_tickets_due_date ON tickets(due_date);

COMMENT ON COLUMN tickets.due_date IS 'Optional due date for the ticket. NULL means no due date set.';
