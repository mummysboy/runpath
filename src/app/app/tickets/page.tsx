import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import FormattedText from '@/components/FormattedText';
import TicketTags from '@/components/TicketTags';
import TicketFilters from '@/components/TicketFilters';

interface TicketsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const params = await searchParams;
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

  // Extract filter params
  const statusFilter = typeof params.status === 'string' ? params.status : '';
  const projectFilter = typeof params.project === 'string' ? params.project : '';
  const tagFilter = typeof params.tag === 'string' ? params.tag : '';
  const assigneeFilter = typeof params.assignee === 'string' ? params.assignee : '';
  const searchQuery = typeof params.search === 'string' ? params.search : '';

  // Build tickets query with filters
  let ticketsQuery = supabase
    .from('tickets')
    .select('*, projects(*, clients(*))')
    .eq('org_id', profile.org_id)
    .eq('archived', false)
    .order('created_at', { ascending: false });

  if (isClient) {
    ticketsQuery = ticketsQuery.eq('client_visible', true);
  }

  // Apply filters
  if (statusFilter) {
    ticketsQuery = ticketsQuery.eq('status', statusFilter);
  }

  if (projectFilter) {
    ticketsQuery = ticketsQuery.eq('project_id', projectFilter);
  }

  if (assigneeFilter === 'unassigned') {
    ticketsQuery = ticketsQuery.is('assigned_to', null);
  } else if (assigneeFilter) {
    ticketsQuery = ticketsQuery.eq('assigned_to', assigneeFilter);
  }

  if (searchQuery) {
    ticketsQuery = ticketsQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data: tickets } = await ticketsQuery;

  // Filter by tag (needs to be done in JS since it requires join)
  let filteredTickets = tickets || [];

  // Get tags for all tickets
  const ticketIds = filteredTickets.map((t: any) => t.id);
  let ticketTagsMap: Record<string, any[]> = {};

  if (ticketIds.length > 0) {
    const { data: tagAssignments } = await supabase
      .from('ticket_tag_assignments')
      .select('*, ticket_tags(*)')
      .in('ticket_id', ticketIds);

    if (tagAssignments) {
      tagAssignments.forEach((ta: any) => {
        if (!ticketTagsMap[ta.ticket_id]) {
          ticketTagsMap[ta.ticket_id] = [];
        }
        if (ta.ticket_tags) {
          ticketTagsMap[ta.ticket_id].push(ta.ticket_tags);
        }
      });
    }

    // If filtering by tag, filter tickets
    if (tagFilter) {
      filteredTickets = filteredTickets.filter((ticket: any) => {
        const ticketTags = ticketTagsMap[ticket.id] || [];
        return ticketTags.some((tag: any) => tag.id === tagFilter);
      });
    }
  }

  // Sort tickets by sort_order (manual order), then by priority as fallback
  const sortedTickets = [...filteredTickets].sort((a: any, b: any) => {
    // If both have sort_order, use that
    if (a.sort_order !== null && b.sort_order !== null && a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    // Fall back to priority
    return getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
  });

  // Get creator profiles separately
  const creatorIds = filteredTickets.map((t: any) => t.created_by).filter(Boolean);
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

  // Get assignee profiles
  const assigneeIds = filteredTickets.map((t: any) => t.assigned_to).filter(Boolean);
  let assigneeProfiles: Record<string, any> = {};
  if (assigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from('users_profile')
      .select('*')
      .in('user_id', assigneeIds);
    if (profiles) {
      assigneeProfiles = profiles.reduce((acc: Record<string, any>, p: any) => {
        acc[p.user_id] = p;
        return acc;
      }, {});
    }
  }

  const hasActiveFilters = statusFilter || projectFilter || tagFilter || assigneeFilter || searchQuery;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Tickets</h1>
          <p className="text-[#b7c1cf]">View and manage all tickets</p>
        </div>
        <Link
          href="/app/tickets/board"
          className="px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.08)] transition"
        >
          Board View
        </Link>
      </div>

      <TicketFilters />

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
                    {ticket.assigned_to && (
                      <span className="text-[#5ea0ff]"> • Assigned to {assigneeProfiles[ticket.assigned_to]?.full_name || 'Unknown'}</span>
                    )}
                  </p>
                  {ticketTagsMap[ticket.id]?.length > 0 && (
                    <div className="mt-2">
                      <TicketTags tags={ticketTagsMap[ticket.id]} size="sm" />
                    </div>
                  )}
                </div>
                <div className="ml-4 flex gap-2 flex-wrap justify-end">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff] whitespace-nowrap">
                    {ticket.status}
                  </span>
                  {!isDeveloper && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(255,255,255,0.05)] text-[#9eacc2] whitespace-nowrap">
                      {ticket.priority}
                    </span>
                  )}
                  {ticket.due_date && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      new Date(ticket.due_date) < new Date() && ticket.status !== 'closed' && ticket.status !== 'resolved'
                        ? 'bg-[rgba(248,113,113,0.15)] text-[#f87171]'
                        : 'bg-[rgba(255,255,255,0.05)] text-[#9eacc2]'
                    }`}>
                      {new Date(ticket.due_date) < new Date() && ticket.status !== 'closed' && ticket.status !== 'resolved'
                        ? 'Overdue'
                        : `Due ${new Date(ticket.due_date).toLocaleDateString()}`
                      }
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-[#9eacc2]">
              {hasActiveFilters ? 'No tickets match your filters' : 'No tickets found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
