import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import InviteUserForm from './InviteUserForm';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, roles(*)')
    .eq('user_id', user.id);

  const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');

  if (!isAdmin) {
    redirect('/app');
  }

  const { data: profile } = await supabase
    .from('users_profile')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Get all users in org
  const { data: users } = await supabase
    .from('users_profile')
    .select('*, user_roles(*, roles(*))')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false });

  // Get available roles
  const { data: roles } = await supabase
    .from('roles')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('name');

  // Fetch emails for users using admin client
  const adminClient = createAdminClient();
  const usersWithEmails = await Promise.all(
    (users || []).map(async (userProfile: any) => {
      try {
        const { data: authUser } = await adminClient.auth.admin.getUserById(userProfile.user_id);
        return {
          ...userProfile,
          email: authUser?.user?.email || 'N/A',
        };
      } catch {
        return {
          ...userProfile,
          email: 'N/A',
        };
      }
    })
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Users</h1>
          <p className="text-[#b7c1cf]">Manage users and their roles</p>
        </div>
        <InviteUserForm orgId={profile.org_id} roles={roles || []} />
      </div>

      <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[rgba(255,255,255,0.05)] border-b border-[rgba(255,255,255,0.08)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#f4f6fb]">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#f4f6fb]">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#f4f6fb]">Roles</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#f4f6fb]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
              {usersWithEmails && usersWithEmails.length > 0 ? (
                usersWithEmails.map((userProfile: any) => (
                  <tr key={userProfile.user_id} className="hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="px-6 py-4 text-sm text-[#d6dbe5]">
                      {userProfile.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#d6dbe5]">
                      {userProfile.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {userProfile.user_roles && userProfile.user_roles.length > 0 ? (
                          userProfile.user_roles.map((ur: any) => (
                            <span
                              key={ur.id}
                              className="px-2 py-1 rounded text-xs font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]"
                            >
                              {ur.roles?.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#9eacc2]">No roles assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-sm text-[#5ea0ff] hover:text-[#8fc2ff]">
                        Manage Roles
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#9eacc2]">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

