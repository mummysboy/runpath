'use client';

import { useRouter } from 'next/navigation';
import AddTicketEvidence from './AddTicketEvidence';
import { Image as ImageIcon } from 'lucide-react';

interface Evidence {
  id: string;
  kind: 'link' | 'file';
  url: string;
  label: string | null;
}

interface TicketEvidenceSectionProps {
  ticketId: string;
  evidence: Evidence[];
  canAdd: boolean;
  orgId: string;
}

export default function TicketEvidenceSection({ ticketId, evidence, canAdd, orgId }: TicketEvidenceSectionProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#f4f6fb]">Evidence</h2>
        {canAdd && (
          <AddTicketEvidence ticketId={ticketId} onSuccess={handleSuccess} />
        )}
      </div>
      
      {evidence.length > 0 ? (
        <div className="space-y-3">
          {evidence.map((ev) => (
            <div key={ev.id} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
              {ev.kind === 'file' && isImage(ev.url) ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-4 h-4 text-[#5ea0ff]" />
                    <span className="text-xs px-2 py-1 rounded bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]">
                      Image
                    </span>
                    {ev.label && (
                      <span className="text-sm text-[#d6dbe5]">{ev.label}</span>
                    )}
                  </div>
                  <div className="relative group">
                    <img
                      src={ev.url}
                      alt={ev.label || 'Evidence image'}
                      className="w-full max-w-md rounded-lg border border-[rgba(255,255,255,0.1)] cursor-pointer hover:opacity-90 transition"
                      onClick={() => window.open(ev.url, '_blank')}
                    />
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 px-3 py-1 bg-[rgba(0,0,0,0.7)] rounded text-sm text-[#f7f9ff] hover:bg-[rgba(0,0,0,0.9)] transition opacity-0 group-hover:opacity-100"
                    >
                      Open Full Size →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]">
                    {ev.kind}
                  </span>
                  <span className="flex-1 text-sm text-[#d6dbe5]">{ev.label || ev.url}</span>
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#5ea0ff] hover:text-[#8fc2ff]"
                  >
                    Open →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-[#9eacc2] mb-4">No evidence added yet</p>
          {canAdd && (
            <AddTicketEvidence ticketId={ticketId} onSuccess={handleSuccess} />
          )}
        </div>
      )}
    </div>
  );
}
