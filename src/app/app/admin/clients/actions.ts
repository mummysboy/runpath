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

