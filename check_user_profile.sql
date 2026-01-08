-- Quick check to see if your user profile exists
-- Replace YOUR_USER_ID with your actual user ID from Supabase Auth

-- Step 1: Check if user exists in Auth (in Supabase Dashboard > Authentication > Users)
-- Copy your User ID from there

-- Step 2: Check if profile exists (replace YOUR_USER_ID below)
SELECT 
  up.user_id,
  up.full_name,
  up.org_id,
  ur.id as role_assignment_id,
  r.name as role_name
FROM users_profile up
LEFT JOIN user_roles ur ON up.user_id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE up.user_id = 'YOUR_USER_ID';  -- ⚠️ Replace with your actual user ID

-- If this returns no rows, your profile doesn't exist yet
-- If it returns rows but role_name is NULL, you need to assign a role
-- If it returns rows with role_name, you're all set!

-- To find all users without profiles:
-- SELECT au.id, au.email, au.created_at
-- FROM auth.users au
-- LEFT JOIN users_profile up ON au.id = up.user_id
-- WHERE up.user_id IS NULL;

