import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Shield, Building2, CreditCard, TrendingUp, Megaphone, UserCheck, FolderKanban, Ticket } from 'lucide-react';

export default async function AdminPage() {
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

  // Get stats
  const { count: usersCount } = await supabase
    .from('users_profile')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', profile.org_id);

  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', profile.org_id);

  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', profile.org_id);

  const { count: ticketsCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', profile.org_id);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Admin Dashboard</h1>
        <p className="text-[#b7c1cf]">Manage your organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[rgba(94,160,255,0.15)] rounded-lg">
              <Users className="w-5 h-5 text-[#5ea0ff]" />
            </div>
            <h3 className="text-sm text-[#9eacc2]">Users</h3>
          </div>
          <p className="text-3xl font-bold text-[#f7f9ff]">{usersCount || 0}</p>
          <Link
            href="/app/admin/users"
            className="text-sm text-[#5ea0ff] hover:text-[#8fc2ff] mt-2 inline-block"
          >
            Manage →
          </Link>
        </div>

        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[rgba(94,160,255,0.15)] rounded-lg">
              <Building2 className="w-5 h-5 text-[#5ea0ff]" />
            </div>
            <h3 className="text-sm text-[#9eacc2]">Clients</h3>
          </div>
          <p className="text-3xl font-bold text-[#f7f9ff]">{clientsCount || 0}</p>
          <Link
            href="/app/admin/clients"
            className="text-sm text-[#5ea0ff] hover:text-[#8fc2ff] mt-2 inline-block"
          >
            Manage →
          </Link>
        </div>

        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[rgba(94,160,255,0.15)] rounded-lg">
              <FolderKanban className="w-5 h-5 text-[#5ea0ff]" />
            </div>
            <h3 className="text-sm text-[#9eacc2]">Projects</h3>
          </div>
          <p className="text-3xl font-bold text-[#f7f9ff]">{projectsCount || 0}</p>
        </div>

        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[rgba(94,160,255,0.15)] rounded-lg">
              <Ticket className="w-5 h-5 text-[#5ea0ff]" />
            </div>
            <h3 className="text-sm text-[#9eacc2]">Tickets</h3>
          </div>
          <p className="text-3xl font-bold text-[#f7f9ff]">{ticketsCount || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/app/admin/users"
          className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 hover:border-[rgba(94,160,255,0.2)] transition"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[rgba(94,160,255,0.15)] rounded-lg">
              <Users className="w-5 h-5 text-[#5ea0ff]" />
            </div>
            <h3 className="text-xl font-semibold text-[#f4f6fb]">Users</h3>
          </div>
          <p className="text-sm text-[#9eacc2]">Manage users, invite new members, assign roles</p>
        </Link>

        <Link
          href="/app/admin/roles"
          className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 hover:border-[rgba(94,160,255,0.2)] transition"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[rgba(94,160,255,0.15)] rounded-lg">
              <Shield className="w-5 h-5 text-[#5ea0ff]" />
            </div>
            <h3 className="text-xl font-semibold text-[#f4f6fb]">Roles & Permissions</h3>
          </div>
          <p className="text-sm text-[#9eacc2]">Create roles, manage permissions</p>
        </Link>

        <Link
          href="/app/admin/clients"
          className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 hover:border-[rgba(94,160,255,0.2)] transition"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[rgba(94,160,255,0.15)] rounded-lg">
              <Building2 className="w-5 h-5 text-[#5ea0ff]" />
            </div>
            <h3 className="text-xl font-semibold text-[#f4f6fb]">Clients</h3>
          </div>
          <p className="text-sm text-[#9eacc2]">Manage clients and create projects</p>
        </Link>

        <Link
          href="/app/admin/billing"
          className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 hover:border-[rgba(94,160,255,0.2)] transition"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[rgba(94,160,255,0.15)] rounded-lg">
              <CreditCard className="w-5 h-5 text-[#5ea0ff]" />
            </div>
            <h3 className="text-xl font-semibold text-[#f4f6fb]">Billing</h3>
          </div>
          <p className="text-sm text-[#9eacc2]">Manage billing profiles and invoicing</p>
        </Link>

        <Link
          href="/app/sales"
          className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 hover:border-[rgba(94,160,255,0.2)] transition"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[rgba(94,160,255,0.15)] rounded-lg">
              <TrendingUp className="w-5 h-5 text-[#5ea0ff]" />
            </div>
            <h3 className="text-xl font-semibold text-[#f4f6fb]">Sales Pipeline</h3>
          </div>
          <p className="text-sm text-[#9eacc2]">Track sales opportunities</p>
        </Link>

        <Link
          href="/app/marketing"
          className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 hover:border-[rgba(94,160,255,0.2)] transition"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[rgba(94,160,255,0.15)] rounded-lg">
              <Megaphone className="w-5 h-5 text-[#5ea0ff]" />
            </div>
            <h3 className="text-xl font-semibold text-[#f4f6fb]">Marketing</h3>
          </div>
          <p className="text-sm text-[#9eacc2]">Manage marketing campaigns</p>
        </Link>
      </div>
    </div>
  );
}

