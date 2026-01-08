import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Ticket, FileText, Users, AlertCircle, Clock } from 'lucide-react';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
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

  // Await params if it's a Promise (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params;
  const projectId = resolvedParams.id;

  console.log('[Project Detail] Attempting to load project:', {
    projectId,
    userId: user.id,
    userEmail: user.email,
  });

  // Validate project ID format (should be UUID)
  if (!projectId || typeof projectId !== 'string') {
    console.error('[Project Detail] Invalid project ID format:', projectId);
    notFound();
  }

  // Check if user is admin first (admins can access any project in their org)
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*, roles(*)')
    .eq('user_id', user.id);

  if (rolesError) {
    console.error('[Project Detail] Error fetching user roles:', rolesError);
  }

  const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');
  console.log('[Project Detail] User is admin:', isAdmin);

  // For non-admins, check membership (but skip if RLS has recursion issues)
  // Since we're an admin, we can skip this check and query projects directly
  let projectMembership = null;
  if (!isAdmin) {
    // Only check membership for non-admins
    // Note: If RLS has recursion issues, this will fail, but we'll handle it
    const { data: membershipData, error: membershipError } = await supabase
      .from('project_members')
      .select('*, projects(*)')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError && membershipError.code !== '42P17') {
      // Only log if it's not the recursion error (which we expect might happen)
      console.error('[Project Detail] Error checking project membership:', membershipError);
    }

    projectMembership = membershipData;

    // If user is not a member and not an admin, redirect
    if (!projectMembership) {
      console.error('[Project Detail] Access denied - user is not a project member and not an admin');
      redirect('/app/projects');
    }
  }

  // Fetch project details
  // For admins, fetch directly. For members, use the data from project_members query
  let project: any;
  
  if (isAdmin) {
    // Admins can query projects directly - fetch project and client first
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*, clients(*)')
      .eq('id', projectId)
      .eq('org_id', profile.org_id)
      .single();

    if (projectError) {
      console.error('[Project Detail] Error fetching project:', projectError);
      notFound();
    }

    if (!projectData) {
      console.error('[Project Detail] Project not found');
      notFound();
    }

    // Fetch project members separately (avoiding the problematic join)
    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId);

    if (membersError) {
      console.error('[Project Detail] Error fetching members:', membersError);
    }

    // Fetch user profiles for members separately
    const memberUserIds = members?.map((m: any) => m.user_id) || [];
    let memberProfiles: any[] = [];
    
    if (memberUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('users_profile')
        .select('user_id, full_name')
        .in('user_id', memberUserIds);

      if (profilesError) {
        console.error('[Project Detail] Error fetching member profiles:', profilesError);
      } else {
        memberProfiles = profiles || [];
      }
    }

    // Combine members with their profiles
    const projectMembersWithProfiles = (members || []).map((member: any) => ({
      ...member,
      users_profile: memberProfiles.find((p: any) => p.user_id === member.user_id) || null,
    }));

    project = {
      ...projectData,
      project_members: projectMembersWithProfiles,
    };
  } else {
    // For members, we already have project data from the project_members query
    project = projectMembership?.projects;
    
    console.log('[Project Detail] Member accessing project:', {
      hasProjectData: !!project,
      projectId: project?.id,
      projectName: project?.name,
    });
    
    if (!project) {
      console.error('[Project Detail] Project not found in membership data - this should not happen if user is a member');
      notFound();
    }

    // Fetch project details with client
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*, clients(*)')
      .eq('id', projectId)
      .eq('org_id', profile.org_id)
      .single();

    if (projectError) {
      console.error('[Project Detail] Error fetching project details:', projectError);
      notFound();
    }

    // Fetch all project members separately (avoiding problematic joins)
    const { data: allMembers, error: membersError } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId);

    if (membersError) {
      console.error('[Project Detail] Error fetching all members:', membersError);
    }

    // Fetch user profiles for members separately
    const memberUserIds = (allMembers || []).map((m: any) => m.user_id);
    let memberProfiles: any[] = [];
    
    if (memberUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('users_profile')
        .select('user_id, full_name')
        .in('user_id', memberUserIds);

      if (profilesError) {
        console.error('[Project Detail] Error fetching member profiles:', profilesError);
      } else {
        memberProfiles = profiles || [];
      }
    }

    // Combine members with their profiles
    const projectMembersWithProfiles = (allMembers || []).map((member: any) => ({
      ...member,
      users_profile: memberProfiles.find((p: any) => p.user_id === member.user_id) || null,
    }));

    project = {
      ...projectData,
      project_members: projectMembersWithProfiles,
    };
  }

  // Verify org_id matches (security check)
  if (project.org_id !== profile.org_id) {
    console.error('[Project Detail] Org ID mismatch - access denied');
    notFound();
  }

  const isMember = projectMembership !== null;
  // Get user's member role (from membership or from project members list for admins)
  const userMemberRole = projectMembership?.member_role || 
    project.project_members?.find((pm: any) => pm.user_id === user.id)?.member_role;

  // Get tickets for this project
  let ticketsQuery = supabase
    .from('tickets')
    .select('*, created_by_profile:users_profile!created_by(*)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (userMemberRole === 'client') {
    ticketsQuery = ticketsQuery.eq('client_visible', true);
  }

  const { data: tickets, error: ticketsError } = await ticketsQuery;

  if (ticketsError) {
    console.error('[Project Detail] Error fetching tickets:', ticketsError);
  }

  // Get recent ticket comments as notes
  const ticketIds = tickets?.map((t: any) => t.id) || [];
  let recentComments: any[] = [];
  if (ticketIds.length > 0) {
    // Get comments first
    const { data: commentsData, error: commentsError } = await supabase
      .from('ticket_comments')
      .select('*')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (commentsError) {
      console.error('[Project Detail] Error fetching comments:', commentsError);
    }
    
    if (commentsData && commentsData.length > 0) {
      // Get author profiles
      const authorIds = Array.from(new Set(commentsData.map((c: any) => c.author_id)));
      const { data: profiles } = await supabase
        .from('users_profile')
        .select('user_id, full_name')
        .in('user_id', authorIds);
      
      // Combine comments with profiles
      recentComments = commentsData.map((comment: any) => ({
        ...comment,
        author_profile: profiles?.find((p: any) => p.user_id === comment.author_id),
      }));
    }
  }

  // Organize tickets by status
  const ticketsByStatus = {
    open: tickets?.filter((t: any) => t.status === 'open') || [],
    in_progress: tickets?.filter((t: any) => t.status === 'in_progress') || [],
    resolved: tickets?.filter((t: any) => t.status === 'resolved') || [],
    closed: tickets?.filter((t: any) => t.status === 'closed') || [],
  };

  // Calculate upcoming deadlines
  const now = new Date();
  const upcomingDeadlines: Array<{ label: string; date: Date; type: 'project' | 'ticket' }> = [];
  
  if (project.end_date) {
    const endDate = new Date(project.end_date);
    if (endDate >= now) {
      upcomingDeadlines.push({
        label: 'Project End Date',
        date: endDate,
        type: 'project',
      });
    }
  }

  // Sort deadlines
  upcomingDeadlines.sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextDeadline = upcomingDeadlines[0];

  // Calculate days until deadline
  const getDaysUntil = (date: Date) => {
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const canCreateTicket = isAdmin || userMemberRole === 'admin' || userMemberRole === 'dev' || userMemberRole === 'ux';

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/app/projects"
          className="text-[#5ea0ff] hover:text-[#8fc2ff] text-sm mb-4 inline-block"
        >
          ← Back to Projects
        </Link>
        <div className="flex items-start justify-between mt-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">{project.name}</h1>
            <p className="text-[#b7c1cf]">
              Client: {project.clients?.name} • Status: <span className="capitalize">{project.status}</span>
            </p>
          </div>
          {canCreateTicket && (
            <Link
              href={`/app/projects/${projectId}/tickets/new`}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition flex items-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              New Ticket
            </Link>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgba(94,160,255,0.15)] rounded-lg">
              <Ticket className="w-5 h-5 text-[#5ea0ff]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#f4f6fb]">{tickets?.length || 0}</p>
              <p className="text-xs text-[#9eacc2]">Total Tickets</p>
            </div>
          </div>
        </div>
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgba(239,68,68,0.15)] rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#f4f6fb]">{ticketsByStatus.open.length}</p>
              <p className="text-xs text-[#9eacc2]">Open</p>
            </div>
          </div>
        </div>
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgba(250,204,21,0.15)] rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#f4f6fb]">{ticketsByStatus.in_progress.length}</p>
              <p className="text-xs text-[#9eacc2]">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgba(34,197,94,0.15)] rounded-lg">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#f4f6fb]">{project.project_members?.length || 0}</p>
              <p className="text-xs text-[#9eacc2]">Team Members</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tickets by Status */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-[#f4f6fb] flex items-center gap-2">
                <Ticket className="w-6 h-6" />
                Tickets
              </h2>
            </div>

            {/* Open Tickets */}
            {ticketsByStatus.open.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#9eacc2] mb-3 uppercase tracking-wider">Open ({ticketsByStatus.open.length})</h3>
                <div className="space-y-3">
                  {ticketsByStatus.open.map((ticket: any) => (
                    <Link
                      key={ticket.id}
                      href={`/app/tickets/${ticket.id}`}
                      className="block bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-lg p-4 hover:border-[rgba(239,68,68,0.4)] transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-[#f4f6fb] mb-1">{ticket.title}</h4>
                          <p className="text-sm text-[#9eacc2] line-clamp-2">{ticket.description}</p>
                          <p className="text-xs text-[#7a8799] mt-2">
                            Created by {ticket.created_by_profile?.full_name || 'Unknown'} • {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(239,68,68,0.2)] text-red-300 whitespace-nowrap">
                            {ticket.status}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(255,255,255,0.05)] text-[#9eacc2] whitespace-nowrap">
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Tickets */}
            {ticketsByStatus.in_progress.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#9eacc2] mb-3 uppercase tracking-wider">In Progress ({ticketsByStatus.in_progress.length})</h3>
                <div className="space-y-3">
                  {ticketsByStatus.in_progress.map((ticket: any) => (
                    <Link
                      key={ticket.id}
                      href={`/app/tickets/${ticket.id}`}
                      className="block bg-[rgba(250,204,21,0.08)] border border-[rgba(250,204,21,0.2)] rounded-lg p-4 hover:border-[rgba(250,204,21,0.4)] transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-[#f4f6fb] mb-1">{ticket.title}</h4>
                          <p className="text-sm text-[#9eacc2] line-clamp-2">{ticket.description}</p>
                          <p className="text-xs text-[#7a8799] mt-2">
                            Created by {ticket.created_by_profile?.full_name || 'Unknown'} • {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(250,204,21,0.2)] text-yellow-300 whitespace-nowrap">
                            {ticket.status}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(255,255,255,0.05)] text-[#9eacc2] whitespace-nowrap">
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved/Closed Tickets */}
            {(ticketsByStatus.resolved.length > 0 || ticketsByStatus.closed.length > 0) && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#9eacc2] mb-3 uppercase tracking-wider">
                  Resolved ({ticketsByStatus.resolved.length + ticketsByStatus.closed.length})
                </h3>
                <div className="space-y-3">
                  {[...ticketsByStatus.resolved, ...ticketsByStatus.closed].slice(0, 5).map((ticket: any) => (
                    <Link
                      key={ticket.id}
                      href={`/app/tickets/${ticket.id}`}
                      className="block bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 hover:border-[rgba(94,160,255,0.2)] transition opacity-75"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-[#f4f6fb] mb-1">{ticket.title}</h4>
                          <p className="text-xs text-[#7a8799] mt-2">
                            {new Date(ticket.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(34,197,94,0.2)] text-green-300 whitespace-nowrap">
                          {ticket.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {tickets?.length === 0 && (
              <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-8 text-center">
                <Ticket className="w-12 h-12 text-[#9eacc2] mx-auto mb-4" />
                <p className="text-[#9eacc2] mb-4">No tickets yet</p>
                {canCreateTicket && (
                  <Link
                    href={`/app/projects/${projectId}/tickets/new`}
                    className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition"
                  >
                    Create First Ticket
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Recent Notes/Comments */}
          {recentComments.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-[#f4f6fb] flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Recent Activity
              </h2>
              <div className="space-y-3">
                {recentComments.map((comment: any) => {
                  const ticket = tickets?.find((t: any) => t.id === comment.ticket_id);
                  return (
                    <div
                      key={comment.id}
                      className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-[#f4f6fb]">
                              {comment.author_profile?.full_name || 'Unknown'}
                            </span>
                            {ticket && (
                              <Link
                                href={`/app/tickets/${ticket.id}`}
                                className="text-xs text-[#5ea0ff] hover:text-[#8fc2ff]"
                              >
                                on "{ticket.title}"
                              </Link>
                            )}
                          </div>
                          <p className="text-sm text-[#d6dbe5] mb-2">{comment.body}</p>
                          <p className="text-xs text-[#7a8799]">
                            {new Date(comment.created_at).toLocaleString()}
                          </p>
                        </div>
                        {comment.is_internal && (
                          <span className="px-2 py-1 rounded text-xs bg-[rgba(94,160,255,0.15)] text-[#8fc2ff]">
                            Internal
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
              <h3 className="font-semibold text-[#f4f6fb] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Deadlines
              </h3>
              <div className="space-y-4">
                {upcomingDeadlines.slice(0, 5).map((deadline, idx) => {
                  const daysUntil = getDaysUntil(deadline.date);
                  const isUrgent = daysUntil <= 7;
                  const isPast = daysUntil < 0;
                  
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        isPast
                          ? 'bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)]'
                          : isUrgent
                          ? 'bg-[rgba(250,204,21,0.1)] border-[rgba(250,204,21,0.3)]'
                          : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)]'
                      }`}
                    >
                      <p className="text-sm font-medium text-[#f4f6fb] mb-1">
                        {deadline.label}
                      </p>
                      <p className="text-xs text-[#9eacc2]">
                        {deadline.date.toLocaleDateString()}
                      </p>
                      <p className={`text-xs font-medium mt-1 ${
                        isPast
                          ? 'text-red-400'
                          : isUrgent
                          ? 'text-yellow-400'
                          : 'text-[#9eacc2]'
                      }`}>
                        {isPast
                          ? `${Math.abs(daysUntil)} days overdue`
                          : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} remaining`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Project Details */}
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
            <h3 className="font-semibold text-[#f4f6fb] mb-4">Project Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#9eacc2]">Status</p>
                <p className="text-[#f4f6fb] font-medium capitalize">{project.status}</p>
              </div>
              {project.start_date && (
                <div>
                  <p className="text-[#9eacc2]">Start Date</p>
                  <p className="text-[#f4f6fb] font-medium">
                    {new Date(project.start_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {project.end_date && (
                <div>
                  <p className="text-[#9eacc2]">End Date</p>
                  <p className="text-[#f4f6fb] font-medium">
                    {new Date(project.end_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[#9eacc2]">Client</p>
                <p className="text-[#f4f6fb] font-medium">{project.clients?.name}</p>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
            <h3 className="font-semibold text-[#f4f6fb] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members
            </h3>
            <div className="space-y-2">
              {project.project_members?.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between">
                  <span className="text-sm text-[#d6dbe5]">
                    {member.users_profile?.full_name || 'Unknown'}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] text-[#9eacc2] capitalize">
                    {member.member_role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

