import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users_profile')
    .select('*, org_id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Check admin permissions
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, roles(*)')
    .eq('user_id', user.id);

  const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');

  if (!isAdmin) {
    redirect('/app');
  }

  // Get client
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!client || client.org_id !== profile.org_id) {
    notFound();
  }

  // Get projects for this client
  const { data: projects } = await supabase
    .from('projects')
    .select('*, project_members(count)')
    .eq('client_id', params.id)
    .order('created_at', { ascending: false });

  // Get ticket counts per project
  const projectIds = projects?.map((p: any) => p.id) || [];
  let ticketCounts: Record<string, number> = {};
  
  if (projectIds.length > 0) {
    const { data: tickets } = await supabase
      .from('tickets')
      .select('project_id')
      .in('project_id', projectIds);

    if (tickets) {
      ticketCounts = tickets.reduce((acc: Record<string, number>, ticket: any) => {
        acc[ticket.project_id] = (acc[ticket.project_id] || 0) + 1;
        return acc;
      }, {});
    }
  }

  // Calculate total tickets
  const totalTickets = Object.values(ticketCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/app/admin/clients"
          className="text-[#5ea0ff] hover:text-[#8fc2ff] text-sm mb-4 inline-block"
        >
          ← Back to Clients
        </Link>
        <div className="flex items-start justify-between mt-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">{client.name}</h1>
            <p className="text-[#b7c1cf]">
              Client ID: {client.id.slice(0, 8)}... • Created {new Date(client.created_at).toLocaleDateString()}
            </p>
          </div>
          <span className="px-4 py-2 rounded-full text-sm font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]">
            {client.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#f4f6fb]">Projects</h2>
            <div className="space-y-3">
              {projects && projects.length > 0 ? (
                projects.map((project: any) => (
                  <Link
                    key={project.id}
                    href={`/app/projects/${project.id}`}
                    className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 hover:border-[rgba(94,160,255,0.2)] transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-[#f4f6fb] mb-1">{project.name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-[#9eacc2]">
                          <span>Tickets: {ticketCounts[project.id] || 0}</span>
                          {project.start_date && (
                            <span>
                              Started: {new Date(project.start_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff] whitespace-nowrap">
                          {project.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#9eacc2] mb-4">No projects yet</p>
                  <Link
                    href="/app/projects"
                    className="text-[#5ea0ff] hover:text-[#8fc2ff] text-sm"
                  >
                    Create a project →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
            <h3 className="font-semibold text-[#f4f6fb] mb-4">Client Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#9eacc2]">Status</p>
                <p className="text-[#f4f6fb] font-medium capitalize">{client.status}</p>
              </div>
              <div>
                <p className="text-[#9eacc2]">Billing Type</p>
                <p className="text-[#f4f6fb] font-medium capitalize">{client.billing_type}</p>
              </div>
              <div>
                <p className="text-[#9eacc2]">Created</p>
                <p className="text-[#f4f6fb] font-medium">
                  {new Date(client.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-[#9eacc2]">Last Updated</p>
                <p className="text-[#f4f6fb] font-medium">
                  {new Date(client.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
            <h3 className="font-semibold text-[#f4f6fb] mb-4">Statistics</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#9eacc2]">Total Projects</p>
                <p className="text-[#f4f6fb] font-medium text-2xl">{projects?.length || 0}</p>
              </div>
              <div>
                <p className="text-[#9eacc2]">Total Tickets</p>
                <p className="text-[#f4f6fb] font-medium text-2xl">{totalTickets}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

