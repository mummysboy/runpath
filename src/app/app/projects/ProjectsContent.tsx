'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import CreateProjectForm from './CreateProjectForm';
import { Search, Filter, Users, Calendar, Building2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  clients?: {
    id?: string;
    name: string;
  };
  project_members?: Array<{ user_id: string; member_role: string }>;
}

interface User {
  user_id: string;
  full_name: string | null;
  email?: string;
}

interface ProjectsContentProps {
  projects: Project[];
  orgId: string;
  userId: string;
  clients: Array<{ id: string; name: string }>;
  isAdmin: boolean;
  users: User[];
}

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-[rgba(168,85,247,0.15)] text-purple-300',
  active: 'bg-[rgba(34,197,94,0.15)] text-green-300',
  on_hold: 'bg-[rgba(234,179,8,0.15)] text-yellow-300',
  completed: 'bg-[rgba(59,130,246,0.15)] text-blue-300',
  cancelled: 'bg-[rgba(239,68,68,0.15)] text-red-300',
};

export default function ProjectsContent({ projects, orgId, userId, clients, isAdmin, users }: ProjectsContentProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  // Get unique statuses from projects
  const statuses = useMemo(() => {
    const uniqueStatuses = new Set(projects.map(p => p.status));
    return Array.from(uniqueStatuses);
  }, [projects]);

  // Filter projects based on search and filters
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

      // Client filter
      const matchesClient = clientFilter === 'all' || project.clients?.id === clientFilter;

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [projects, searchQuery, statusFilter, clientFilter]);

  // Group projects by status for summary
  const projectsByStatus = useMemo(() => {
    const groups: Record<string, number> = {};
    projects.forEach(p => {
      groups[p.status] = (groups[p.status] || 0) + 1;
    });
    return groups;
  }, [projects]);

  return (
    <>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Projects</h1>
            <p className="text-[#b7c1cf]">Manage and track your projects</p>
          </div>
          {isAdmin && clients.length > 0 && (
            <CreateProjectForm
              orgId={orgId}
              userId={userId}
              clients={clients}
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              users={users}
            />
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
            <p className="text-sm text-[#9eacc2] mb-1">Total Projects</p>
            <p className="text-2xl font-bold text-[#f7f9ff]">{projects.length}</p>
          </div>
          {Object.entries(projectsByStatus).map(([status, count]) => (
            <div key={status} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
              <p className="text-sm text-[#9eacc2] mb-1 capitalize">{status.replace('_', ' ')}</p>
              <p className="text-2xl font-bold text-[#f7f9ff]">{count}</p>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9eacc2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects or clients..."
              className="w-full pl-10 pr-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] placeholder-[#9eacc2] focus:outline-none focus:border-[#5ea0ff] transition"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] focus:outline-none focus:border-[#5ea0ff] transition"
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status} className="capitalize">
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
            {isAdmin && (
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f7f9ff] focus:outline-none focus:border-[#5ea0ff] transition"
              >
                <option value="all">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Results Count */}
        {(searchQuery || statusFilter !== 'all' || clientFilter !== 'all') && (
          <p className="text-sm text-[#9eacc2] mb-4">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects && filteredProjects.length > 0 ? (
            filteredProjects.map((project: Project) => (
              <Link
                key={project.id}
                href={`/app/projects/${project.id}`}
                className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 hover:border-[rgba(94,160,255,0.2)] hover:bg-[rgba(255,255,255,0.04)] transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[#f4f6fb] group-hover:text-[#5ea0ff] transition">{project.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[project.status] || 'bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]'}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#9eacc2] mb-3">
                  <Building2 className="w-4 h-4" />
                  <span>{project.clients?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#7a8799]">
                  {project.start_date ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(project.start_date).toLocaleDateString()}
                        {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                      </span>
                    </div>
                  ) : (
                    <span>No dates set</span>
                  )}
                  {project.project_members && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{project.project_members.length} member{project.project_members.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))
          ) : projects.length > 0 ? (
            <div className="col-span-full text-center py-16">
              <p className="text-[#9eacc2] mb-4">No projects match your filters</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setClientFilter('all');
                }}
                className="text-[#5ea0ff] hover:text-[#8fc2ff]"
              >
                Clear filters →
              </button>
            </div>
          ) : (
            <div className="col-span-full text-center py-16">
              <p className="text-[#9eacc2] mb-4">No projects found</p>
              {isAdmin ? (
                clients.length > 0 ? (
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="text-[#5ea0ff] hover:text-[#8fc2ff]"
                  >
                    Create your first project →
                  </button>
                ) : (
                  <Link
                    href="/app/admin/clients"
                    className="text-[#5ea0ff] hover:text-[#8fc2ff]"
                  >
                    Create a client first →
                  </Link>
                )
              ) : (
                <p className="text-[#7a8799] text-sm">Contact an admin to create a project</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

