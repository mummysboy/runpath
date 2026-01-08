import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ClientProjectsSection from './ClientProjectsSection';
import ClientActions from '@/components/ClientActions';

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

  // Get clients list for the form
  const { data: clientsData } = await supabase
    .from('clients')
    .select('id, name')
    .eq('org_id', profile.org_id)
    .order('name', { ascending: true });

  const clients = clientsData || [];

  // Get users for member assignment
  const { data: orgUsers } = await supabase
    .from('users_profile')
    .select('user_id, full_name')
    .eq('org_id', profile.org_id)
    .order('full_name', { ascending: true });

  // Fetch emails for users using admin client
  const adminClient = createAdminClient();
  const users = await Promise.all(
    (orgUsers || []).map(async (userProfile: any) => {
      try {
        const { data: authUser } = await adminClient.auth.admin.getUserById(userProfile.user_id);
        return {
          ...userProfile,
          email: authUser?.user?.email || undefined,
        };
      } catch {
        return {
          ...userProfile,
          email: undefined,
        };
      }
    })
  );

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
          <ClientProjectsSection
            projects={projects || []}
            ticketCounts={ticketCounts}
            clientId={params.id}
            orgId={profile.org_id}
            userId={user.id}
            clients={clients}
            users={users}
          />
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

          {/* Client Actions */}
          <ClientActions clientId={params.id} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}

