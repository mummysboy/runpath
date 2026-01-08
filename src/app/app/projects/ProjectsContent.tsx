'use client';

import { useState } from 'react';
import Link from 'next/link';
import CreateProjectForm from './CreateProjectForm';

interface Project {
  id: string;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  clients?: {
    name: string;
  };
}

interface ProjectsContentProps {
  projects: Project[];
  orgId: string;
  userId: string;
  clients: Array<{ id: string; name: string }>;
  isAdmin: boolean;
}

export default function ProjectsContent({ projects, orgId, userId, clients, isAdmin }: ProjectsContentProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

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
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects && projects.length > 0 ? (
            projects.map((project: any) => (
              <Link
                key={project.id}
                href={`/app/projects/${project.id}`}
                className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 hover:border-[rgba(94,160,255,0.2)] transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[#f4f6fb]">{project.name}</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]">
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-[#9eacc2] mb-4">
                  Client: {project.clients?.name || 'N/A'}
                </p>
                {project.start_date && (
                  <p className="text-xs text-[#7a8799]">
                    {new Date(project.start_date).toLocaleDateString()}
                    {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                  </p>
                )}
              </Link>
            ))
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

