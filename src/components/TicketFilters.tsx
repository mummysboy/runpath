'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
}

interface TeamMember {
  user_id: string;
  full_name: string;
}

export default function TicketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [tags, setTags] = useState<Tag[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Current filter values from URL
  const currentStatus = searchParams.get('status') || '';
  const currentTag = searchParams.get('tag') || '';
  const currentProject = searchParams.get('project') || '';
  const currentAssignee = searchParams.get('assignee') || '';
  const currentSearch = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  async function fetchFilterOptions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('users_profile')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;

    // Fetch tags
    const { data: tagsData } = await supabase
      .from('ticket_tags')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('name');
    setTags(tagsData || []);

    // Fetch projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, name')
      .eq('org_id', profile.org_id)
      .order('name');
    setProjects(projectsData || []);

    // Fetch team members (non-clients)
    const { data: membersData } = await supabase
      .from('users_profile')
      .select('user_id, full_name')
      .eq('org_id', profile.org_id)
      .order('full_name');
    setMembers(membersData || []);

    setLoading(false);
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/app/tickets?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter('search', searchInput);
  }

  function clearFilters() {
    setSearchInput('');
    router.push('/app/tickets');
  }

  const hasActiveFilters = currentStatus || currentTag || currentProject || currentAssignee || currentSearch;

  if (loading) {
    return (
      <div className="mb-6 p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg">
        <p className="text-sm text-[#9eacc2]">Loading filters...</p>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search tickets..."
          className="flex-1 px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] text-sm focus:outline-none focus:border-[rgba(94,160,255,0.5)]"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[rgba(94,160,255,0.15)] border border-[rgba(94,160,255,0.3)] rounded-lg text-[#8fc2ff] text-sm hover:bg-[rgba(94,160,255,0.2)] transition"
        >
          Search
        </button>
      </form>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-3">
        <select
          value={currentStatus}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] text-sm focus:outline-none focus:border-[rgba(94,160,255,0.5)]"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={currentProject}
          onChange={(e) => updateFilter('project', e.target.value)}
          className="px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] text-sm focus:outline-none focus:border-[rgba(94,160,255,0.5)]"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <select
          value={currentTag}
          onChange={(e) => updateFilter('tag', e.target.value)}
          className="px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] text-sm focus:outline-none focus:border-[rgba(94,160,255,0.5)]"
        >
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>

        <select
          value={currentAssignee}
          onChange={(e) => updateFilter('assignee', e.target.value)}
          className="px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] text-sm focus:outline-none focus:border-[rgba(94,160,255,0.5)]"
        >
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.full_name}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-[#f87171] text-sm hover:text-[#fb8585] transition"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
