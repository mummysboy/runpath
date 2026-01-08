import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Auth error or no user:', authError);
    redirect('/login?error=no_session');
  }

  // Get user profile and roles
  let profile;
  const { data: profileData, error: profileError } = await supabase
    .from('users_profile')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileError) {
    // Log the actual error - this appears in your TERMINAL (where npm run dev runs)
    // NOT in the browser console!
    const errorInfo = {
      userId: user.id,
      email: user.email,
      errorCode: profileError.code,
      errorMessage: profileError.message,
      errorDetails: profileError.details,
      errorHint: profileError.hint,
    };
    
    // Log to server console (check your terminal!)
    console.error('\n[SERVER ERROR] Profile query failed:');
    console.error(JSON.stringify(errorInfo, null, 2));
    
    // Also log to browser via response header for debugging
    // If it's a permission error, it's likely RLS blocking access
    if (profileError.code === '42501' || profileError.message?.includes('permission') || profileError.message?.includes('row-level security')) {
      console.error('[SERVER] ⚠️  RLS is blocking access. You MUST run FIX_RLS_NOW.sql in Supabase SQL Editor!');
    }
    
    redirect('/login?error=profile_error');
  }

  profile = profileData;

  if (!profile) {
    // User is authenticated but no profile exists
    console.error('[SERVER] User authenticated but no profile found:', {
      userId: user.id,
      email: user.email,
    });
    redirect('/login?error=no_profile');
  }

  // Log successful profile fetch (for debugging)
  console.log('[SERVER] Profile found:', {
    userId: user.id,
    profileId: profile.user_id,
    orgId: profile.org_id,
  });

  // Get user roles (non-critical, can be empty)
  const { data: roles } = await supabase
    .from('user_roles')
    .select('*, roles(*)')
    .eq('user_id', user.id);

  return (
    <div className="flex h-screen bg-[#0d0f11] text-[#e8ecf2]">
      <Sidebar user={user} profile={profile} roles={roles || []} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

