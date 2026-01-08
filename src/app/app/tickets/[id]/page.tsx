import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import TicketComments from '@/components/TicketComments';
import TicketStatusChange from '@/components/TicketStatusChange';

export default async function TicketDetailPage({
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
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Get ticket
  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, projects(*, clients(*)), created_by_profile:users_profile!created_by(*)')
    .eq('id', params.id)
    .single();

  if (!ticket || ticket.org_id !== profile.org_id) {
    notFound();
  }

  // Check access
  const { data: projectMember } = await supabase
    .from('project_members')
    .select('member_role')
    .eq('project_id', ticket.project_id)
    .eq('user_id', user.id)
    .single();

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, roles(*)')
    .eq('user_id', user.id);
  const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');
  const isClient = projectMember?.member_role === 'client';

  // Clients can only see client-visible tickets
  if (isClient && !ticket.client_visible && !isAdmin) {
    redirect('/app/projects');
  }

  // Get evidence
  const { data: evidence } = await supabase
    .from('ticket_evidence')
    .select('*')
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: false });

  // Get status history
  const { data: statusHistory } = await supabase
    .from('ticket_status_history')
    .select('*, changed_by_profile:users_profile!changed_by(*)')
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: false });

  const canChangeStatus = isAdmin || projectMember?.member_role === 'dev' || projectMember?.member_role === 'admin';

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
            <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">{ticket.title}</h1>
            <p className="text-[#b7c1cf]">
              Project: {ticket.projects?.name} • Created by {ticket.created_by_profile?.full_name || 'Unknown'}
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]">
              {ticket.status}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-[rgba(255,255,255,0.05)] text-[#9eacc2]">
              {ticket.priority}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-[rgba(255,255,255,0.05)] text-[#9eacc2]">
              {ticket.type}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#f4f6fb]">Description</h2>
            <p className="text-[#d6dbe5] whitespace-pre-wrap">{ticket.description || 'No description provided.'}</p>
          </div>

          {evidence && evidence.length > 0 && (
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-[#f4f6fb]">Evidence</h2>
              <div className="space-y-3">
                {evidence.map((ev: any) => (
                  <div key={ev.id} className="flex items-center gap-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
                    <span className="text-xs px-2 py-1 rounded bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]">
                      {ev.kind}
                    </span>
                    <span className="flex-1 text-sm text-[#d6dbe5]">{ev.label || ev.url}</span>
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#5ea0ff] hover:text-[#8fc2ff]"
                    >
                      Open →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <TicketComments ticketId={params.id} userId={user.id} isClient={isClient || false} />
        </div>

        <div className="space-y-6">
          {canChangeStatus && (
            <TicketStatusChange ticket={ticket} userId={user.id} />
          )}

          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
            <h3 className="font-semibold text-[#f4f6fb] mb-4">Ticket Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#9eacc2]">Status</p>
                <p className="text-[#f4f6fb] font-medium">{ticket.status}</p>
              </div>
              <div>
                <p className="text-[#9eacc2]">Priority</p>
                <p className="text-[#f4f6fb] font-medium">{ticket.priority}</p>
              </div>
              <div>
                <p className="text-[#9eacc2]">Type</p>
                <p className="text-[#f4f6fb] font-medium">{ticket.type}</p>
              </div>
              <div>
                <p className="text-[#9eacc2]">Client Visible</p>
                <p className="text-[#f4f6fb] font-medium">{ticket.client_visible ? 'Yes' : 'No'}</p>
              </div>
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
                      by {history.changed_by_profile?.full_name || 'Unknown'} • {new Date(history.created_at).toLocaleString()}
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

