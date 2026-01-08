# Supabase Storage Setup for Ticket Evidence

To enable image uploads for ticket evidence, you need to create a storage bucket in Supabase and set up Row Level Security (RLS) policies.

## Steps to Set Up Storage Bucket

1. **Go to Supabase Dashboard**
   - Navigate to your Supabase project
   - Go to **Storage** in the left sidebar

2. **Create New Bucket**
   - Click **"New bucket"**
   - Name: `ticket-evidence`
   - **Public bucket**: ✅ Check this (so images can be accessed via public URLs)
   - **File size limit**: 10MB (recommended)
   - **Allowed MIME types**: `image/*` (recommended)
   - Click **"Create bucket"**

3. **Set Up Storage Policies (REQUIRED)**
   
   Storage policies must be created manually in the Supabase Dashboard (they cannot be created via SQL migrations).
   
   **Option A: Using the Dashboard (Recommended)**
   
   a. Go to **Storage** > **Policies** in Supabase Dashboard
   
   b. Select the **"ticket-evidence"** bucket
   
   c. Click **"New Policy"** and create the following three policies:
   
   **Policy 1: Upload Policy**
   - **Policy name**: `Authenticated users can upload ticket evidence`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **Policy definition (WITH CHECK expression)**:
     ```sql
     bucket_id = 'ticket-evidence' AND (
       (storage.foldername(name))[1] = 'temp' OR
       (storage.foldername(name))[1] = 'tickets'
     )
     ```
   
   **Policy 2: Read Policy**
   - **Policy name**: `Authenticated users can read ticket evidence`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
   - **Policy definition (USING expression)**:
     ```sql
     bucket_id = 'ticket-evidence'
     ```
   
   **Policy 3: Delete Policy**
   - **Policy name**: `Users can delete ticket evidence`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **Policy definition (USING expression)**:
     ```sql
     bucket_id = 'ticket-evidence'
     ```
   
   **Option B: Using SQL (Alternative)**
   
   If you have superuser access, you can run the SQL directly in the SQL Editor:
   
   ```sql
   -- Enable RLS on storage.objects
   ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
   
   -- Create upload policy
   CREATE POLICY "Authenticated users can upload ticket evidence"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'ticket-evidence' AND (
       (storage.foldername(name))[1] = 'temp' OR
       (storage.foldername(name))[1] = 'tickets'
     )
   );
   
   -- Create read policy
   CREATE POLICY "Authenticated users can read ticket evidence"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'ticket-evidence');
   
   -- Create delete policy
   CREATE POLICY "Users can delete ticket evidence"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'ticket-evidence');
   ```
   
   **Note**: Most users don't have permission to run these SQL commands directly. Use Option A (Dashboard) instead.

## Storage Structure

Images will be stored in the following structure:
```
ticket-evidence/
  ├── tickets/
  │   ├── {ticket-id}/
  │   │   ├── {timestamp}-{random}.jpg
  │   │   └── ...
  │   └── ...
  └── temp/
      └── {timestamp}-{random}.jpg (for new tickets before creation)
```

## Notes

- Images are limited to 10MB per file
- Supported formats: JPG, JPEG, PNG, GIF, WEBP
- Images uploaded before ticket creation are stored in `temp/` folder
- Images uploaded after ticket creation are stored in `tickets/{ticket-id}/` folder
