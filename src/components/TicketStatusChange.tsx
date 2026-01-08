'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface TicketStatusChangeProps {
  ticket: any;
  userId: string;
}

export default function TicketStatusChange({ ticket, userId }: TicketStatusChangeProps) {
  const supabase = createClient();
  const router = useRouter();
  const [status, setStatus] = useState(ticket.status);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === ticket.status) return;

    setLoading(true);
    try {
      // Update ticket status
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticket.id);

      if (updateError) throw updateError;

      // Create status history entry
      const { error: historyError } = await supabase
        .from('ticket_status_history')
        .insert({
          ticket_id: ticket.id,
          changed_by: userId,
          from_status: ticket.status,
          to_status: status,
          note: note.trim() || null,
        });

      if (historyError) throw historyError;

      // Create audit log entry
      const { error: auditError } = await supabase.from('audit_log').insert({
        org_id: ticket.org_id,
        actor_id: userId,
        action: 'ticket.status_changed',
        entity_type: 'ticket',
        entity_id: ticket.id,
        before: { status: ticket.status },
        after: { status },
      });

      if (auditError) console.error('Audit log error:', auditError);

      setNote('');
      router.refresh();
    } catch (err: any) {
      console.error('Error changing status:', err);
      alert('Failed to change status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
      <h3 className="font-semibold text-[#f4f6fb] mb-4">Change Status</h3>
      <form onSubmit={handleStatusChange} className="space-y-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note about this status change"
          rows={2}
          className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)] text-sm"
        />
        <button
          type="submit"
          disabled={loading || status === ticket.status}
          className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </form>
    </div>
  );
}

