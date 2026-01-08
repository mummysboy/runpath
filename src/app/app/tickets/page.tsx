import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function TicketsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users_profile')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Check if user is client
  const { data: projectMember } = await supabase
    .from('project_members')
    .select('member_role')
    .eq('user_id', user.id)
    .single();

  const isClient = projectMember?.member_role === 'client';

  // Get tickets
  let ticketsQuery = supabase
    .from('tickets')
    .select('*, projects(*, clients(*)), created_by_profile:users_profile!created_by(*)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false });

  if (isClient) {
    ticketsQuery = ticketsQuery.eq('client_visible', true);
  }

  const { data: tickets } = await ticketsQuery;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Tickets</h1>
        <p className="text-[#b7c1cf]">View and manage all tickets</p>
      </div>

      <div className="space-y-3">
        {tickets && tickets.length > 0 ? (
          tickets.map((ticket: any) => (
            <Link
              key={ticket.id}
              href={`/app/tickets/${ticket.id}`}
              className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 hover:border-[rgba(94,160,255,0.2)] transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-[#f4f6fb] mb-1">{ticket.title}</h4>
                  <p className="text-sm text-[#9eacc2] mb-2">{ticket.description}</p>
                  <p className="text-sm text-[#9eacc2]">
                    {ticket.projects?.name} • {ticket.projects?.clients?.name} • Created by {ticket.created_by_profile?.full_name || 'Unknown'}
                  </p>
                </div>
                <div className="ml-4 flex gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff] whitespace-nowrap">
                    {ticket.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(255,255,255,0.05)] text-[#9eacc2] whitespace-nowrap">
                    {ticket.priority}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-[#9eacc2]">No tickets found</p>
          </div>
        )}
      </div>
    </div>
  );
}

