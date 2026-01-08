'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, CreateClientInput } from './actions';
import { Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreateClientFormProps {
  orgId: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showButton?: boolean;
}

export default function CreateClientForm({ 
  orgId, 
  onSuccess,
  open: controlledOpen,
  onOpenChange,
  showButton = true,
}: CreateClientFormProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled open if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [billingType, setBillingType] = useState<'hourly' | 'fixed' | 'retainer' | 'custom'>('hourly');
  const [status, setStatus] = useState<'active' | 'inactive' | 'prospect'>('active');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const input: CreateClientInput = {
      name: name.trim(),
      billing_type: billingType,
      status: status,
    };

    const result = await createClient(input, orgId);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      // Reset form
      setName('');
      setBillingType('hourly');
      setStatus('active');
      // Close modal after a short delay and refresh
      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      }, 1500);
    } else {
      setMessage({ type: 'error', text: result.message });
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage(null);
    setName('');
    setBillingType('hourly');
    setStatus('active');
  };

  return (
    <>
      {showButton && (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          + New Client
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0f11] border border-[rgba(255,255,255,0.1)] rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#f7f9ff]">Create New Client</h2>
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
                <label htmlFor="name" className="block text-sm font-medium text-[#d6dbe5] mb-2">
                  Client Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] placeholder-[#9eacc2] focus:outline-none focus:border-[#5ea0ff] transition"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label htmlFor="billingType" className="block text-sm font-medium text-[#d6dbe5] mb-2">
                  Billing Type
                </label>
                <select
                  id="billingType"
                  value={billingType}
                  onChange={(e) => setBillingType(e.target.value as typeof billingType)}
                  className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] focus:outline-none focus:border-[#5ea0ff] transition"
                >
                  <option value="hourly">Hourly</option>
                  <option value="fixed">Fixed</option>
                  <option value="retainer">Retainer</option>
                  <option value="custom">Custom</option>
                </select>
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="prospect">Prospect</option>
                </select>
              </div>

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
                  {isLoading ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

