'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TicketTagSelectorProps {
  projectId: string;
  selectedTags: string[];
  onTagsChange: (tagIds: string[]) => void;
  disabled?: boolean;
}

const TAG_COLORS = [
  '#5ea0ff', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

export default function TicketTagSelector({ projectId, selectedTags, onTagsChange, disabled }: TicketTagSelectorProps) {
  const supabase = createClient();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTags();
  }, [projectId]);

  async function fetchTags() {
    // Fetch tags scoped to this project
    const { data } = await supabase
      .from('ticket_tags')
      .select('*')
      .eq('project_id', projectId)
      .order('name');

    setTags(data || []);
    setLoading(false);
  }

  async function createTag() {
    if (!newTagName.trim()) return;

    setCreating(true);
    try {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('org_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profile) {
        const { data, error } = await supabase
          .from('ticket_tags')
          .insert({
            org_id: profile.org_id,
            project_id: projectId,
            name: newTagName.trim(),
            color: newTagColor,
          })
          .select()
          .single();

        if (data && !error) {
          setTags([...tags, data]);
          onTagsChange([...selectedTags, data.id]);
          setNewTagName('');
          setShowCreate(false);
        }
      }
    } finally {
      setCreating(false);
    }
  }

  function toggleTag(tagId: string) {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  }

  if (loading) {
    return <div className="text-sm text-[#9eacc2]">Loading tags...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              selectedTags.includes(tag.id)
                ? 'ring-2 ring-offset-2 ring-offset-[#0d0f11]'
                : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: `${tag.color}25`,
              color: tag.color,
              borderColor: tag.color,
              ...(selectedTags.includes(tag.id) ? { ringColor: tag.color } : {}),
            }}
          >
            {tag.name}
          </button>
        ))}

        {!showCreate && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            disabled={disabled}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#9eacc2] hover:bg-[rgba(255,255,255,0.08)] transition"
          >
            + New Tag
          </button>
        )}
      </div>

      {showCreate && (
        <div className="flex items-center gap-2 p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name"
            className="flex-1 px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] text-sm focus:outline-none focus:border-[rgba(94,160,255,0.5)]"
            disabled={creating}
          />
          <div className="flex gap-1">
            {TAG_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setNewTagColor(color)}
                className={`w-6 h-6 rounded-full transition ${
                  newTagColor === color ? 'ring-2 ring-offset-2 ring-offset-[#0d0f11] ring-white' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={createTag}
            disabled={creating || !newTagName.trim()}
            className="px-3 py-2 bg-[rgba(94,160,255,0.15)] border border-[rgba(94,160,255,0.3)] rounded-lg text-[#8fc2ff] text-sm hover:bg-[rgba(94,160,255,0.2)] transition disabled:opacity-50"
          >
            {creating ? '...' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreate(false);
              setNewTagName('');
            }}
            className="px-3 py-2 text-[#9eacc2] text-sm hover:text-[#d6dbe5]"
          >
            Cancel
          </button>
        </div>
      )}

      {tags.length === 0 && !showCreate && (
        <p className="text-sm text-[#7a8799]">No tags yet. Create one to start organizing tickets.</p>
      )}
    </div>
  );
}
