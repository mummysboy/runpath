'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';

export interface CreateProjectInput {
  name: string;
  client_id: string;
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
}

export interface CreateProjectResult {
  success: boolean;
  message: string;
  projectId?: string;
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

    // Add creator as project member with admin role
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: userId,
        member_role: 'admin',
      });

    if (memberError) {
      // If adding member fails, still return success but log the error
      console.error('Failed to add creator as project member:', memberError);
    }

    return {
      success: true,
      message: 'Project created successfully',
      projectId: project.id,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}

