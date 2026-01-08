'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { LayoutDashboard, FolderKanban, Ticket, Settings, Users, Shield, Building2, CreditCard, TrendingUp, Megaphone, LogOut, ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarProps {
  user: any;
  profile: any;
  roles: any[];
}

export default function Sidebar({ user, profile, roles }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [clients, setClients] = useState<any[]>([]);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [projectData, setProjectData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  const isAdmin = roles.some((r: any) => r.roles?.name === 'Admin');
  const isUX = roles.some((r: any) => r.roles?.name === 'UX Researcher');
  const isDev = roles.some((r: any) => r.roles?.name === 'Developer');
  const isClient = roles.some((r: any) => r.roles?.name === 'Client');

  useEffect(() => {
    async function loadData() {
      if (!profile?.org_id) return;

      try {
        // Get clients (admin sees all, others see clients they're involved with)
        let clientsQuery = supabase
          .from('clients')
          .select('*')
          .eq('org_id', profile.org_id)
          .order('name', { ascending: true });

        const { data: clientsData } = await clientsQuery;
        
        if (clientsData) {
          setClients(clientsData);

          // Load projects for all clients
          const projectPromises = clientsData.map(async (client) => {
            if (isAdmin) {
              const { data: projects } = await supabase
                .from('projects')
                .select('*')
                .eq('client_id', client.id)
                .order('name', { ascending: true });
              return { clientId: client.id, projects: projects || [] };
            } else {
              // Non-admin: get projects they're members of
              const { data: projectMembers } = await supabase
                .from('project_members')
                .select('*, projects(*)')
                .eq('user_id', user.id);
              
              const userProjects = (projectMembers || [])
                .filter((pm: any) => pm.projects && pm.projects.client_id === client.id)
                .map((pm: any) => pm.projects)
                .filter((p: any) => p && p.id); // Ensure project exists and has id
              
              return { clientId: client.id, projects: userProjects };
            }
          });

          const projectsResults = await Promise.all(projectPromises);
          const projectsMap: Record<string, any[]> = {};
          projectsResults.forEach(({ clientId, projects }) => {
            projectsMap[clientId] = projects;
          });
          setProjectData(projectsMap);

          // Auto-expand client/project if on that page
          const clientMatch = pathname.match(/\/app\/admin\/clients\/([^\/]+)/);
          const projectMatch = pathname.match(/\/app\/projects\/([^\/]+)/);
          
          if (clientMatch) {
            setExpandedClients(new Set([clientMatch[1]]));
          }
          if (projectMatch) {
            // Find which client this project belongs to
            Object.entries(projectsMap).forEach(([clientId, projects]) => {
              if (projects.some((p: any) => p.id === projectMatch[1])) {
                setExpandedClients(prev => new Set([...prev, clientId]));
              }
            });
          }
        }
      } catch (error) {
        console.error('Error loading sidebar data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [profile, user, isAdmin, pathname]);

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <aside className="w-64 bg-[rgba(13,15,17,0.95)] border-r border-[rgba(255,255,255,0.08)] flex flex-col">
      <div className="p-6 border-b border-[rgba(255,255,255,0.08)]">
        <Link href="/app" className="flex items-center gap-3">
          <Image
            src="/RunpathLabs_Logomark.png"
            alt="Runpath"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="font-semibold text-[#f4f6fb]">Runpath OS</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f4f6fb] transition ${
                isActive ? 'bg-[rgba(94,160,255,0.1)] text-[#5ea0ff]' : ''
              }`}
            >
              <IconComponent className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Clients Section */}
        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#9eacc2] uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Clients</span>
          </div>
          {loading ? (
            <div className="px-4 py-2 text-sm text-[#9eacc2]">Loading...</div>
          ) : clients.length > 0 ? (
            <div className="mt-1 space-y-1">
              {clients.map((client) => {
                const isExpanded = expandedClients.has(client.id);
                const projects = projectData[client.id] || [];
                const isClientActive = pathname.includes(`/app/admin/clients/${client.id}`);

                return (
                  <div key={client.id}>
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f4f6fb] transition cursor-pointer ${
                        isClientActive ? 'bg-[rgba(94,160,255,0.1)] text-[#5ea0ff]' : ''
                      }`}
                      onClick={() => toggleClient(client.id)}
                    >
                      {projects.length > 0 ? (
                        isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      <Link
                        href={`/app/admin/clients/${client.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center gap-2"
                      >
                        <Building2 className="w-4 h-4" />
                        <span className="text-sm font-medium truncate">{client.name}</span>
                      </Link>
                    </div>

                    {/* Projects under client */}
                    {isExpanded && projects.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-[rgba(255,255,255,0.05)] pl-2">
                        {projects
                          .filter((project: any) => project && project.id) // Ensure project has id
                          .map((project: any) => {
                            const isProjectActive = pathname.includes(`/app/projects/${project.id}`);

                            return (
                              <Link
                                key={project.id}
                                href={`/app/projects/${project.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f4f6fb] transition ${
                                  isProjectActive ? 'bg-[rgba(94,160,255,0.1)] text-[#5ea0ff]' : ''
                                }`}
                              >
                                <FolderKanban className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium truncate">{project.name || 'Unnamed Project'}</span>
                              </Link>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-[#9eacc2]">No clients</div>
          )}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#9eacc2] uppercase tracking-wider">
              <Settings className="w-4 h-4" />
              <span>Admin</span>
            </div>
            <div className="mt-1 space-y-1">
              <Link
                href="/app/admin"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f4f6fb] transition ${
                  pathname === '/app/admin' ? 'bg-[rgba(94,160,255,0.1)] text-[#5ea0ff]' : ''
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link
                href="/app/admin/users"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f4f6fb] transition ${
                  pathname.includes('/app/admin/users') ? 'bg-[rgba(94,160,255,0.1)] text-[#5ea0ff]' : ''
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Users</span>
              </Link>
              <Link
                href="/app/admin/roles"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f4f6fb] transition ${
                  pathname.includes('/app/admin/roles') ? 'bg-[rgba(94,160,255,0.1)] text-[#5ea0ff]' : ''
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Roles</span>
              </Link>
              <Link
                href="/app/admin/clients"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f4f6fb] transition ${
                  pathname === '/app/admin/clients' ? 'bg-[rgba(94,160,255,0.1)] text-[#5ea0ff]' : ''
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">All Clients</span>
              </Link>
              <Link
                href="/app/admin/billing"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f4f6fb] transition ${
                  pathname.includes('/app/admin/billing') ? 'bg-[rgba(94,160,255,0.1)] text-[#5ea0ff]' : ''
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium">Billing</span>
              </Link>
              <Link
                href="/app/sales"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f4f6fb] transition ${
                  pathname.includes('/app/sales') ? 'bg-[rgba(94,160,255,0.1)] text-[#5ea0ff]' : ''
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Sales</span>
              </Link>
              <Link
                href="/app/marketing"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f4f6fb] transition ${
                  pathname.includes('/app/marketing') ? 'bg-[rgba(94,160,255,0.1)] text-[#5ea0ff]' : ''
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span className="text-sm font-medium">Marketing</span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
        <div className="mb-4 px-4 py-3 bg-[rgba(255,255,255,0.03)] rounded-lg">
          <p className="text-sm font-medium text-[#f4f6fb]">
            {profile.full_name || user.email}
          </p>
          <p className="text-xs text-[#9eacc2] mt-1">
            {roles.map((r: any) => r.roles?.name).join(', ') || 'No role'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#d6dbe5] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] transition text-sm font-medium flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

