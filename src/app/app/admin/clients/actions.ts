'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';

export interface CreateClientInput {
  name: string;
  billing_type?: 'hourly' | 'fixed' | 'retainer' | 'custom';
  status?: 'active' | 'inactive' | 'prospect';
}

export interface CreateClientResult {
  success: boolean;
  message: string;
  clientId?: string;
}

/**
 * Creates a new client for the organization.
 */
export async function createClient(
  input: CreateClientInput,
  orgId: string
): Promise<CreateClientResult> {
  try {
    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      return {
        success: false,
        message: 'Client name is required',
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

    // Create client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        org_id: orgId,
        name: input.name.trim(),
        billing_type: input.billing_type || 'hourly',
        status: input.status || 'active',
      })
      .select()
      .single();

    if (clientError) {
      return {
        success: false,
        message: clientError.message || 'Failed to create client',
      };
    }

    return {
      success: true,
      message: 'Client created successfully',
      clientId: client.id,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}

export interface DeleteClientResult {
  success: boolean;
  message: string;
}

/**
 * Permanently deletes a client.
 * WARNING: This is a hard delete and cannot be undone.
 * All related projects, tickets, and other related data will be deleted via CASCADE.
 */
export async function deleteClient(clientId: string): Promise<DeleteClientResult> {
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

    // Only admins can permanently delete clients
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

    // Get client for audit log
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (!client) {
      return {
        success: false,
        message: 'Client not found',
      };
    }

    // Verify client belongs to user's org
    const { data: profile } = await supabase
      .from('users_profile')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!profile || client.org_id !== profile.org_id) {
      return {
        success: false,
        message: 'Client not found or does not belong to your organization',
      };
    }

    // Create audit log entry before deletion
    await supabase.from('audit_log').insert({
      org_id: client.org_id,
      actor_id: user.id,
      action: 'client.deleted',
      entity_type: 'client',
      entity_id: clientId,
      before: client,
      after: null,
    });

    // Delete the client (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (deleteError) {
      return {
        success: false,
        message: deleteError.message || 'Failed to delete client',
      };
    }

    return {
      success: true,
      message: 'Client deleted successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}

