# Quick Fix: Production Login Issues

## Immediate Steps to Fix

### 1. Check Environment Variables (MOST COMMON ISSUE)

**In your hosting platform (Vercel/Netlify/Railway/etc.), verify these are set:**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**How to check:**
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables  
- Railway: Project → Variables
- Render: Environment → Environment Variables

**After adding/updating:**
- **Redeploy your application** (this is critical!)

### 2. Configure Supabase Redirect URLs

1. Go to Supabase Dashboard → **Authentication → URL Configuration**
2. Set **Site URL** to your production domain:
   ```
   https://your-domain.com
   ```
3. Add to **Redirect URLs**:
   ```
   https://your-domain.com/app
   https://your-domain.com/**
   ```

### 3. Check Browser Console

Open DevTools (F12) and look for:
- Red errors about missing environment variables
- Network errors (404, 500, etc.)
- CORS errors

### 4. Verify Build

Check your build logs for:
- ✅ Build completes successfully
- ✅ No TypeScript errors
- ✅ CSS files are generated

### 5. Test Login Flow

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to login
4. Check for error messages
5. Check Network tab for failed requests

## Common Error Messages & Fixes

### "Missing Supabase environment variables"
**Fix:** Add environment variables in hosting platform and redeploy

### "Invalid login credentials"  
**Fix:** Verify user exists in Supabase Auth and password is correct

### "Session not persisted" or redirects back to login
**Fix:** 
- Check Supabase redirect URLs are configured
- Verify cookies are enabled in browser
- Check hosting platform cookie settings

### Login page looks unstyled
**Fix:**
- Verify `npm run build` completes without errors
- Check that Tailwind CSS is included in build
- Ensure `postcss.config.mjs` exists
- Rebuild and redeploy

## Still Not Working?

1. **Compare local vs production:**
   - Check if `.env.local` values match production environment variables
   - Verify Supabase project is the same

2. **Check server logs:**
   - Look for middleware errors
   - Check for authentication errors
   - Verify Supabase connection

3. **Test Supabase connection:**
   - Go to Supabase Dashboard
   - Verify project is active
   - Check API settings

4. **Verify user exists:**
   - Supabase Dashboard → Authentication → Users
   - Ensure user is confirmed
   - Check user has profile in database
