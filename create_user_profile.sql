-- Quick SQL script to create user profile and assign Admin role
-- Replace YOUR_USER_ID with the actual user ID from Supabase Auth

-- Step 1: Create user profile
-- Get your user ID from: Supabase Dashboard > Authentication > Users
INSERT INTO users_profile (user_id, org_id, full_name)
VALUES (
  'YOUR_USER_ID',  -- ⚠️ Replace this with your actual user ID from Auth
  '00000000-0000-0000-0000-000000000001',  -- Default org ID (from migration)
  'Admin User'  -- Your name
)
ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Step 2: Assign Admin role
INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
VALUES (
  'YOUR_USER_ID',  -- ⚠️ Replace this with the same user ID
  '00000000-0000-0000-0000-000000000010',  -- Default Admin role ID (from migration)
  'org',
  NULL
)
ON CONFLICT (user_id, role_id, scope_type, scope_id) DO NOTHING;

-- To verify it worked, run:
-- SELECT up.*, ur.*, r.name as role_name 
-- FROM users_profile up
-- LEFT JOIN user_roles ur ON up.user_id = ur.user_id
-- LEFT JOIN roles r ON ur.role_id = r.id
-- WHERE up.user_id = 'YOUR_USER_ID';

