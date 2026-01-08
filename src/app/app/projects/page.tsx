import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProjectsContent from './ProjectsContent';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users_profile')
    .select('*, org_id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Get all projects user has access to
  const { data: projectMembers } = await supabase
    .from('project_members')
    .select('*, projects(*, clients(*))')
    .eq('user_id', user.id);

  // Check if user is admin
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, roles(*)')
    .eq('user_id', user.id);

  const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');

  // If admin, get all org projects
  let projects;
  if (isAdmin) {
    const { data: allProjects } = await supabase
      .from('projects')
      .select('*, clients(*), project_members(user_id, member_role)')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false });

    projects = allProjects;
  } else {
    projects = projectMembers?.map((pm: any) => ({
      ...pm.projects,
      clients: pm.projects?.clients,
      project_members: [{ user_id: user.id, member_role: pm.member_role }],
    }));
  }

  // Get clients for the form (admin only)
  let clients: Array<{ id: string; name: string }> = [];
  if (isAdmin) {
    const { data: clientsData } = await supabase
      .from('clients')
      .select('id, name')
      .eq('org_id', profile.org_id)
      .order('name', { ascending: true });
    
    clients = clientsData || [];
  }

  return (
    <ProjectsContent
      projects={projects || []}
      orgId={profile.org_id}
      userId={user.id}
      clients={clients}
      isAdmin={isAdmin}
    />
  );
}

