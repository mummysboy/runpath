'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';

export interface ProjectMemberInput {
  user_id: string;
  member_role: 'admin' | 'ux' | 'dev' | 'client';
}

export interface CreateProjectInput {
  name: string;
  client_id: string;
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  members?: ProjectMemberInput[];
}

export interface CreateProjectResult {
  success: boolean;
  message: string;
  projectId?: string;
  warning?: string;
}

/**
 * Creates a new project for the organization.
 */
export async function createProject(
  input: CreateProjectInput,
  orgId: string,
  userId: string
): Promise<CreateProjectResult> {
  try {
    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      return {
        success: false,
        message: 'Project name is required',
      };
    }

    if (!input.client_id) {
      return {
        success: false,
        message: 'Client is required',
      };
    }

    // Verify current user has admin permissions
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: 'Not authenticated',
      };
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');

    if (!isAdmin) {
      return {
        success: false,
        message: 'Insufficient permissions. Admin access required.',
      };
    }

    // Verify client belongs to organization
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', input.client_id)
      .eq('org_id', orgId)
      .single();

    if (!client) {
      return {
        success: false,
        message: 'Client not found or does not belong to your organization',
      };
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        org_id: orgId,
        client_id: input.client_id,
        name: input.name.trim(),
        status: input.status || 'planning',
        start_date: input.start_date || null,
        end_date: input.end_date || null,
      })
      .select()
      .single();

    if (projectError) {
      return {
        success: false,
        message: projectError.message || 'Failed to create project',
      };
    }

    // Add members to the project
    const membersToAdd: Array<{ project_id: string; user_id: string; member_role: string }> = [];
    
    // Always add creator as admin (unless they're already in the members list)
    const creatorInMembers = input.members?.some(m => m.user_id === userId);
    if (!creatorInMembers) {
      membersToAdd.push({
        project_id: project.id,
        user_id: userId,
        member_role: 'admin',
      });
    }

    // Add any additional members specified
    if (input.members && input.members.length > 0) {
      for (const member of input.members) {
        // Skip if already added (creator)
        if (member.user_id === userId && member.member_role === 'admin') {
          continue;
        }
        
        // Verify user belongs to the same org
        const { data: targetUser } = await supabase
          .from('users_profile')
          .select('user_id, org_id')
          .eq('user_id', member.user_id)
          .eq('org_id', orgId)
          .single();

        if (targetUser) {
          membersToAdd.push({
            project_id: project.id,
            user_id: member.user_id,
            member_role: member.member_role,
          });
        }
      }
    }

    // Insert all members at once
    let memberWarning: string | undefined;
    if (membersToAdd.length > 0) {
      const { error: memberError } = await supabase
        .from('project_members')
        .insert(membersToAdd);

      if (memberError) {
        console.error('Failed to add project members:', memberError);
        memberWarning = 'Project created but some team members could not be added. Please add them manually.';
      }
    }

    return {
      success: true,
      message: memberWarning ? 'Project created with warnings' : 'Project created successfully',
      projectId: project.id,
      warning: memberWarning,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}

export interface AddProjectMemberInput {
  project_id: string;
  user_id: string;
  member_role: 'admin' | 'ux' | 'dev' | 'client';
}

export interface AddProjectMemberResult {
  success: boolean;
  message: string;
}

/**
 * Adds a user to a project as a member.
 */
export async function addProjectMember(
  input: AddProjectMemberInput
): Promise<AddProjectMemberResult> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: 'Not authenticated',
      };
    }

    // Verify current user has admin permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');

    if (!isAdmin) {
      return {
        success: false,
        message: 'Insufficient permissions. Admin access required.',
      };
    }

    // Verify project exists and belongs to user's org
    const { data: profile } = await supabase
      .from('users_profile')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return {
        success: false,
        message: 'User profile not found',
      };
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, org_id')
      .eq('id', input.project_id)
      .eq('org_id', profile.org_id)
      .single();

    if (!project) {
      return {
        success: false,
        message: 'Project not found or does not belong to your organization',
      };
    }

    // Verify user belongs to the same org
    const { data: targetUser } = await supabase
      .from('users_profile')
      .select('user_id, org_id')
      .eq('user_id', input.user_id)
      .eq('org_id', profile.org_id)
      .single();

    if (!targetUser) {
      return {
        success: false,
        message: 'User not found or does not belong to your organization',
      };
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', input.project_id)
      .eq('user_id', input.user_id)
      .maybeSingle();

    if (existingMember) {
      return {
        success: false,
        message: 'User is already a member of this project',
      };
    }

    // Add member
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: input.project_id,
        user_id: input.user_id,
        member_role: input.member_role,
      });

    if (memberError) {
      return {
        success: false,
        message: memberError.message || 'Failed to add project member',
      };
    }

    return {
      success: true,
      message: 'Member added successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}

export interface RemoveProjectMemberInput {
  project_id: string;
  user_id: string;
}

export interface RemoveProjectMemberResult {
  success: boolean;
  message: string;
}

/**
 * Removes a user from a project.
 */
export async function removeProjectMember(
  input: RemoveProjectMemberInput
): Promise<RemoveProjectMemberResult> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: 'Not authenticated',
      };
    }

    // Verify current user has admin permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');

    if (!isAdmin) {
      return {
        success: false,
        message: 'Insufficient permissions. Admin access required.',
      };
    }

    // Verify project exists and belongs to user's org
    const { data: profile } = await supabase
      .from('users_profile')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return {
        success: false,
        message: 'User profile not found',
      };
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, org_id')
      .eq('id', input.project_id)
      .eq('org_id', profile.org_id)
      .single();

    if (!project) {
      return {
        success: false,
        message: 'Project not found or does not belong to your organization',
      };
    }

    // Remove member
    const { error: memberError } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', input.project_id)
      .eq('user_id', input.user_id);

    if (memberError) {
      return {
        success: false,
        message: memberError.message || 'Failed to remove project member',
      };
    }

    return {
      success: true,
      message: 'Member removed successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}

export interface DeleteProjectResult {
  success: boolean;
  message: string;
}

/**
 * Permanently deletes a project.
 * WARNING: This is a hard delete and cannot be undone.
 * All related tickets, project members, and other related data will be deleted via CASCADE.
 */
export async function deleteProject(projectId: string): Promise<DeleteProjectResult> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: 'Not authenticated',
      };
    }

    // Only admins can permanently delete projects
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');

    if (!isAdmin) {
      return {
        success: false,
        message: 'Insufficient permissions. Admin access required for permanent deletion.',
      };
    }

    // Get project for audit log
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      return {
        success: false,
        message: 'Project not found',
      };
    }

    // Verify project belongs to user's org
    const { data: profile } = await supabase
      .from('users_profile')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!profile || project.org_id !== profile.org_id) {
      return {
        success: false,
        message: 'Project not found or does not belong to your organization',
      };
    }

    // Create audit log entry before deletion
    await supabase.from('audit_log').insert({
      org_id: project.org_id,
      actor_id: user.id,
      action: 'project.deleted',
      entity_type: 'project',
      entity_id: projectId,
      before: project,
      after: null,
    });

    // Delete the project (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      return {
        success: false,
        message: deleteError.message || 'Failed to delete project',
      };
    }

    return {
      success: true,
      message: 'Project deleted successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}

