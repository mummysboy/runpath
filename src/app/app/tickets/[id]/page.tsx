import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import TicketComments from '@/components/TicketComments';
import TicketStatusChange from '@/components/TicketStatusChange';
import TicketActions from '@/components/TicketActions';
import TicketEvidenceSection from '@/components/TicketEvidenceSection';
import FormattedText from '@/components/FormattedText';
import TicketTags from '@/components/TicketTags';
import TicketAssignee from '@/components/TicketAssignee';

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
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
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Await params if it's a Promise (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params;
  const ticketId = resolvedParams.id;

  // Get ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*, projects(*, clients(*))')
    .eq('id', ticketId)
    .single();
  
  // Get creator profile separately since created_by references auth.users, not users_profile directly
  let createdByProfile = null;
  if (ticket?.created_by) {
    const { data: profileData } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', ticket.created_by)
      .single();
    createdByProfile = profileData;
  }

  // Get assignee profile if assigned
  let assigneeProfile = null;
  if (ticket?.assigned_to) {
    const { data: profileData } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', ticket.assigned_to)
      .single();
    assigneeProfile = profileData;
  }

  if (ticketError || !ticket || ticket.org_id !== profile.org_id) {
    console.error('[Ticket Detail] Error fetching ticket:', ticketError);
    notFound();
  }

  // Check access - user can access if they created it, are a project member, or are admin
  const { data: projectMember } = await supabase
    .from('project_members')
    .select('member_role')
    .eq('project_id', ticket.project_id)
    .eq('user_id', user.id)
    .single();
  
  // Allow access if user created the ticket, even if not a project member
  const isCreator = ticket.created_by === user.id;

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, roles(*)')
    .eq('user_id', user.id);
  const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin') ?? false;
  const isUX = userRoles?.some((ur: any) => ur.roles?.name === 'UX Researcher') ?? false;
  const isDev = userRoles?.some((ur: any) => ur.roles?.name === 'Developer') ?? false;
  const isClient = projectMember?.member_role === 'client';
  
  // Check project member roles as well
  const isProjectAdmin = projectMember?.member_role === 'admin';
  const isProjectUX = projectMember?.member_role === 'ux';
  const isProjectDev = projectMember?.member_role === 'dev';
  
  // Determine if user can see formatting (admin or UX)
  const canSeeFormatting = isAdmin || isUX || isProjectAdmin || isProjectUX;
  // Determine if user is developer (should see plain text and no priority badge)
  const isDeveloper = isDev || isProjectDev;

  // Allow access if user created the ticket, is a project member, or is admin
  if (!isCreator && !projectMember && !isAdmin) {
    redirect('/app/projects');
  }

  // Clients can only see client-visible tickets (unless they created it or are admin)
  if (isClient && !ticket.client_visible && !isAdmin && !isCreator) {
    redirect('/app/projects');
  }

  // Get evidence
  const { data: evidence } = await supabase
    .from('ticket_evidence')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  // Get status history
  const { data: statusHistory } = await supabase
    .from('ticket_status_history')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  // Get ticket tags
  const { data: tagAssignments } = await supabase
    .from('ticket_tag_assignments')
    .select('*, ticket_tags(*)')
    .eq('ticket_id', ticketId);

  const ticketTags = tagAssignments?.map((ta: any) => ta.ticket_tags).filter(Boolean) || [];

  // Get changed_by profiles separately
  const changedByIds = statusHistory?.map((h: any) => h.changed_by).filter(Boolean) || [];
  let changedByProfiles: Record<string, any> = {};
  if (changedByIds.length > 0) {
    const { data: profiles } = await supabase
      .from('users_profile')
      .select('*')
      .in('user_id', changedByIds);
    if (profiles) {
      changedByProfiles = profiles.reduce((acc: Record<string, any>, p: any) => {
        acc[p.user_id] = p;
        return acc;
      }, {});
    }
  }

  const canChangeStatus = isAdmin || projectMember?.member_role === 'dev' || projectMember?.member_role === 'admin';
  const canEdit = isAdmin || isUX || isProjectAdmin || isProjectUX || isCreator;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/app/projects/${ticket.project_id}`}
          className="text-[#5ea0ff] hover:text-[#8fc2ff] text-sm mb-4 inline-block"
        >
          ← Back to Project
        </Link>
        <div className="flex items-start justify-between mt-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">
              <FormattedText 
                text={ticket.title} 
                showAsHtml={canSeeFormatting}
                showAsPlain={isDeveloper}
                formatting={canSeeFormatting ? (ticket.title_formatting as any) : undefined} 
              />
            </h1>
            <p className="text-[#b7c1cf]">
              Project: {ticket.projects?.name} • Created by {createdByProfile?.full_name || 'Unknown'}
            </p>
            {ticketTags.length > 0 && (
              <div className="mt-3">
                <TicketTags tags={ticketTags} size="md" />
              </div>
            )}
          </div>
          <div className="flex gap-2 ml-4 flex-wrap justify-end">
            {ticket.archived && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-[rgba(250,204,21,0.15)] text-yellow-300">
                Archived
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]">
              {ticket.status}
            </span>
            {!isDeveloper && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-[rgba(255,255,255,0.05)] text-[#9eacc2]">
                {ticket.priority}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-[rgba(255,255,255,0.05)] text-[#9eacc2]">
              {ticket.type}
            </span>
            {ticket.due_date && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                new Date(ticket.due_date) < new Date() && ticket.status !== 'closed' && ticket.status !== 'resolved'
                  ? 'bg-[rgba(248,113,113,0.15)] text-[#f87171]'
                  : 'bg-[rgba(255,255,255,0.05)] text-[#9eacc2]'
              }`}>
                {new Date(ticket.due_date) < new Date() && ticket.status !== 'closed' && ticket.status !== 'resolved'
                  ? `Overdue (${new Date(ticket.due_date).toLocaleDateString()})`
                  : `Due ${new Date(ticket.due_date).toLocaleDateString()}`
                }
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#f4f6fb]">Description</h2>
            <div className="text-[#d6dbe5] whitespace-pre-wrap">
              {ticket.description ? (
                <FormattedText 
                  text={ticket.description} 
                  showAsHtml={canSeeFormatting}
                  showAsPlain={isDeveloper}
                  formatting={canSeeFormatting ? (ticket.description_formatting as any) : undefined} 
                />
              ) : (
                'No description provided.'
              )}
            </div>
          </div>

          <TicketEvidenceSection
            ticketId={ticketId}
            evidence={evidence || []}
            canAdd={isCreator || isAdmin || projectMember?.member_role === 'admin' || projectMember?.member_role === 'dev' || projectMember?.member_role === 'ux'}
            orgId={profile.org_id}
          />

          <TicketComments ticketId={ticketId} userId={user.id} isClient={isClient || false} />
        </div>

        <div className="space-y-6">
          {canEdit && (
            <Link
              href={`/app/tickets/${ticketId}/edit`}
              className="block w-full px-4 py-3 rounded-lg bg-[rgba(94,160,255,0.15)] border border-[rgba(94,160,255,0.3)] text-[#8fc2ff] text-center font-medium hover:bg-[rgba(94,160,255,0.2)] transition"
            >
              Edit Ticket
            </Link>
          )}

          {canChangeStatus && (
            <TicketStatusChange ticket={ticket} userId={user.id} />
          )}

          {(isAdmin || isProjectAdmin) && (
            <TicketActions
              ticketId={ticketId}
              isArchived={ticket.archived || false}
              isAdmin={isAdmin}
              isProjectAdmin={isProjectAdmin}
            />
          )}

          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
            <h3 className="font-semibold text-[#f4f6fb] mb-4">Ticket Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#9eacc2]">Status</p>
                <p className="text-[#f4f6fb] font-medium">{ticket.status}</p>
              </div>
              {!isDeveloper && (
                <div>
                  <p className="text-[#9eacc2]">Priority</p>
                  <p className="text-[#f4f6fb] font-medium">{ticket.priority}</p>
                </div>
              )}
              <div>
                <p className="text-[#9eacc2]">Type</p>
                <p className="text-[#f4f6fb] font-medium">{ticket.type}</p>
              </div>
              <TicketAssignee
                ticketId={ticketId}
                projectId={ticket.project_id}
                currentAssigneeId={ticket.assigned_to}
                currentAssigneeName={assigneeProfile?.full_name || null}
                canEdit={isAdmin || isProjectAdmin || isProjectUX}
              />
              <div>
                <p className="text-[#9eacc2]">Client Visible</p>
                <p className="text-[#f4f6fb] font-medium">{ticket.client_visible ? 'Yes' : 'No'}</p>
              </div>
              {ticket.due_date && (
                <div>
                  <p className="text-[#9eacc2]">Due Date</p>
                  <p className={`font-medium ${
                    new Date(ticket.due_date) < new Date() && ticket.status !== 'closed' && ticket.status !== 'resolved'
                      ? 'text-[#f87171]'
                      : 'text-[#f4f6fb]'
                  }`}>
                    {new Date(ticket.due_date).toLocaleDateString()}
                    {new Date(ticket.due_date) < new Date() && ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                      <span className="ml-2 text-xs">(Overdue)</span>
                    )}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[#9eacc2]">Created</p>
                <p className="text-[#f4f6fb] font-medium">
                  {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {statusHistory && statusHistory.length > 0 && (
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
              <h3 className="font-semibold text-[#f4f6fb] mb-4">Status History</h3>
              <div className="space-y-3">
                {statusHistory.map((history: any, index: number) => (
                  <div key={history.id} className="text-sm">
                    <p className="text-[#d6dbe5]">
                      {history.from_status || 'Created'} → {history.to_status}
                    </p>
                    <p className="text-xs text-[#9eacc2] mt-1">
                      by {changedByProfiles[history.changed_by]?.full_name || 'Unknown'} • {new Date(history.created_at).toLocaleString()}
                    </p>
                    {history.note && (
                      <p className="text-xs text-[#7a8799] mt-1 italic">{history.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

