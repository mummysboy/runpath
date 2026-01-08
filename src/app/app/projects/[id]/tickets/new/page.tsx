'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function NewTicketPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    type: 'bug' as 'bug' | 'feature' | 'improvement' | 'question',
    client_visible: true,
  });
  const [evidence, setEvidence] = useState<Array<{ kind: 'link' | 'file'; url: string; label: string }>>([]);
  const [newEvidence, setNewEvidence] = useState({ kind: 'link' as 'link' | 'file', url: '', label: '' });

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

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          org_id: profile.org_id,
          project_id: projectId,
          created_by: user.id,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          type: formData.type,
          client_visible: formData.client_visible,
          status: 'open',
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create evidence links
      if (evidence.length > 0 && ticket) {
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
      if (ticket) {
        await supabase.from('ticket_status_history').insert({
          ticket_id: ticket.id,
          changed_by: user.id,
          from_status: null,
          to_status: 'open',
          note: 'Ticket created',
        });
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
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
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
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
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
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
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
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
            >
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="improvement">Improvement</option>
              <option value="question">Question</option>
            </select>
          </div>
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
                <span className="text-xs px-2 py-1 rounded bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]">
                  {ev.kind}
                </span>
                <span className="flex-1 text-sm text-[#d6dbe5]">{ev.label}</span>
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
            <div className="flex gap-3">
              <select
                value={newEvidence.kind}
                onChange={(e) => setNewEvidence({ ...newEvidence, kind: e.target.value as 'link' | 'file' })}
                className="px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] text-sm focus:outline-none focus:border-[rgba(94,160,255,0.5)]"
              >
                <option value="link">Link</option>
                <option value="file">File</option>
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
                className="px-4 py-2 bg-[rgba(94,160,255,0.15)] border border-[rgba(94,160,255,0.3)] rounded-lg text-[#8fc2ff] text-sm hover:bg-[rgba(94,160,255,0.2)] transition"
              >
                Add
              </button>
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

