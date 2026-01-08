-- Add archived field to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- Create index for filtering archived tickets
CREATE INDEX IF NOT EXISTS idx_tickets_archived ON tickets(archived);

-- Update RLS policies to allow admins to archive/unarchive tickets
-- (The existing policies already cover this, but we ensure archived tickets are still visible to authorized users)
