import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminRolesPage() {
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

  // Get all roles
  const { data: roles } = await supabase
    .from('roles')
    .select('*, role_permissions(permissions(*))')
    .eq('org_id', profile.org_id)
    .order('name');

  // Get all permissions
  const { data: permissions } = await supabase
    .from('permissions')
    .select('*')
    .order('key');

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Roles & Permissions</h1>
          <p className="text-[#b7c1cf]">Manage roles and their permissions</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition">
          + New Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-[#f4f6fb]">Roles</h2>
          <div className="space-y-4">
            {roles && roles.length > 0 ? (
              roles.map((role: any) => (
                <div
                  key={role.id}
                  className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#f4f6fb]">{role.name}</h3>
                      {role.description && (
                        <p className="text-sm text-[#9eacc2] mt-1">{role.description}</p>
                      )}
                    </div>
                    <button className="text-sm text-[#5ea0ff] hover:text-[#8fc2ff]">
                      Edit
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-[#9eacc2] mb-2">Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {role.role_permissions && role.role_permissions.length > 0 ? (
                        role.role_permissions.map((rp: any) => (
                          <span
                            key={rp.permissions.id}
                            className="px-2 py-1 rounded text-xs font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]"
                          >
                            {rp.permissions.key}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#9eacc2]">No permissions</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[#9eacc2] text-center py-8">No roles found</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 text-[#f4f6fb]">Available Permissions</h2>
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
            <div className="space-y-3">
              {permissions && permissions.length > 0 ? (
                permissions.map((permission: any) => (
                  <div
                    key={permission.id}
                    className="p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg"
                  >
                    <div className="font-medium text-sm text-[#f4f6fb]">{permission.key}</div>
                    {permission.description && (
                      <div className="text-xs text-[#9eacc2] mt-1">{permission.description}</div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[#9eacc2] text-center py-8">No permissions found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

