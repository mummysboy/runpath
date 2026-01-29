'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  sort_order: number;
  created_at: string;
  created_by: string;
}

interface DraggableTicketListProps {
  initialTickets: Ticket[];
  creatorProfiles: Record<string, any>;
  canReorder: boolean;
  isDeveloper: boolean;
  statusColor: { bg: string; border: string; hoverBorder: string; badge: string; badgeText: string };
  statusLabel: string;
}

// Strip HTML helper
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// Sortable ticket item
function SortableTicket({
  ticket,
  creatorName,
  canReorder,
  isDeveloper,
  statusColor,
}: {
  ticket: Ticket;
  creatorName: string;
  canReorder: boolean;
  isDeveloper: boolean;
  statusColor: { bg: string; border: string; hoverBorder: string; badge: string; badgeText: string };
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id, disabled: !canReorder });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canReorder ? { ...attributes, ...listeners } : {})}
      className={`${statusColor.bg} border ${statusColor.border} rounded-lg p-4 hover:${statusColor.hoverBorder} transition ${
        isDragging ? 'shadow-lg shadow-[rgba(94,160,255,0.2)] z-10' : ''
      } ${canReorder ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <Link href={`/app/tickets/${ticket.id}`} onClick={(e) => isDragging && e.preventDefault()}>
            <h4 className="font-medium text-[#f4f6fb] mb-1 hover:text-[#5ea0ff] transition">
              {stripHtml(ticket.title)}
            </h4>
          </Link>
          <p className="text-sm text-[#9eacc2] line-clamp-2">
            {stripHtml(ticket.description) || 'No description'}
          </p>
          <p className="text-xs text-[#7a8799] mt-2">
            Created by {creatorName} • {new Date(ticket.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="ml-4 flex flex-col gap-2 flex-shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor.badge} ${statusColor.badgeText} whitespace-nowrap`}>
            {ticket.status.replace('_', ' ')}
          </span>
          {!isDeveloper && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(255,255,255,0.05)] text-[#9eacc2] whitespace-nowrap">
              {ticket.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DraggableTicketList({
  initialTickets,
  creatorProfiles,
  canReorder,
  isDeveloper,
  statusColor,
  statusLabel,
}: DraggableTicketListProps) {
  const supabase = createClient();
  const [tickets, setTickets] = useState(initialTickets);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update tickets when initialTickets changes
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tickets.findIndex((t) => t.id === active.id);
      const newIndex = tickets.findIndex((t) => t.id === over.id);
      const newTickets = arrayMove(tickets, oldIndex, newIndex);
      setTickets(newTickets);

      // Save immediately
      setSaving(true);
      try {
        const updates = newTickets.map((ticket, index) => ({
          id: ticket.id,
          sort_order: (index + 1) * 10,
        }));

        for (const update of updates) {
          await supabase
            .from('tickets')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id);
        }
      } catch (err) {
        console.error('Failed to save order:', err);
        // Revert on error
        setTickets(initialTickets);
      } finally {
        setSaving(false);
      }
    }
  }

  if (tickets.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#9eacc2] uppercase tracking-wider">
          {statusLabel} ({tickets.length})
        </h3>
        {saving && (
          <span className="text-xs text-[#5ea0ff]">Saving...</span>
        )}
      </div>

      {canReorder ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <SortableTicket
                  key={ticket.id}
                  ticket={ticket}
                  creatorName={creatorProfiles[ticket.created_by]?.full_name || 'Unknown'}
                  canReorder={canReorder}
                  isDeveloper={isDeveloper}
                  statusColor={statusColor}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <SortableTicket
              key={ticket.id}
              ticket={ticket}
              creatorName={creatorProfiles[ticket.created_by]?.full_name || 'Unknown'}
              canReorder={false}
              isDeveloper={isDeveloper}
              statusColor={statusColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
