'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  sort_order: number;
  assigned_to: string | null;
}

// Strip HTML helper
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// Sortable ticket item component
function SortableTicketItem({ ticket, assigneeName }: { ticket: Ticket; assigneeName?: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return { bg: 'rgba(239,68,68,0.15)', text: '#f87171' };
      case 'high': return { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' };
      case 'medium': return { bg: 'rgba(94,160,255,0.15)', text: '#5ea0ff' };
      case 'low': return { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
      default: return { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return { bg: 'rgba(239,68,68,0.15)', text: '#f87171' };
      case 'in_progress': return { bg: 'rgba(250,204,21,0.15)', text: '#facc15' };
      case 'blocked': return { bg: 'rgba(239,68,68,0.15)', text: '#f87171' };
      case 'resolved': return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' };
      case 'closed': return { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
      default: return { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
    }
  };

  const priorityColor = getPriorityColor(ticket.priority);
  const statusColor = getStatusColor(ticket.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg p-4 flex items-center gap-4 ${
        isDragging ? 'shadow-lg shadow-[rgba(94,160,255,0.2)] border-[rgba(94,160,255,0.3)]' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-[#7a8799] hover:text-[#d6dbe5] touch-none"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <Link
          href={`/app/tickets/${ticket.id}`}
          className="font-medium text-[#f4f6fb] hover:text-[#5ea0ff] transition block truncate"
        >
          {stripHtml(ticket.title)}
        </Link>
        <p className="text-sm text-[#9eacc2] truncate mt-1">
          {stripHtml(ticket.description) || 'No description'}
        </p>
        {assigneeName && (
          <p className="text-xs text-[#5ea0ff] mt-1">
            Assigned to {assigneeName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
        >
          {ticket.status.replace('_', ' ')}
        </span>
        <span
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ backgroundColor: priorityColor.bg, color: priorityColor.text }}
        >
          {ticket.priority}
        </span>
      </div>
    </div>
  );
}

export default function OrderTicketsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const supabase = createClient();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assigneeProfiles, setAssigneeProfiles] = useState<Record<string, string>>({});
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, [projectId]);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Check permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');
    const isUX = userRoles?.some((ur: any) => ur.roles?.name === 'UX Researcher');

    const { data: projectMember } = await supabase
      .from('project_members')
      .select('member_role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    const isProjectAdmin = projectMember?.member_role === 'admin';
    const isProjectUX = projectMember?.member_role === 'ux';

    setCanEdit(Boolean(isAdmin || isUX || isProjectAdmin || isProjectUX));

    // Get project
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    setProjectName(project?.name || '');

    // Get tickets (not archived, ordered by sort_order)
    const { data: ticketsData } = await supabase
      .from('tickets')
      .select('id, title, description, status, priority, type, sort_order, assigned_to')
      .eq('project_id', projectId)
      .eq('archived', false)
      .order('sort_order', { ascending: true });

    setTickets(ticketsData || []);

    // Get assignee profiles
    const assigneeIds = ticketsData?.map((t: any) => t.assigned_to).filter(Boolean) || [];
    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabase
        .from('users_profile')
        .select('user_id, full_name')
        .in('user_id', assigneeIds);

      if (profiles) {
        const profileMap = profiles.reduce((acc: Record<string, string>, p: any) => {
          acc[p.user_id] = p.full_name;
          return acc;
        }, {});
        setAssigneeProfiles(profileMap);
      }
    }

    setLoading(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTickets((items) => {
        const oldIndex = items.findIndex((t) => t.id === active.id);
        const newIndex = items.findIndex((t) => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  }

  async function saveOrder() {
    setSaving(true);

    try {
      // Update sort_order for all tickets
      const updates = tickets.map((ticket, index) => ({
        id: ticket.id,
        sort_order: (index + 1) * 10, // Use increments of 10 for easy insertion later
      }));

      for (const update of updates) {
        await supabase
          .from('tickets')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save order:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-[#9eacc2]">Loading tickets...</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg p-4 mb-4">
          <p className="text-[#f87171]">You don&apos;t have permission to reorder tickets.</p>
        </div>
        <Link href={`/app/projects/${projectId}`} className="text-[#5ea0ff] hover:text-[#8fc2ff]">
          ← Back to Project
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/app/projects/${projectId}`}
          className="text-[#5ea0ff] hover:text-[#8fc2ff] text-sm mb-4 inline-block"
        >
          ← Back to Project
        </Link>
        <div className="flex items-center justify-between mt-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Order Tickets</h1>
            <p className="text-[#b7c1cf]">
              Drag and drop to reorder tickets for {projectName}
            </p>
          </div>
          {hasChanges && (
            <button
              onClick={saveOrder}
              disabled={saving}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save Order'}
            </button>
          )}
        </div>
      </div>

      {hasChanges && (
        <div className="mb-4 p-3 bg-[rgba(250,204,21,0.1)] border border-[rgba(250,204,21,0.3)] rounded-lg">
          <p className="text-yellow-300 text-sm">
            You have unsaved changes. Click &quot;Save Order&quot; to apply.
          </p>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="text-center py-16 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl">
          <p className="text-[#9eacc2]">No tickets to order</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <SortableTicketItem
                  key={ticket.id}
                  ticket={ticket}
                  assigneeName={ticket.assigned_to ? assigneeProfiles[ticket.assigned_to] : undefined}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="mt-8 p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg">
        <p className="text-sm text-[#7a8799]">
          <strong className="text-[#9eacc2]">Tip:</strong> Tickets at the top will be worked on first.
          Developers will see tickets in this order without seeing priority labels.
        </p>
      </div>
    </div>
  );
}
