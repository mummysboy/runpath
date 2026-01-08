# Password Setup Guide

This guide explains how passwords work in the Runpath Business OS application.

## For Administrators: Setting Up Environment Variables

To use the invite flow feature, you need to set up the `SUPABASE_SERVICE_ROLE_KEY` environment variable.

### Step 1: Get Your Service Role Key

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Scroll down to **Project API keys**
5. Find the **service_role** key (it's labeled as "secret")
6. Click the copy icon to copy it

⚠️ **Important**: The service_role key has admin privileges. Never commit it to version control or expose it to the client-side!

### Step 2: Add to Environment Variables

Create or edit `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Restart Your Development Server

After adding the environment variable:

```bash
# Stop your current server (Ctrl+C)
npm run dev
```

## For Users: Setting Up Your Password

### Option 1: Invited Users (New Accounts)

When an admin invites you:

1. **You'll receive an email** with a subject like "You've been invited to join..."
2. **Click the invitation link** in the email
3. **Set your password** on the account setup page
4. **Sign in** with your email and new password

### Option 2: Existing Users - Password Reset

If you already have an account but forgot your password:

1. Go to the [login page](/login)
2. Click **"Forgot password?"** link
3. Enter your email address
4. Click **"Send Reset Link"**
5. Check your email for the password reset link
6. Click the link in the email
7. Enter your new password twice
8. Click **"Reset Password"**
9. You'll be redirected to login - sign in with your new password

### Option 3: Magic Link (Passwordless)

You can also sign in without a password using a magic link:

1. Go to the [login page](/login)
2. Click **"Use magic link instead"**
3. Enter your email address
4. Click **"Send Magic Link"**
5. Check your email and click the magic link
6. You'll be automatically signed in

## Password Requirements

- Minimum 6 characters
- Recommended: Use a mix of uppercase, lowercase, numbers, and symbols
- Do not reuse passwords from other accounts

## Troubleshooting

### "Missing SUPABASE_SERVICE_ROLE_KEY" Error

- Make sure you've created `.env.local` in the project root
- Verify the key is correctly copied (no extra spaces)
- Restart your development server after adding the key
- The key should start with `eyJ...` (a JWT token)

### "Invalid or expired reset link"

- Password reset links expire after a certain time (usually 1 hour)
- Request a new password reset
- Make sure you're clicking the link within the same browser session

### "User already exists" Error

- The email is already registered in the system
- Try using "Forgot password?" instead
- Contact your administrator if you believe this is an error

### Invite Email Not Received

- Check your spam/junk folder
- Verify the email address is correct
- Ask the admin to resend the invite
- Check that email is enabled in your Supabase project settings

## Security Best Practices

- Never share your password with anyone
- Use a unique password for this application
- Enable two-factor authentication if available (future feature)
- Change your password regularly
- Log out when using shared computers

