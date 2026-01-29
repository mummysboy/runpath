'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TeamMember {
  user_id: string;
  full_name: string;
  member_role: string;
}

interface AssigneeSelectorProps {
  projectId: string;
  selectedUserId: string | null;
  onAssigneeChange: (userId: string | null) => void;
  disabled?: boolean;
}

export default function AssigneeSelector({
  projectId,
  selectedUserId,
  onAssigneeChange,
  disabled,
}: AssigneeSelectorProps) {
  const supabase = createClient();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectMembers();
  }, [projectId]);

  async function fetchProjectMembers() {
    // Get project members who can be assigned (dev, admin, ux - not clients)
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
    setLoading(false);
  }

  if (loading) {
    return (
      <select
        disabled
        className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#7a8799]"
      >
        <option>Loading...</option>
      </select>
    );
  }

  return (
    <select
      value={selectedUserId || ''}
      onChange={(e) => onAssigneeChange(e.target.value || null)}
      disabled={disabled}
      className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)] disabled:opacity-50"
    >
      <option value="">Unassigned</option>
      {members.map((member) => (
        <option key={member.user_id} value={member.user_id}>
          {member.full_name} ({member.member_role})
        </option>
      ))}
    </select>
  );
}
