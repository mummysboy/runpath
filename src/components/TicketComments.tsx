'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TicketCommentsProps {
  ticketId: string;
  userId: string;
  isClient: boolean;
}

export default function TicketComments({ ticketId, userId, isClient }: TicketCommentsProps) {
  const supabase = createClient();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [ticketId]);

  const loadComments = async () => {
    try {
      // Fetch comments first
      const { data: commentsData, error: commentsError } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Filter internal comments for clients
      const visibleComments = isClient
        ? (commentsData || []).filter((c: any) => !c.is_internal)
        : commentsData || [];

      // Get unique author IDs
      const authorIds = Array.from(new Set(visibleComments.map((c: any) => c.author_id)));

      // Fetch user profiles separately
      let authorProfiles: Record<string, any> = {};
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('users_profile')
          .select('user_id, full_name')
          .in('user_id', authorIds);

        if (profiles) {
          authorProfiles = profiles.reduce((acc: Record<string, any>, p: any) => {
            acc[p.user_id] = p;
            return acc;
          }, {});
        }
      }

      // Combine comments with author profiles
      const commentsWithProfiles = visibleComments.map((comment: any) => ({
        ...comment,
        author_profile: authorProfiles[comment.author_id] || null,
      }));

      setComments(commentsWithProfiles);
    } catch (err: any) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('ticket_comments').insert({
        ticket_id: ticketId,
        author_id: userId,
        body: newComment,
        is_internal: isInternal && !isClient, // Clients can't create internal comments
      });

      if (error) throw error;

      setNewComment('');
      setIsInternal(false);
      await loadComments();
    } catch (err: any) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
        <p className="text-[#9eacc2]">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-[#f4f6fb]">Comments</h2>

      <div className="space-y-4 mb-6">
        {comments.length > 0 ? (
          comments.map((comment: any) => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg border ${
                comment.is_internal
                  ? 'bg-[rgba(239,68,68,0.05)] border-[rgba(239,68,68,0.2)]'
                  : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#d6dbe5]">
                  {comment.author_profile?.full_name || 'Unknown'}
                </span>
                <div className="flex items-center gap-2">
                  {comment.is_internal && (
                    <span className="text-xs px-2 py-1 rounded bg-[rgba(239,68,68,0.15)] text-[#f87171]">
                      Internal
                    </span>
                  )}
                  <span className="text-xs text-[#7a8799]">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-[#d6dbe5] whitespace-pre-wrap">{comment.body}</p>
            </div>
          ))
        ) : (
          <p className="text-[#9eacc2] text-center py-8">No comments yet</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {!isClient && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="w-4 h-4 accent-[#5ea0ff] cursor-pointer"
            />
            <span className="text-sm text-[#d6dbe5]">Internal comment (not visible to client)</span>
          </label>
        )}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
}

