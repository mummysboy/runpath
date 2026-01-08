import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import FormattedText from '@/components/FormattedText';

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

  // Check user roles for formatting visibility
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, roles(*)')
    .eq('user_id', user.id);
  const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');
  const isUX = userRoles?.some((ur: any) => ur.roles?.name === 'UX Researcher');
  const isDev = userRoles?.some((ur: any) => ur.roles?.name === 'Developer');
  
  const canSeeFormatting = isAdmin || isUX;
  const isDeveloper = isDev;

  // Helper function to get priority order for sorting
  const getPriorityOrder = (priority: string) => {
    switch (priority) {
      case 'urgent': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  // Get tickets (exclude archived by default)
  let ticketsQuery = supabase
    .from('tickets')
    .select('*, projects(*, clients(*))')
    .eq('org_id', profile.org_id)
    .eq('archived', false) // Exclude archived tickets by default
    .order('created_at', { ascending: false });

  if (isClient) {
    ticketsQuery = ticketsQuery.eq('client_visible', true);
  }

  const { data: tickets } = await ticketsQuery;

  // Sort tickets by priority (highest to lowest)
  const sortedTickets = tickets ? [...tickets].sort((a: any, b: any) => {
    return getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
  }) : [];

  // Get creator profiles separately
  const creatorIds = tickets?.map((t: any) => t.created_by).filter(Boolean) || [];
  let creatorProfiles: Record<string, any> = {};
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('users_profile')
      .select('*')
      .in('user_id', creatorIds);
    if (profiles) {
      creatorProfiles = profiles.reduce((acc: Record<string, any>, p: any) => {
        acc[p.user_id] = p;
        return acc;
      }, {});
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Tickets</h1>
        <p className="text-[#b7c1cf]">View and manage all tickets</p>
      </div>

      <div className="space-y-3">
        {sortedTickets && sortedTickets.length > 0 ? (
          sortedTickets.map((ticket: any) => (
            <Link
              key={ticket.id}
              href={`/app/tickets/${ticket.id}`}
              className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 hover:border-[rgba(94,160,255,0.2)] transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-[#f4f6fb] mb-1">
                    <FormattedText 
                      text={ticket.title} 
                      showAsPlain={isDeveloper}
                      formatting={canSeeFormatting ? (ticket.title_formatting as any) : undefined} 
                    />
                  </h4>
                  <p className="text-sm text-[#9eacc2] mb-2">
                    <FormattedText 
                      text={ticket.description || ''} 
                      showAsPlain={isDeveloper}
                      formatting={canSeeFormatting ? (ticket.description_formatting as any) : undefined} 
                    />
                  </p>
                  <p className="text-sm text-[#9eacc2]">
                    {ticket.projects?.name} • {ticket.projects?.clients?.name} • Created by {creatorProfiles[ticket.created_by]?.full_name || 'Unknown'}
                  </p>
                </div>
                <div className="ml-4 flex gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff] whitespace-nowrap">
                    {ticket.status}
                  </span>
                  {!isDeveloper && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(255,255,255,0.05)] text-[#9eacc2] whitespace-nowrap">
                      {ticket.priority}
                    </span>
                  )}
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

