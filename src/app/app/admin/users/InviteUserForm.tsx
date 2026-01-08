'use client';

import { useState } from 'react';
import { inviteUser, InviteUserInput } from './actions';
import { UserPlus, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface InviteUserFormProps {
  orgId: string;
  roles: Array<{ id: string; name: string }>;
}

export default function InviteUserForm({ orgId, roles }: InviteUserFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const input: InviteUserInput = {
      email: email.trim(),
      fullName: fullName.trim(),
      roleIds: selectedRoleIds,
    };

    const result = await inviteUser(input, orgId);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      // Reset form
      setEmail('');
      setFullName('');
      setSelectedRoleIds([]);
      // Close modal after a short delay
      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 2000);
    } else {
      setMessage({ type: 'error', text: result.message });
    }

    setIsLoading(false);
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition flex items-center gap-2"
      >
        <UserPlus className="w-5 h-5" />
        Invite User
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0f11] border border-[rgba(255,255,255,0.1)] rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#f7f9ff]">Invite User</h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setMessage(null);
                  setEmail('');
                  setFullName('');
                  setSelectedRoleIds([]);
                }}
                className="text-[#9eacc2] hover:text-[#f7f9ff] transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {message && (
              <div
                className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
                  message.type === 'success'
                    ? 'bg-[rgba(94,160,255,0.15)] border border-[rgba(94,160,255,0.3)]'
                    : 'bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)]'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#5ea0ff] flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm ${message.type === 'success' ? 'text-[#8fc2ff]' : 'text-red-300'}`}>
                  {message.text}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#d6dbe5] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] placeholder-[#9eacc2] focus:outline-none focus:border-[#5ea0ff] transition"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[#d6dbe5] mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] placeholder-[#9eacc2] focus:outline-none focus:border-[#5ea0ff] transition"
                  placeholder="John Doe"
                />
              </div>

              {roles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#d6dbe5] mb-2">
                    Roles (Optional)
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {roles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoleIds.includes(role.id)}
                          onChange={() => toggleRole(role.id)}
                          className="w-4 h-4 text-[#5ea0ff] bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.2)] rounded focus:ring-[#5ea0ff]"
                        />
                        <span className="text-sm text-[#d6dbe5]">{role.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setMessage(null);
                    setEmail('');
                    setFullName('');
                    setSelectedRoleIds([]);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.08)] transition"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

