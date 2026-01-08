'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createProject, CreateProjectInput, ProjectMemberInput } from './actions';
import { X, CheckCircle2, AlertCircle, UserPlus, XCircle } from 'lucide-react';

interface User {
  user_id: string;
  full_name: string | null;
  email?: string;
}

interface CreateProjectFormProps {
  orgId: string;
  clients: Array<{ id: string; name: string }>;
  userId: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showButton?: boolean;
  defaultClientId?: string;
  users?: User[];
}

export default function CreateProjectForm({ 
  orgId, 
  clients,
  userId,
  onSuccess,
  open: controlledOpen,
  onOpenChange,
  showButton = true,
  defaultClientId,
  users = [],
}: CreateProjectFormProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled open if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState<'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'>('planning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Array<ProjectMemberInput>>([]);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'ux' | 'dev' | 'client'>('dev');

  // Set default client ID when form opens or defaultClientId changes
  useEffect(() => {
    if (isOpen && defaultClientId) {
      setClientId(defaultClientId);
    }
  }, [isOpen, defaultClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!clientId) {
      setMessage({ type: 'error', text: 'Please select a client' });
      setIsLoading(false);
      return;
    }

    const input: CreateProjectInput = {
      name: name.trim(),
      client_id: clientId,
      status: status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      members: selectedMembers.length > 0 ? selectedMembers : undefined,
    };

    const result = await createProject(input, orgId, userId);

    if (result.success) {
      // Store clientId before any state updates
      const createdClientId = clientId;
      
      if (onSuccess) {
        // If onSuccess callback is provided, use it
        setMessage({ type: 'success', text: result.message });
        setName('');
        setClientId(defaultClientId || '');
        setStatus('planning');
        setStartDate('');
        setEndDate('');
        setSelectedMembers([]);
        setNewMemberUserId('');
        setNewMemberRole('dev');
        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
          onSuccess();
        }, 500);
      } else {
        // Redirect to the client detail page showing projects for this client
        if (!createdClientId) {
          console.error('[CreateProjectForm] No clientId available for redirect. clientId value:', clientId);
          setMessage({ type: 'error', text: 'Client ID is missing' });
          setIsLoading(false);
          return;
        }
        
        const redirectUrl = `/app/admin/clients/${createdClientId}`;
        console.log('[CreateProjectForm] Project created successfully. Redirecting to:', redirectUrl);
        console.log('[CreateProjectForm] createdClientId:', createdClientId);
        console.log('[CreateProjectForm] Full redirect URL:', redirectUrl);
        
        // Reset form state
        setName('');
        setClientId('');
        setStatus('planning');
        setStartDate('');
        setEndDate('');
        setSelectedMembers([]);
        setNewMemberUserId('');
        setNewMemberRole('dev');
        setIsOpen(false);
        
        // Use window.location for a hard redirect to ensure it works
        // This will completely replace the current page
        window.location.href = redirectUrl;
      }
    } else {
      setMessage({ type: 'error', text: result.message });
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage(null);
    setName('');
    setClientId(defaultClientId || '');
    setStatus('planning');
    setStartDate('');
    setEndDate('');
    setSelectedMembers([]);
    setNewMemberUserId('');
    setNewMemberRole('dev');
  };

  const handleAddMember = () => {
    if (!newMemberUserId) {
      return;
    }

    // Check if user is already added
    if (selectedMembers.some(m => m.user_id === newMemberUserId)) {
      setMessage({ type: 'error', text: 'User is already added to the project' });
      return;
    }

    setSelectedMembers([...selectedMembers, {
      user_id: newMemberUserId,
      member_role: newMemberRole,
    }]);
    setNewMemberUserId('');
    setNewMemberRole('dev');
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.user_id !== userId));
  };

  // Get available users (not already selected)
  const selectedUserIds = new Set(selectedMembers.map(m => m.user_id));
  const availableUsers = users.filter(u => !selectedUserIds.has(u.user_id));

  return (
    <>
      {showButton && (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition flex items-center gap-2"
        >
          New Project
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0f11] border border-[rgba(255,255,255,0.1)] rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#f7f9ff]">Create New Project</h2>
              <button
                onClick={handleClose}
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
                <label htmlFor="client" className="block text-sm font-medium text-[#d6dbe5] mb-2">
                  Client <span className="text-red-400">*</span>
                </label>
                <select
                  id="client"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  disabled={!!defaultClientId}
                  className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] focus:outline-none focus:border-[#5ea0ff] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id} className="bg-[#0d0f11]">
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#d6dbe5] mb-2">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] placeholder-[#9eacc2] focus:outline-none focus:border-[#5ea0ff] transition"
                  placeholder="Website Redesign"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-[#d6dbe5] mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] focus:outline-none focus:border-[#5ea0ff] transition"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-[#d6dbe5] mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] focus:outline-none focus:border-[#5ea0ff] transition"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-[#d6dbe5] mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] focus:outline-none focus:border-[#5ea0ff] transition"
                  />
                </div>
              </div>

              {users.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#d6dbe5] mb-2">
                    Team Members (Optional)
                  </label>
                  <div className="space-y-3">
                    {selectedMembers.length > 0 && (
                      <div className="space-y-2">
                        {selectedMembers.map((member) => {
                          const user = users.find(u => u.user_id === member.user_id);
                          return (
                            <div
                              key={member.user_id}
                              className="flex items-center justify-between p-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[#f7f9ff]">
                                  {user?.full_name || 'Unknown'}
                                  {user?.email && <span className="text-[#9eacc2] ml-2">({user.email})</span>}
                                </span>
                                <span className="text-xs px-2 py-1 rounded bg-[rgba(94,160,255,0.15)] text-[#8fc2ff] capitalize">
                                  {member.member_role}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(member.user_id)}
                                className="text-[#9eacc2] hover:text-red-400 transition"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <select
                        value={newMemberUserId}
                        onChange={(e) => setNewMemberUserId(e.target.value)}
                        className="flex-1 px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] focus:outline-none focus:border-[#5ea0ff] transition"
                      >
                        <option value="">Select a user...</option>
                        {availableUsers.map((user) => (
                          <option key={user.user_id} value={user.user_id} className="bg-[#0d0f11]">
                            {user.full_name || 'Unknown'} {user.email ? `(${user.email})` : ''}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as typeof newMemberRole)}
                        className="px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] focus:outline-none focus:border-[#5ea0ff] transition"
                      >
                        <option value="admin">Admin</option>
                        <option value="ux">UX</option>
                        <option value="dev">Developer</option>
                        <option value="client">Client</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddMember}
                        disabled={!newMemberUserId}
                        className="px-4 py-2 rounded-lg bg-[rgba(94,160,255,0.15)] border border-[rgba(94,160,255,0.3)] text-[#8fc2ff] hover:bg-[rgba(94,160,255,0.25)] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
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
                  {isLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

