'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addProjectMember, removeProjectMember } from './actions';
import { UserPlus, X, Users } from 'lucide-react';

interface User {
  user_id: string;
  full_name: string | null;
  email?: string;
}

interface ProjectMember {
  id: string;
  user_id: string;
  member_role: 'admin' | 'ux' | 'dev' | 'client';
  users_profile: {
    user_id: string;
    full_name: string | null;
  } | null;
}

interface ManageProjectMembersProps {
  projectId: string;
  orgId: string;
  currentMembers: ProjectMember[];
  availableUsers: User[];
}

export default function ManageProjectMembers({
  projectId,
  orgId,
  currentMembers,
  availableUsers,
}: ManageProjectMembersProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'ux' | 'dev' | 'client'>('dev');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter out users who are already members
  const memberUserIds = new Set(currentMembers.map((m) => m.user_id));
  const availableToAdd = availableUsers.filter((u) => !memberUserIds.has(u.user_id));

  const handleAddMember = () => {
    if (!selectedUserId) {
      setMessage({ type: 'error', text: 'Please select a user' });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await addProjectMember({
        project_id: projectId,
        user_id: selectedUserId,
        member_role: selectedRole,
      });

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setSelectedUserId('');
        setIsOpen(false);
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    });
  };

  const handleRemoveMember = (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await removeProjectMember({
        project_id: projectId,
        user_id: userId,
      });

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    });
  };

  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#f4f6fb] flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Members
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-[#5ea0ff] hover:text-[#8fc2ff] flex items-center gap-1"
        >
          <UserPlus className="w-4 h-4" />
          {isOpen ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-green-300'
              : 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {isOpen && (
        <div className="mb-4 p-4 bg-[rgba(255,255,255,0.02)] rounded-lg border border-[rgba(255,255,255,0.05)]">
          <h4 className="text-sm font-medium text-[#f4f6fb] mb-3">Add New Member</h4>
          {availableToAdd.length === 0 ? (
            <p className="text-sm text-[#9eacc2]">All users in your organization are already members of this project.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#9eacc2] mb-1">User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f4f6fb] focus:outline-none focus:border-[#5ea0ff]"
                  disabled={isPending}
                >
                  <option value="">Select a user...</option>
                  {availableToAdd.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.full_name || 'Unknown'} {user.email ? `(${user.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            <div>
              <label className="block text-xs text-[#9eacc2] mb-1">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as typeof selectedRole)}
                className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f4f6fb] focus:outline-none focus:border-[#5ea0ff]"
                disabled={isPending}
              >
                <option value="admin">Admin</option>
                <option value="ux">UX</option>
                <option value="dev">Developer</option>
                <option value="client">Client</option>
              </select>
            </div>
              <button
                onClick={handleAddMember}
                disabled={isPending || !selectedUserId}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {currentMembers.length > 0 ? (
          currentMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-lg border border-[rgba(255,255,255,0.05)]"
            >
              <div className="flex-1">
                <span className="text-sm text-[#d6dbe5]">
                  {member.users_profile?.full_name || 'Unknown'}
                </span>
                <span className="ml-2 text-xs px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] text-[#9eacc2] capitalize">
                  {member.member_role}
                </span>
              </div>
              <button
                onClick={() => handleRemoveMember(member.user_id)}
                disabled={isPending}
                className="p-1 text-[#9eacc2] hover:text-red-400 transition disabled:opacity-50"
                title="Remove member"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#9eacc2] text-center py-4">No members assigned yet</p>
        )}
      </div>
    </div>
  );
}
