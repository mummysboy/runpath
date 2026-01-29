'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  assigned_to: string | null;
  due_date: string | null;
  project_id: string;
  projects?: {
    name: string;
  };
}

interface AssigneeProfile {
  user_id: string;
  full_name: string;
}

const STATUSES = [
  { key: 'open', label: 'Open', color: '#5ea0ff' },
  { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { key: 'blocked', label: 'Blocked', color: '#ef4444' },
  { key: 'resolved', label: 'Resolved', color: '#10b981' },
  { key: 'closed', label: 'Closed', color: '#6b7280' },
];

export default function KanbanBoardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assigneeProfiles, setAssigneeProfiles] = useState<Record<string, AssigneeProfile>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [canChangeStatus, setCanChangeStatus] = useState(false);

  useEffect(() => {
    fetchTickets();
    checkPermissions();
  }, []);

  async function checkPermissions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');
    const isDev = userRoles?.some((ur: any) => ur.roles?.name === 'Developer');

    setCanChangeStatus(Boolean(isAdmin || isDev));
  }

  async function fetchTickets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      router.push('/login');
      return;
    }

    const { data: ticketsData } = await supabase
      .from('tickets')
      .select('*, projects(name)')
      .eq('org_id', profile.org_id)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    setTickets(ticketsData || []);

    // Get assignee profiles
    const assigneeIds = ticketsData?.map((t: any) => t.assigned_to).filter(Boolean) || [];
    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabase
        .from('users_profile')
        .select('user_id, full_name')
        .in('user_id', assigneeIds);

      if (profiles) {
        const profileMap = profiles.reduce((acc: Record<string, AssigneeProfile>, p: any) => {
          acc[p.user_id] = p;
          return acc;
        }, {});
        setAssigneeProfiles(profileMap);
      }
    }

    setLoading(false);
  }

  async function moveTicket(ticketId: string, newStatus: string) {
    if (!canChangeStatus) return;

    setUpdating(ticketId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket || ticket.status === newStatus) {
        setUpdating(null);
        return;
      }

      // Update ticket status
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;

      // Create status history entry
      await supabase.from('ticket_status_history').insert({
        ticket_id: ticketId,
        changed_by: user.id,
        from_status: ticket.status,
        to_status: newStatus,
        note: 'Status changed via Kanban board',
      });

      // Update local state
      setTickets(tickets.map(t =>
        t.id === ticketId ? { ...t, status: newStatus } : t
      ));
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(null);
    }
  }

  function getTicketsByStatus(status: string) {
    return tickets.filter(t => t.status === status);
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#5ea0ff';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-[#9eacc2]">Loading board...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Kanban Board</h1>
          <p className="text-[#b7c1cf]">Drag-free board view - click status buttons to move tickets</p>
        </div>
        <Link
          href="/app/tickets"
          className="px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.08)] transition"
        >
          List View
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map(status => (
          <div
            key={status.key}
            className="flex-shrink-0 w-72 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl"
          >
            {/* Column Header */}
            <div
              className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] rounded-t-xl"
              style={{ backgroundColor: `${status.color}15` }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold" style={{ color: status.color }}>
                  {status.label}
                </h3>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${status.color}25`, color: status.color }}
                >
                  {getTicketsByStatus(status.key).length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="p-3 space-y-3 min-h-[400px] max-h-[calc(100vh-280px)] overflow-y-auto">
              {getTicketsByStatus(status.key).map(ticket => (
                <div
                  key={ticket.id}
                  className={`bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg p-3 ${
                    updating === ticket.id ? 'opacity-50' : ''
                  }`}
                >
                  <Link
                    href={`/app/tickets/${ticket.id}`}
                    className="block font-medium text-[#f4f6fb] text-sm mb-2 hover:text-[#5ea0ff] transition line-clamp-2"
                  >
                    {ticket.title}
                  </Link>

                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${getPriorityColor(ticket.priority)}20`,
                        color: getPriorityColor(ticket.priority),
                      }}
                    >
                      {ticket.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-[rgba(255,255,255,0.05)] text-[#9eacc2]">
                      {ticket.type}
                    </span>
                  </div>

                  <p className="text-xs text-[#7a8799] mb-2">
                    {ticket.projects?.name}
                    {ticket.assigned_to && assigneeProfiles[ticket.assigned_to] && (
                      <span className="text-[#5ea0ff]">
                        {' '}• {assigneeProfiles[ticket.assigned_to].full_name}
                      </span>
                    )}
                  </p>

                  {ticket.due_date && (
                    <p className={`text-xs mb-2 ${
                      new Date(ticket.due_date) < new Date() && ticket.status !== 'closed' && ticket.status !== 'resolved'
                        ? 'text-[#f87171]'
                        : 'text-[#9eacc2]'
                    }`}>
                      Due: {new Date(ticket.due_date).toLocaleDateString()}
                    </p>
                  )}

                  {/* Status change buttons */}
                  {canChangeStatus && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                      {STATUSES.filter(s => s.key !== ticket.status).map(s => (
                        <button
                          key={s.key}
                          onClick={() => moveTicket(ticket.id, s.key)}
                          disabled={updating === ticket.id}
                          className="px-2 py-1 text-xs rounded transition hover:opacity-80 disabled:opacity-50"
                          style={{
                            backgroundColor: `${s.color}15`,
                            color: s.color,
                          }}
                        >
                          → {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {getTicketsByStatus(status.key).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[#7a8799] text-sm">No tickets</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
