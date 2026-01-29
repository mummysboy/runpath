'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface TeamMember {
  user_id: string;
  full_name: string;
  member_role: string;
}

interface TicketAssigneeProps {
  ticketId: string;
  projectId: string;
  currentAssigneeId: string | null;
  currentAssigneeName: string | null;
  canEdit: boolean;
}

export default function TicketAssignee({
  ticketId,
  projectId,
  currentAssigneeId,
  currentAssigneeName,
  canEdit,
}: TicketAssigneeProps) {
  const supabase = createClient();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(currentAssigneeId);

  useEffect(() => {
    if (isEditing) {
      fetchProjectMembers();
    }
  }, [isEditing]);

  async function fetchProjectMembers() {
    const { data: projectMembers } = await supabase
      .from('project_members')
      .select('user_id, member_role')
      .eq('project_id', projectId)
      .in('member_role', ['admin', 'dev', 'ux']);

    if (projectMembers && projectMembers.length > 0) {
      const userIds = projectMembers.map((pm) => pm.user_id);

      const { data: profiles } = await supabase
        .from('users_profile')
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (profiles) {
        const membersWithNames = projectMembers.map((pm) => {
          const profile = profiles.find((p) => p.user_id === pm.user_id);
          return {
            user_id: pm.user_id,
            full_name: profile?.full_name || 'Unknown',
            member_role: pm.member_role,
          };
        });
        setMembers(membersWithNames);
      }
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_to: selectedUserId, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error('Failed to update assignee:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!canEdit) {
    return (
      <div>
        <p className="text-[#9eacc2]">Assigned To</p>
        <p className="text-[#f4f6fb] font-medium">
          {currentAssigneeName || 'Unassigned'}
        </p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <p className="text-[#9eacc2] mb-2">Assigned To</p>
        <select
          value={selectedUserId || ''}
          onChange={(e) => setSelectedUserId(e.target.value || null)}
          disabled={loading}
          className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] text-sm focus:outline-none focus:border-[rgba(94,160,255,0.5)] mb-2"
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.full_name} ({member.member_role})
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-1 bg-[rgba(94,160,255,0.15)] border border-[rgba(94,160,255,0.3)] rounded text-[#8fc2ff] text-xs hover:bg-[rgba(94,160,255,0.2)] transition disabled:opacity-50"
          >
            {loading ? '...' : 'Save'}
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setSelectedUserId(currentAssigneeId);
            }}
            disabled={loading}
            className="px-3 py-1 text-[#9eacc2] text-xs hover:text-[#d6dbe5]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[#9eacc2]">Assigned To</p>
      <div className="flex items-center gap-2">
        <p className="text-[#f4f6fb] font-medium">
          {currentAssigneeName || 'Unassigned'}
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-[#5ea0ff] hover:text-[#8fc2ff]"
        >
          Change
        </button>
      </div>
    </div>
  );
}
