'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import RichTextEditor from '@/components/RichTextEditor';
import TicketTagSelector from '@/components/TicketTagSelector';
import AssigneeSelector from '@/components/AssigneeSelector';

export default function NewTicketPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdminOrUX, setIsAdminOrUX] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    type: 'bug' as 'bug' | 'feature' | 'improvement' | 'question',
    client_visible: true,
    due_date: '',
  });
  const [titleHtml, setTitleHtml] = useState('');
  const [titleFormatting, setTitleFormatting] = useState<any>({});
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [descriptionFormatting, setDescriptionFormatting] = useState<any>({});
  const [evidence, setEvidence] = useState<Array<{ kind: 'link' | 'file'; url: string; label: string }>>([]);
  const [newEvidence, setNewEvidence] = useState({ kind: 'link' as 'link' | 'file', url: '', label: '' });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [assignedTo, setAssignedTo] = useState<string | null>(null);

  // Check if user is admin or UX writer
  useEffect(() => {
    async function checkUserRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Check user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('*, roles(*)')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');
      const isUX = userRoles?.some((ur: any) => ur.roles?.name === 'UX Researcher');

      // Also check project member role
      const { data: projectMember } = await supabase
        .from('project_members')
        .select('member_role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      const isProjectAdmin = projectMember?.member_role === 'admin';
      const isProjectUX = projectMember?.member_role === 'ux';

      setIsAdminOrUX(isAdmin || isUX || isProjectAdmin || isProjectUX);
    }

    checkUserRole();
  }, [projectId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data: profile } = await supabase
        .from('users_profile')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Prepare formatting data (only if admin or UX)
      // For admins/UX: use HTML content, for others: use plain text
      const finalTitle = isAdminOrUX && titleHtml ? titleHtml : formData.title;
      const finalDescription = isAdminOrUX && descriptionHtml ? descriptionHtml : formData.description;
      const titleFormattingData = isAdminOrUX ? titleFormatting : {};
      const descriptionFormattingData = isAdminOrUX ? descriptionFormatting : {};

      // Build insert object - only include formatting fields if they have content
      const insertData: any = {
        org_id: profile.org_id,
        project_id: projectId,
        created_by: user.id,
        title: finalTitle,
        description: finalDescription,
        priority: formData.priority,
        type: formData.type,
        client_visible: formData.client_visible,
        status: 'open',
        archived: false, // Explicitly set archived to false
        due_date: formData.due_date || null, // Optional due date
        assigned_to: assignedTo, // Optional assignee
      };

      // Only add formatting fields if they have values (and columns exist)
      // This prevents errors if migration hasn't been run yet
      if (isAdminOrUX && (Object.keys(titleFormattingData).length > 0 || Object.keys(descriptionFormattingData).length > 0)) {
        // Try to include formatting, but catch error if columns don't exist
        insertData.title_formatting = titleFormattingData;
        insertData.description_formatting = descriptionFormattingData;
      }

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert(insertData)
        .select('id, org_id, project_id, created_by, title, description, priority, status, type, client_visible, archived, created_at, updated_at')
        .single();

      if (ticketError) {
        // If error is about missing columns, try again without formatting fields
        if (ticketError.message?.includes('description_formatting') || ticketError.message?.includes('title_formatting')) {
          delete insertData.title_formatting;
          delete insertData.description_formatting;
          const { data: retryTicket, error: retryError } = await supabase
            .from('tickets')
            .insert(insertData)
            .select('id, org_id, project_id, created_by, title, description, priority, status, type, client_visible, archived, created_at, updated_at')
            .single();
          if (retryError) throw retryError;
          if (!retryTicket) throw new Error('Failed to create ticket');
          // Use retryTicket for the rest
          const finalTicket = retryTicket;
          
          // Create evidence links
          if (evidence.length > 0) {
            const evidenceData = evidence.map((ev) => ({
              ticket_id: finalTicket.id,
              kind: ev.kind,
              url: ev.url,
              label: ev.label,
            }));

            const { error: evidenceError } = await supabase
              .from('ticket_evidence')
              .insert(evidenceData);

            if (evidenceError) throw evidenceError;
          }

          // Create initial status history
          await supabase.from('ticket_status_history').insert({
            ticket_id: finalTicket.id,
            changed_by: user.id,
            from_status: null,
            to_status: 'open',
            note: 'Ticket created',
          });

          // Assign tags to ticket
          if (selectedTags.length > 0) {
            const tagAssignments = selectedTags.map(tagId => ({
              ticket_id: finalTicket.id,
              tag_id: tagId,
            }));
            await supabase.from('ticket_tag_assignments').insert(tagAssignments);
          }

          router.push(`/app/tickets/${finalTicket.id}`);
          return;
        }
        throw ticketError;
      }

      if (!ticket) {
        throw new Error('Failed to create ticket');
      }

      // Create evidence links
      if (evidence.length > 0) {
        const evidenceData = evidence.map((ev) => ({
          ticket_id: ticket.id,
          kind: ev.kind,
          url: ev.url,
          label: ev.label,
        }));

        const { error: evidenceError } = await supabase
          .from('ticket_evidence')
          .insert(evidenceData);

        if (evidenceError) throw evidenceError;
      }

      // Create initial status history
      await supabase.from('ticket_status_history').insert({
        ticket_id: ticket.id,
        changed_by: user.id,
        from_status: null,
        to_status: 'open',
        note: 'Ticket created',
      });

      // Assign tags to ticket
      if (selectedTags.length > 0) {
        const tagAssignments = selectedTags.map(tagId => ({
          ticket_id: ticket.id,
          tag_id: tagId,
        }));
        await supabase.from('ticket_tag_assignments').insert(tagAssignments);
      }

      router.push(`/app/tickets/${ticket.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const addEvidence = () => {
    if (newEvidence.url && newEvidence.label) {
      setEvidence([...evidence, newEvidence]);
      setNewEvidence({ kind: 'link', url: '', label: '' });
    }
  };

  const handleImageUpload = (url: string, fileName: string) => {
    setEvidence([...evidence, {
      kind: 'file',
      url: url,
      label: fileName,
    }]);
  };

  const removeEvidence = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/app/projects/${projectId}`}
          className="text-[#5ea0ff] hover:text-[#8fc2ff] text-sm mb-4 inline-block"
        >
          ← Back to Project
        </Link>
        <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Create New Ticket</h1>
        <p className="text-[#b7c1cf]">Report an issue or request a feature</p>
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
          {isAdminOrUX ? (
            <RichTextEditor
              value={titleHtml}
              onChange={(html, formatting) => {
                setTitleHtml(html);
                setTitleFormatting(formatting);
                // Also update formData for validation
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                setFormData({ ...formData, title: tempDiv.textContent || '' });
              }}
              placeholder="Brief description of the ticket"
              disabled={loading}
            />
          ) : (
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
              placeholder="Brief description of the ticket"
            />
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2 text-[#d6dbe5]">
            Description
          </label>
          {isAdminOrUX ? (
            <RichTextEditor
              value={descriptionHtml}
              onChange={(html, formatting) => {
                setDescriptionHtml(html);
                setDescriptionFormatting(formatting);
                // Also update formData
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                setFormData({ ...formData, description: tempDiv.textContent || '' });
              }}
              placeholder="Detailed description of the issue or request"
              disabled={loading}
            />
          ) : (
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
              placeholder="Detailed description of the issue or request"
            />
          )}
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
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
            >
              {isAdminOrUX ? (
                <>
                  <option value="high">High</option>
                  <option value="medium">Med</option>
                  <option value="low">Low</option>
                </>
              ) : (
                <>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </>
              )}
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
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
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
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)] [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#d6dbe5]">
              Assign To (Optional)
            </label>
            <AssigneeSelector
              projectId={projectId}
              selectedUserId={assignedTo}
              onAssigneeChange={setAssignedTo}
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[#d6dbe5]">
            Tags (Optional)
          </label>
          <TicketTagSelector
            projectId={projectId}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            disabled={loading}
          />
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.client_visible}
              onChange={(e) => setFormData({ ...formData, client_visible: e.target.checked })}
              className="w-4 h-4 accent-[#5ea0ff] cursor-pointer"
            />
            <span className="text-sm text-[#d6dbe5]">Make visible to client</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[#d6dbe5]">Evidence / Links</label>
          <div className="space-y-3">
            {evidence.map((ev, index) => (
              <div key={index} className="flex items-center gap-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
                {ev.kind === 'file' && ev.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={ev.url}
                      alt={ev.label}
                      className="w-16 h-16 object-cover rounded border border-[rgba(255,255,255,0.1)]"
                    />
                    <div className="flex-1">
                      <span className="text-xs px-2 py-1 rounded bg-[rgba(94,160,255,0.15)] text-[#8fc2ff] mb-1 inline-block">
                        Image
                      </span>
                      <p className="text-sm text-[#d6dbe5] mt-1">{ev.label}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-xs px-2 py-1 rounded bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]">
                      {ev.kind}
                    </span>
                    <span className="flex-1 text-sm text-[#d6dbe5]">{ev.label}</span>
                  </>
                )}
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#5ea0ff] hover:text-[#8fc2ff]"
                >
                  View
                </a>
                <button
                  type="button"
                  onClick={() => removeEvidence(index)}
                  className="text-[#f87171] hover:text-[#fb8585]"
                >
                  Remove
                </button>
              </div>
            ))}
            
            <div className="space-y-3">
              <ImageUpload
                onUploadComplete={handleImageUpload}
                disabled={loading}
              />
              
              <div className="flex gap-3">
                <select
                  value={newEvidence.kind}
                  onChange={(e) => setNewEvidence({ ...newEvidence, kind: e.target.value as 'link' | 'file' })}
                  className="px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] text-sm focus:outline-none focus:border-[rgba(94,160,255,0.5)]"
                >
                  <option value="link">Link</option>
                  <option value="file">File URL</option>
                </select>
                <input
                  type="text"
                  value={newEvidence.label}
                  onChange={(e) => setNewEvidence({ ...newEvidence, label: e.target.value })}
                  placeholder="Label"
                  className="flex-1 px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] text-sm focus:outline-none focus:border-[rgba(94,160,255,0.5)]"
                />
                <input
                  type="url"
                  value={newEvidence.url}
                  onChange={(e) => setNewEvidence({ ...newEvidence, url: e.target.value })}
                  placeholder="URL"
                  className="flex-1 px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] text-sm focus:outline-none focus:border-[rgba(94,160,255,0.5)]"
                />
                <button
                  type="button"
                  onClick={addEvidence}
                  disabled={loading}
                  className="px-4 py-2 bg-[rgba(94,160,255,0.15)] border border-[rgba(94,160,255,0.3)] rounded-lg text-[#8fc2ff] text-sm hover:bg-[rgba(94,160,255,0.2)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Creating...' : 'Create Ticket'}
          </button>
          <Link
            href={`/app/projects/${projectId}`}
            className="px-6 py-3 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.08)] transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

