'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ImageUpload from './ImageUpload';
import { X, Plus } from 'lucide-react';

interface AddTicketEvidenceProps {
  ticketId: string;
  onSuccess?: () => void;
}

export default function AddTicketEvidence({ ticketId, onSuccess }: AddTicketEvidenceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Array<{ kind: 'link' | 'file'; url: string; label: string }>>([]);
  const [newEvidence, setNewEvidence] = useState({ kind: 'link' as 'link' | 'file', url: '', label: '' });

  const supabase = createClient();

  const handleImageUpload = (url: string, fileName: string) => {
    setEvidence([...evidence, {
      kind: 'file',
      url: url,
      label: fileName,
    }]);
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

  const handleSubmit = async () => {
    if (evidence.length === 0) {
      setError('Please add at least one piece of evidence');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const evidenceData = evidence.map((ev) => ({
        ticket_id: ticketId,
        kind: ev.kind,
        url: ev.url,
        label: ev.label,
      }));

      const { error: evidenceError } = await supabase
        .from('ticket_evidence')
        .insert(evidenceData);

      if (evidenceError) throw evidenceError;

      // Reset form
      setEvidence([]);
      setNewEvidence({ kind: 'link', url: '', label: '' });
      setIsOpen(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add evidence');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEvidence([]);
    setNewEvidence({ kind: 'link', url: '', label: '' });
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-[#5ea0ff] hover:text-[#8fc2ff] flex items-center gap-1"
      >
        <Plus className="w-4 h-4" />
        Add Evidence
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0f11] border border-[rgba(255,255,255,0.1)] rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#f7f9ff]">Add Evidence</h2>
              <button
                onClick={handleClose}
                className="text-[#9eacc2] hover:text-[#f7f9ff] transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 rounded-lg bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)]">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#d6dbe5]">Upload Image</label>
                <ImageUpload
                  onUploadComplete={handleImageUpload}
                  ticketId={ticketId}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#d6dbe5]">Or Add Link</label>
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
                      <button
                        type="button"
                        onClick={() => removeEvidence(index)}
                        className="text-[#f87171] hover:text-[#fb8585]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex gap-3">
                    <select
                      value={newEvidence.kind}
                      onChange={(e) => setNewEvidence({ ...newEvidence, kind: e.target.value as 'link' | 'file' })}
                      className="px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] text-sm focus:outline-none focus:border-[rgba(94,160,255,0.5)]"
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                    <input
                      type="url"
                      value={newEvidence.url}
                      onChange={(e) => setNewEvidence({ ...newEvidence, url: e.target.value })}
                      placeholder="URL"
                      className="flex-1 px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] text-sm focus:outline-none focus:border-[rgba(94,160,255,0.5)]"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={addEvidence}
                      disabled={isSubmitting || !newEvidence.url || !newEvidence.label}
                      className="px-4 py-2 bg-[rgba(94,160,255,0.15)] border border-[rgba(94,160,255,0.3)] rounded-lg text-[#8fc2ff] text-sm hover:bg-[rgba(94,160,255,0.2)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-[rgba(255,255,255,0.1)]">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.08)] transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || evidence.length === 0}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add Evidence'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
