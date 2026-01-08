import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AppDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users_profile')
    .select('*, org_id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Get user roles to determine dashboard content
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, roles(*)')
    .eq('user_id', user.id);

  const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');
  const isUX = userRoles?.some((ur: any) => ur.roles?.name === 'UX Researcher');
  const isDev = userRoles?.some((ur: any) => ur.roles?.name === 'Developer');
  const isClient = userRoles?.some((ur: any) => ur.roles?.name === 'Client');

  // Get projects user has access to
  const { data: projects } = await supabase
    .from('project_members')
    .select('*, projects(*, clients(*))')
    .eq('user_id', user.id);

  // Get tickets based on role
  let ticketsQuery = supabase
    .from('tickets')
    .select('*, projects(*, clients(*)), created_by_profile:users_profile!created_by(*)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (isClient) {
    ticketsQuery = ticketsQuery.eq('client_visible', true);
  }

  const { data: recentTickets } = await ticketsQuery;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">
          Welcome back, {profile.full_name || user.email}
        </h1>
        <p className="text-[#b7c1cf]">
          {isAdmin && 'Administrator Dashboard'}
          {!isAdmin && isUX && 'UX Researcher Dashboard'}
          {!isAdmin && !isUX && isDev && 'Developer Dashboard'}
          {!isAdmin && !isUX && !isDev && isClient && 'Client Dashboard'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <h3 className="text-sm text-[#9eacc2] mb-2">Projects</h3>
          <p className="text-3xl font-bold text-[#f7f9ff]">{projects?.length || 0}</p>
        </div>
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <h3 className="text-sm text-[#9eacc2] mb-2">Active Tickets</h3>
          <p className="text-3xl font-bold text-[#f7f9ff]">
            {recentTickets?.filter((t: any) => t.status !== 'closed' && t.status !== 'resolved').length || 0}
          </p>
        </div>
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <h3 className="text-sm text-[#9eacc2] mb-2">Your Role</h3>
          <p className="text-lg font-semibold text-[#5ea0ff]">
            {userRoles?.map((ur: any) => ur.roles?.name).join(', ') || 'No role assigned'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-[#f4f6fb]">Recent Projects</h2>
            <Link
              href="/app/projects"
              className="text-[#5ea0ff] hover:text-[#8fc2ff] text-sm font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects && projects.length > 0 ? (
              projects.slice(0, 6).map((pm: any) => (
                <Link
                  key={pm.project_id}
                  href={`/app/projects/${pm.project_id}`}
                  className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 hover:border-[rgba(94,160,255,0.2)] transition"
                >
                  <h3 className="font-semibold text-[#f4f6fb] mb-2">
                    {pm.projects?.name}
                  </h3>
                  <p className="text-sm text-[#9eacc2] mb-2">
                    Client: {pm.projects?.clients?.name}
                  </p>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]">
                    {pm.projects?.status}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-[#9eacc2] col-span-full text-center py-8">
                No projects yet. {isAdmin && 'Create a project to get started.'}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-[#f4f6fb]">Recent Tickets</h2>
            {!isClient && (
              <Link
                href="/app/tickets"
                className="text-[#5ea0ff] hover:text-[#8fc2ff] text-sm font-medium"
              >
                View all →
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {recentTickets && recentTickets.length > 0 ? (
              recentTickets.map((ticket: any) => (
                <Link
                  key={ticket.id}
                  href={`/app/tickets/${ticket.id}`}
                  className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 hover:border-[rgba(94,160,255,0.2)] transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-[#f4f6fb] mb-1">{ticket.title}</h4>
                      <p className="text-sm text-[#9eacc2]">
                        {ticket.projects?.name} • {ticket.created_by_profile?.full_name || 'Unknown'}
                      </p>
                    </div>
                    <span className="ml-4 px-3 py-1 rounded-full text-xs font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]">
                      {ticket.status}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-[#9eacc2] text-center py-8">
                No tickets yet. {isUX && 'Create a ticket to get started.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

