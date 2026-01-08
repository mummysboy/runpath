'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore, Trash2, AlertTriangle } from 'lucide-react';
import { archiveTicket, unarchiveTicket, deleteTicket } from '@/app/app/tickets/actions';

interface TicketActionsProps {
  ticketId: string;
  isArchived: boolean;
  isAdmin: boolean;
  isProjectAdmin: boolean;
}

export default function TicketActions({
  ticketId,
  isArchived,
  isAdmin,
  isProjectAdmin,
}: TicketActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canArchive = isAdmin || isProjectAdmin;
  const canDelete = isAdmin; // Only admins can permanently delete

  const handleArchive = () => {
    setMessage(null);
    startTransition(async () => {
      const result = isArchived
        ? await unarchiveTicket(ticketId)
        : await archiveTicket(ticketId);

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    });
  };

  const handleDelete = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await deleteTicket(ticketId);

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        // Redirect to project page after deletion
        setTimeout(() => {
          router.push('/app/tickets');
        }, 1000);
      } else {
        setMessage({ type: 'error', text: result.message });
        setShowDeleteConfirm(false);
      }
    });
  };

  if (!canArchive && !canDelete) {
    return null;
  }

  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
      <h3 className="font-semibold text-[#f4f6fb] mb-4">Actions</h3>

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

      <div className="space-y-3">
        {canArchive && (
          <button
            onClick={handleArchive}
            disabled={isPending}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              isArchived
                ? 'bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] text-green-300 hover:bg-[rgba(34,197,94,0.2)]'
                : 'bg-[rgba(250,204,21,0.15)] border border-[rgba(250,204,21,0.3)] text-yellow-300 hover:bg-[rgba(250,204,21,0.2)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isArchived ? (
              <>
                <ArchiveRestore className="w-4 h-4" />
                Unarchive Ticket
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Archive Ticket
              </>
            )}
          </button>
        )}

        {canDelete && (
          <>
            {showDeleteConfirm ? (
              <div className="space-y-2">
                <div className="p-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-300 mb-1">
                        Permanent Deletion
                      </p>
                      <p className="text-xs text-red-200">
                        This action cannot be undone. The ticket and all associated comments, evidence, and history will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex-1 px-4 py-2 rounded-lg bg-[rgba(239,68,68,0.2)] border border-[rgba(239,68,68,0.4)] text-red-300 font-semibold hover:bg-[rgba(239,68,68,0.3)] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      'Deleting...'
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Confirm Delete
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#d6dbe5] font-semibold hover:bg-[rgba(255,255,255,0.08)] transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="w-full px-4 py-2 rounded-lg bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-red-300 font-semibold hover:bg-[rgba(239,68,68,0.2)] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Ticket
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
