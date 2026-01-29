'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import TicketTagSelector from '@/components/TicketTagSelector';
import AssigneeSelector from '@/components/AssigneeSelector';

// Strip HTML tags and decode entities for plain text editing
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export default function EditTicketPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [canEdit, setCanEdit] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    type: 'bug' as 'bug' | 'feature' | 'improvement' | 'question',
    client_visible: true,
    due_date: '',
  });
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  async function fetchTicket() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*, projects(*)')
        .eq('id', ticketId)
        .single();

      if (ticketError || !ticketData) {
        setError('Ticket not found');
        setLoading(false);
        return;
      }

      setTicket(ticketData);

      // Check user permissions
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('*, roles(*)')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');
      const isUX = userRoles?.some((ur: any) => ur.roles?.name === 'UX Researcher');

      const { data: projectMember } = await supabase
        .from('project_members')
        .select('member_role')
        .eq('project_id', ticketData.project_id)
        .eq('user_id', user.id)
        .single();

      const isProjectAdmin = projectMember?.member_role === 'admin';
      const isProjectUX = projectMember?.member_role === 'ux';
      const isCreator = ticketData.created_by === user.id;

      // Can edit if admin, UX, project admin, project UX, or creator
      const hasEditPermission = isAdmin || isUX || isProjectAdmin || isProjectUX || isCreator;
      setCanEdit(hasEditPermission);

      if (!hasEditPermission) {
        setError('You do not have permission to edit this ticket');
        setLoading(false);
        return;
      }

      // Set form data - strip HTML from title/description for plain text editing
      setFormData({
        title: stripHtml(ticketData.title || ''),
        description: stripHtml(ticketData.description || ''),
        priority: ticketData.priority || 'medium',
        type: ticketData.type || 'bug',
        client_visible: ticketData.client_visible ?? true,
        due_date: ticketData.due_date || '',
      });
      setAssignedTo(ticketData.assigned_to || null);

      // Get current tags
      const { data: tagAssignments } = await supabase
        .from('ticket_tag_assignments')
        .select('tag_id')
        .eq('ticket_id', ticketId);

      if (tagAssignments) {
        setSelectedTags(tagAssignments.map((ta: any) => ta.tag_id));
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket');
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Update ticket
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          type: formData.type,
          client_visible: formData.client_visible,
          due_date: formData.due_date || null,
          assigned_to: assignedTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      // Update tags - delete existing and insert new
      await supabase
        .from('ticket_tag_assignments')
        .delete()
        .eq('ticket_id', ticketId);

      if (selectedTags.length > 0) {
        const tagAssignments = selectedTags.map(tagId => ({
          ticket_id: ticketId,
          tag_id: tagId,
        }));
        await supabase.from('ticket_tag_assignments').insert(tagAssignments);
      }

      router.push(`/app/tickets/${ticketId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-[#9eacc2]">Loading ticket...</p>
      </div>
    );
  }

  if (error && !canEdit) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg p-4 mb-4">
          <p className="text-[#f87171]">{error}</p>
        </div>
        <Link href={`/app/tickets/${ticketId}`} className="text-[#5ea0ff] hover:text-[#8fc2ff]">
          ← Back to Ticket
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/app/tickets/${ticketId}`}
          className="text-[#5ea0ff] hover:text-[#8fc2ff] text-sm mb-4 inline-block"
        >
          ← Back to Ticket
        </Link>
        <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Edit Ticket</h1>
        <p className="text-[#b7c1cf]">Update ticket details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg p-4">
            <p className="text-[#f87171] text-sm">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2 text-[#d6dbe5]">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            disabled={saving}
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)] disabled:opacity-50"
            placeholder="Brief description of the ticket"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2 text-[#d6dbe5]">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={6}
            disabled={saving}
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)] disabled:opacity-50"
            placeholder="Detailed description of the issue or request"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="priority" className="block text-sm font-medium mb-2 text-[#d6dbe5]">
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              disabled={saving}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)] disabled:opacity-50"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-2 text-[#d6dbe5]">
              Type
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              disabled={saving}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)] disabled:opacity-50"
            >
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="improvement">Improvement</option>
              <option value="question">Question</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium mb-2 text-[#d6dbe5]">
              Due Date (Optional)
            </label>
            <input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              disabled={saving}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)] [color-scheme:dark] disabled:opacity-50"
            />
          </div>

          {ticket && (
            <div>
              <label className="block text-sm font-medium mb-2 text-[#d6dbe5]">
                Assign To (Optional)
              </label>
              <AssigneeSelector
                projectId={ticket.project_id}
                selectedUserId={assignedTo}
                onAssigneeChange={setAssignedTo}
                disabled={saving}
              />
            </div>
          )}
        </div>

        {ticket && (
          <div>
            <label className="block text-sm font-medium mb-2 text-[#d6dbe5]">
              Tags (Optional)
            </label>
            <TicketTagSelector
              projectId={ticket.project_id}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              disabled={saving}
            />
          </div>
        )}

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.client_visible}
              onChange={(e) => setFormData({ ...formData, client_visible: e.target.checked })}
              disabled={saving}
              className="w-4 h-4 accent-[#5ea0ff] cursor-pointer"
            />
            <span className="text-sm text-[#d6dbe5]">Make visible to client</span>
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href={`/app/tickets/${ticketId}`}
            className="px-6 py-3 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.08)] transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
