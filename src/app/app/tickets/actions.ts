'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';

export interface ArchiveTicketResult {
  success: boolean;
  message: string;
}

/**
 * Archives a ticket (soft delete).
 */
export async function archiveTicket(ticketId: string): Promise<ArchiveTicketResult> {
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

    // Verify current user has admin permissions or is project admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');

    // Get ticket to check project membership
    const { data: ticket } = await supabase
      .from('tickets')
      .select('*, projects(*)')
      .eq('id', ticketId)
      .single();

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket not found',
      };
    }

    // Check if user is project admin
    const { data: projectMember } = await supabase
      .from('project_members')
      .select('member_role')
      .eq('project_id', ticket.project_id)
      .eq('user_id', user.id)
      .single();

    const isProjectAdmin = projectMember?.member_role === 'admin';

    if (!isAdmin && !isProjectAdmin) {
      return {
        success: false,
        message: 'Insufficient permissions. Admin or project admin access required.',
      };
    }

    // Archive the ticket
    const { error: archiveError } = await supabase
      .from('tickets')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    if (archiveError) {
      return {
        success: false,
        message: archiveError.message || 'Failed to archive ticket',
      };
    }

    // Create audit log entry
    await supabase.from('audit_log').insert({
      org_id: ticket.org_id,
      actor_id: user.id,
      action: 'ticket.archived',
      entity_type: 'ticket',
      entity_id: ticketId,
      before: { archived: false },
      after: { archived: true },
    });

    return {
      success: true,
      message: 'Ticket archived successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}

export interface UnarchiveTicketResult {
  success: boolean;
  message: string;
}

/**
 * Unarchives a ticket.
 */
export async function unarchiveTicket(ticketId: string): Promise<UnarchiveTicketResult> {
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

    // Verify current user has admin permissions or is project admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');

    // Get ticket to check project membership
    const { data: ticket } = await supabase
      .from('tickets')
      .select('*, projects(*)')
      .eq('id', ticketId)
      .single();

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket not found',
      };
    }

    // Check if user is project admin
    const { data: projectMember } = await supabase
      .from('project_members')
      .select('member_role')
      .eq('project_id', ticket.project_id)
      .eq('user_id', user.id)
      .single();

    const isProjectAdmin = projectMember?.member_role === 'admin';

    if (!isAdmin && !isProjectAdmin) {
      return {
        success: false,
        message: 'Insufficient permissions. Admin or project admin access required.',
      };
    }

    // Unarchive the ticket
    const { error: unarchiveError } = await supabase
      .from('tickets')
      .update({ archived: false, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    if (unarchiveError) {
      return {
        success: false,
        message: unarchiveError.message || 'Failed to unarchive ticket',
      };
    }

    // Create audit log entry
    await supabase.from('audit_log').insert({
      org_id: ticket.org_id,
      actor_id: user.id,
      action: 'ticket.unarchived',
      entity_type: 'ticket',
      entity_id: ticketId,
      before: { archived: true },
      after: { archived: false },
    });

    return {
      success: true,
      message: 'Ticket unarchived successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}

export interface DeleteTicketResult {
  success: boolean;
  message: string;
}

/**
 * Permanently deletes a ticket.
 * WARNING: This is a hard delete and cannot be undone.
 */
export async function deleteTicket(ticketId: string): Promise<DeleteTicketResult> {
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

    // Only admins can permanently delete tickets
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

    // Get ticket for audit log
    const { data: ticket } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket not found',
      };
    }

    // Create audit log entry before deletion
    await supabase.from('audit_log').insert({
      org_id: ticket.org_id,
      actor_id: user.id,
      action: 'ticket.deleted',
      entity_type: 'ticket',
      entity_id: ticketId,
      before: ticket,
      after: null,
    });

    // Delete the ticket (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);

    if (deleteError) {
      return {
        success: false,
        message: deleteError.message || 'Failed to delete ticket',
      };
    }

    return {
      success: true,
      message: 'Ticket deleted successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}
