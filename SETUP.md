# Quick Setup Guide

Follow these steps to get your Business OS Dashboard running:

## Step 1: Install Dependencies ✅
```bash
npm install
```
**Status**: ✅ Completed

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Runpath Business OS
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Click "Create new project" and wait ~2 minutes for setup

### 2.2 Get Your API Keys
1. In your Supabase project dashboard, go to **Settings > API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon public key** (under "Project API keys" > "anon" > "public")
   - **service_role key** (under "Project API keys" > "service_role" > "secret") ⚠️ Keep this secret!

### 2.3 Update Environment Variables
Edit `.env.local` in the project root and replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Run Database Migration

### 3.1 Open SQL Editor
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"

### 3.2 Run Migration
1. Open the file `supabase/migrations/001_initial_schema.sql`
2. Copy **ALL** the contents
3. Paste into the SQL Editor
4. Click "Run" (or press Cmd/Ctrl + Enter)
5. Wait for "Success. No rows returned"

This creates:
- ✅ All database tables
- ✅ Row Level Security policies
- ✅ Helper functions
- ✅ Default organization ("Runpath Labs")
- ✅ Default roles (Admin, UX Researcher, Developer, Client)
- ✅ Default permissions

## Step 4: Create Your First Admin User

### 4.1 Create User in Supabase Auth
1. Go to **Authentication > Users** in Supabase dashboard
2. Click "Add user" → "Create new user"
3. Fill in:
   - **Email**: your-email@example.com
   - **Password**: (choose a strong password)
   - **Auto Confirm User**: ✅ Check this
4. Click "Create user"
5. **Copy the User ID** (UUID) - you'll need this!

### 4.2 Add User Profile and Admin Role
1. Go to **SQL Editor** again
2. Run this SQL (replace `YOUR_USER_ID` with the UUID from step 4.1):

```sql
-- Create user profile
INSERT INTO users_profile (user_id, org_id, full_name)
VALUES (
  'YOUR_USER_ID',  -- Replace with your user ID from step 4.1
  '00000000-0000-0000-0000-000000000001',  -- Default org ID
  'Your Name'  -- Your actual name
);

-- Assign Admin role
INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
VALUES (
  'YOUR_USER_ID',  -- Replace with your user ID
  '00000000-0000-0000-0000-000000000010',  -- Default Admin role ID
  'org',
  NULL
);
```

3. Click "Run"
4. You should see "Success. 1 row inserted" twice

## Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 6: Log In

1. Navigate to [http://localhost:3000/login](http://localhost:3000/login)
2. Enter the email and password from step 4.1
3. You should be redirected to `/app` (your dashboard)

## Troubleshooting

### "Invalid API key" error
- Check that `.env.local` has correct Supabase URL and keys
- Make sure keys are not wrapped in quotes
- Restart the dev server after changing `.env.local`

### "Permission denied" errors
- Make sure you ran the migration (Step 3)
- Verify your user has a profile and admin role (Step 4)
- Check that you used the correct User ID UUID

### "Not authenticated" redirects
- Make sure your user was created in Supabase Auth
- Verify the email matches exactly (case-sensitive)
- Check that you set "Auto Confirm User" when creating the user

### Migration errors
- Make sure you're running the entire migration file
- Check that you haven't run it twice (tables already exist)
- Verify extensions are enabled (the migration should handle this)

## Next Steps After Setup

Once logged in as admin, you can:

1. **Create Clients**: Go to `/app/admin/clients`
2. **Create Projects**: After creating a client, create projects for them
3. **Invite Users**: Create users and assign them roles
4. **Create Tickets**: As UX Researcher, create tickets in projects
5. **Manage Roles**: Customize permissions in `/app/admin/roles`

## Need Help?

Check the main `README.md` for more detailed documentation on:
- How RLS works
- Database schema details
- API patterns
- Component structure

