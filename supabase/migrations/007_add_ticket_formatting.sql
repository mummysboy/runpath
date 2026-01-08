-- Add formatting fields to tickets table
-- These fields allow admins and UX writers to format ticket text
-- Developers will see plain text but tickets will still be sorted by priority

-- Check if columns exist before adding
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'title_formatting'
  ) THEN
    ALTER TABLE tickets ADD COLUMN title_formatting JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'description_formatting'
  ) THEN
    ALTER TABLE tickets ADD COLUMN description_formatting JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add index for priority sorting (already exists but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);

-- Update priority enum order for sorting: urgent > high > medium > low
-- We'll handle sorting in the application layer, but ensure the enum values are correct

COMMENT ON COLUMN tickets.title_formatting IS 'Formatting options for ticket title: {bold: boolean, italic: boolean, underline: boolean, highlight: boolean, allCaps: boolean}';
COMMENT ON COLUMN tickets.description_formatting IS 'Formatting options for ticket description: {bold: boolean, italic: boolean, underline: boolean, highlight: boolean, allCaps: boolean}';
