'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreateProjectForm from '../../../projects/CreateProjectForm';

interface Project {
  id: string;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
}

interface User {
  user_id: string;
  full_name: string | null;
  email?: string;
}

interface ClientProjectsSectionProps {
  projects: Project[];
  ticketCounts: Record<string, number>;
  clientId: string;
  orgId: string;
  userId: string;
  clients: Array<{ id: string; name: string }>;
  users: User[];
}

export default function ClientProjectsSection({
  projects,
  ticketCounts,
  clientId,
  orgId,
  userId,
  clients,
  users,
}: ClientProjectsSectionProps) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-[#f4f6fb]">Projects</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition flex items-center gap-2 text-sm"
        >
          New Project
        </button>
      </div>
      <CreateProjectForm
        orgId={orgId}
        userId={userId}
        clients={clients}
        defaultClientId={clientId}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleSuccess}
        showButton={false}
        users={users}
      />
      <div className="space-y-3">
        {projects && projects.length > 0 ? (
          projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/app/projects/${project.id}`}
              className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 hover:border-[rgba(94,160,255,0.2)] transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-[#f4f6fb] mb-1">{project.name}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-[#9eacc2]">
                    <span>Tickets: {ticketCounts[project.id] || 0}</span>
                    {project.start_date && (
                      <span>
                        Started: {new Date(project.start_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(94,160,255,0.15)] text-[#8fc2ff] whitespace-nowrap">
                    {project.status}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-[#9eacc2] mb-4">No projects yet</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="text-[#5ea0ff] hover:text-[#8fc2ff] text-sm"
            >
              Create a project →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
