-- Add sort_order field to tickets for manual ordering
-- Lower numbers appear first (higher priority)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE tickets ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_tickets_sort_order ON tickets(project_id, sort_order);

-- Initialize sort_order based on priority for existing tickets
UPDATE tickets
SET sort_order = CASE priority
  WHEN 'urgent' THEN 1
  WHEN 'high' THEN 2
  WHEN 'medium' THEN 3
  WHEN 'low' THEN 4
  ELSE 5
END * 1000 + EXTRACT(EPOCH FROM created_at)::INTEGER % 1000
WHERE sort_order = 0 OR sort_order IS NULL;

COMMENT ON COLUMN tickets.sort_order IS 'Manual sort order for tickets. Lower numbers appear first.';
