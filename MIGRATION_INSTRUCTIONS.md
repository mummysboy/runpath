# Migration Instructions: Add Ticket Formatting Columns

## Error You're Seeing
```
Could not find the 'description_formatting' column of 'tickets' in the schema cache
```

This error occurs because the database migration hasn't been run yet. The code is trying to use formatting columns that don't exist in your database.

## Solution: Run the Migration

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **"New query"**

### Step 2: Run the Migration
1. Open the file: `supabase/migrations/007_add_ticket_formatting.sql`
2. Copy **ALL** the contents of the file
3. Paste into the Supabase SQL Editor
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. Wait for "Success. No rows returned"

### Step 3: Verify Migration
Run this query to verify the columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name IN ('title_formatting', 'description_formatting');
```

You should see both columns listed with `data_type` = `jsonb`.

### Step 4: Refresh Your Application
After running the migration:
1. Refresh your browser
2. The error should be gone
3. Admins and UX writers will now see the rich text editor when creating tickets

## What This Migration Does

- Adds `title_formatting` column (JSONB) to store formatting metadata for ticket titles
- Adds `description_formatting` column (JSONB) to store formatting metadata for ticket descriptions
- Both columns default to empty JSON objects `{}`
- The migration is safe to run multiple times (it checks if columns exist first)

## Troubleshooting

### "Column already exists" error
This means the migration was already run. You can ignore this error or skip running the migration.

### "Permission denied" error
Make sure you're running the migration as a database superuser or with proper permissions. In Supabase, SQL Editor queries run with the appropriate permissions automatically.

### Still seeing errors after migration
1. Clear your browser cache
2. Restart your Next.js dev server (`npm run dev`)
3. Check that the migration actually ran successfully in Supabase dashboard

## Need Help?

If you continue to see errors after running the migration:
1. Check the Supabase dashboard > Database > Tables > tickets
2. Verify the columns `title_formatting` and `description_formatting` exist
3. Check the browser console for any additional error messages
