# Production Deployment Guide

## Common Issues When Deploying

### Issue 0: "No accounts are currently registered" Error

**Symptoms:**
- Error message: "No accounts are currently registered. Please contact support if you believe this is an error."
- Login works locally but fails in production

**Most Common Cause:**
Environment variables in production point to a **different Supabase project** than where your user was created.

**Quick Fix:**
1. Check your local `.env.local` file for `NEXT_PUBLIC_SUPABASE_URL`
2. Compare it with production environment variables in your hosting platform
3. They must match! If they don't, update production to match local
4. Redeploy after updating environment variables

**See `FIX_PRODUCTION_LOGIN.md` for detailed troubleshooting steps.**

### Issue 1: 404 "Page not found" Error on Netlify

**Symptoms:**
- Getting "Page not found" error when accessing the site URL
- Netlify shows 404 for all routes
- Site works locally but not on Netlify

**Most Common Cause:**
Missing or incorrect `netlify.toml` configuration file. Netlify needs to know this is a Next.js app and how to build/serve it.

**Solution:**
1. Ensure `netlify.toml` exists in the root directory with:
   ```toml
   [build]
     command = "npm run build"

   [[plugins]]
     package = "@netlify/plugin-nextjs"

   [build.environment]
     NODE_VERSION = "20"
   ```

2. **CRITICAL - In Netlify Dashboard:**
   - Go to Site settings → Build & deploy → Build settings
   - Build command: `npm run build` (should auto-detect from netlify.toml)
   - **Publish directory: MUST BE EMPTY or set to `.next`** - Do NOT set it to `/` or the repo root!
   - If publish directory is set to the repo root, the plugin will fail with: "Your publish directory cannot be the same as the base directory"
   - Node version: 20 (updated from 18 due to Supabase deprecation warnings)

3. **Important:** The `@netlify/plugin-nextjs` plugin will be automatically installed by Netlify. You don't need to add it to package.json.

4. Redeploy your site after adding/updating `netlify.toml`

**Note:** Static HTML files in root can also cause routing conflicts. They have been moved to `/legacy` folder.

### Issue 2: Login Page Looks Completely Different (Wrong Page Being Served)

**Symptoms:**
- Login page looks completely different between local and production
- Production shows old marketing-style login page instead of modern dark theme
- Production login page doesn't have Supabase authentication

**Most Common Cause:**
Static HTML files in the root directory (`login.html`, `index.html`, etc.) are being served by the hosting platform instead of Next.js routes. These are legacy files from before the app was converted to Next.js.

**Solution:**
Static HTML files have been moved to `/legacy` folder. If you still see the old login page:
1. Ensure your hosting platform is configured to use Next.js (not static file serving)
2. Verify the build command is `npm run build`
3. Check that static files in root don't override Next.js routes
4. Clear your browser cache and try again

### Issue 2: Login Page Looks Different (Styling Issues)

**Symptoms:**
- Login page appears unstyled or with different appearance in production
- Tailwind CSS classes not applying
- Colors, spacing, or layout look wrong

**Causes:**
1. CSS not being built/optimized properly
2. Tailwind CSS not included in production build
3. Missing environment variables causing build issues

**Solutions:**

1. **Verify Tailwind is configured correctly:**
   ```bash
   # Check if tailwind.config.ts exists and is correct
   # Ensure postcss.config.mjs is present
   ```

2. **Rebuild the application:**
   ```bash
   npm run build
   # Check for any build errors
   ```

3. **Check your hosting platform's build settings:**
   - Ensure `npm run build` is the build command
   - Ensure `npm start` or `next start` is the start command
   - Check that all dependencies are installed

4. **Verify CSS is being generated:**
   - Check the `.next` folder after build
   - Look for CSS files in `.next/static/css/`

### Issue 3: Cannot Login in Production

**Symptoms:**
- Login works locally but fails in production
- Error messages about authentication
- Redirects back to login page

**Causes:**
1. Missing environment variables in hosting platform
2. Incorrect Supabase redirect URLs
3. Cookie/session issues in production
4. CORS configuration problems

**Solutions:**

#### Step 1: Set Environment Variables in Hosting Platform

You **MUST** set these environment variables in your hosting platform (Vercel, Netlify, Railway, etc.):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (server-side only)
```

**How to set in common platforms:**

**Vercel:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable
4. Redeploy

**Netlify:**
1. Go to Site settings
2. Navigate to "Environment variables"
3. Add each variable
4. Redeploy

**Railway/Render/Other:**
1. Go to project settings
2. Find "Environment Variables" or "Config Vars"
3. Add each variable
4. Redeploy

#### Step 2: Configure Supabase Redirect URLs

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > URL Configuration**
3. Add your production URL to **Site URL**:
   ```
   https://your-domain.com
   ```
4. Add to **Redirect URLs**:
   ```
   https://your-domain.com/app
   https://your-domain.com/auth/reset-password
   https://your-domain.com/**
   ```

#### Step 3: Check Cookie Settings

The middleware uses cookies for session management. Ensure your hosting platform:
- Supports cookies
- Doesn't strip cookie headers
- Allows SameSite cookie settings

#### Step 4: Verify Build Output

Check your build logs for any errors:
```bash
npm run build
```

Look for:
- Missing environment variable warnings
- Build errors
- TypeScript errors

### Issue 3: Session Not Persisting

**Symptoms:**
- Login succeeds but immediately redirects back to login
- Session appears to be lost

**Solutions:**

1. **Check cookie domain settings:**
   - Ensure cookies are set for the correct domain
   - Check if your hosting platform requires specific cookie settings

2. **Verify middleware is working:**
   - Check server logs for middleware errors
   - Ensure middleware.ts is being executed

3. **Check Supabase client configuration:**
   - Ensure `createBrowserClient` is using correct URL
   - Verify cookies are being set in browser DevTools

### Debugging Steps

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

2. **Check Server Logs:**
   - Look for middleware errors
   - Check for missing environment variables
   - Verify Supabase connection errors

3. **Test Environment Variables:**
   Add this to your login page temporarily to debug:
   ```typescript
   useEffect(() => {
     console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
     console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
   }, []);
   ```

4. **Verify Supabase Connection:**
   In browser console on login page:
   ```javascript
   // Check if Supabase client can be created
   const { createClient } = await import('@supabase/supabase-js');
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   );
   console.log('Supabase client created:', !!supabase);
   ```

### Quick Checklist

Before deploying, ensure:
- [ ] All environment variables are set in hosting platform
- [ ] Supabase redirect URLs include your production domain
- [ ] Build completes without errors (`npm run build`)
- [ ] CSS files are generated (check `.next/static/css/`)
- [ ] No TypeScript errors
- [ ] All dependencies are installed
- [ ] Build command is correct in hosting platform
- [ ] Start command is correct (usually `next start`)

### Platform-Specific Notes

**Vercel:**
- Environment variables are automatically available
- Build command: `npm run build` (default)
- Output directory: `.next` (default)
- No additional configuration needed

**Netlify:**
- Set build command: `npm run build`
- Set publish directory: `.next`
- May need `netlify.toml` configuration

**Railway/Render:**
- Set build command: `npm run build`
- Set start command: `npm start`
- Environment variables in project settings

### Still Having Issues?

1. Check hosting platform logs for specific errors
2. Compare local `.env.local` with production environment variables
3. Verify Supabase project is active and accessible
4. Test Supabase connection from production server
5. Check browser console for client-side errors
6. Verify all migrations have been run in Supabase
