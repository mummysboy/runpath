'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface InviteUserInput {
  email: string;
  fullName: string;
  roleIds: string[];
}

export interface InviteUserResult {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * Invites a new user to the organization.
 * Creates the user in auth.users, sends an invite email, creates a profile, and assigns roles.
 */
export async function inviteUser(
  input: InviteUserInput,
  orgId: string
): Promise<InviteUserResult> {
  try {
    // Validate input
    if (!input.email || !input.fullName) {
      return {
        success: false,
        message: 'Email and full name are required',
      };
    }

    if (!input.email.includes('@')) {
      return {
        success: false,
        message: 'Invalid email address',
      };
    }

    // Verify current user has admin permissions
    const supabase = await createClient();
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

    // Use admin client to create user
    const adminClient = createAdminClient();

    // Check if user already exists in auth
    // Supabase admin API: use listUsers() and filter by email
    // We'll paginate through results if needed, but typically checking first page is sufficient
    const { data: usersList, error: listError } = await adminClient.auth.admin.listUsers();

    let existingAuthUser: { user?: { id: string; email?: string } } | undefined;
    if (usersList?.users) {
      const foundUser = usersList.users.find((u) => u.email === input.email);
      if (foundUser) {
        existingAuthUser = { user: { id: foundUser.id, email: foundUser.email || undefined } };
      } else if (usersList.users.length >= 1000) {
        // If there are many users, we might need to check pagination
        // For now, we'll proceed and let the createUser call handle duplicates
        // This is a trade-off for performance
      }
    }

    // If user exists in auth, check if they're already in this org
    if (existingAuthUser?.user) {
      const { data: existingProfile } = await adminClient
        .from('users_profile')
        .select('*')
        .eq('user_id', existingAuthUser.user.id)
        .eq('org_id', orgId)
        .maybeSingle();

      if (existingProfile) {
        return {
          success: false,
          message: 'User is already a member of this organization',
        };
      }
      // User exists in auth but not in this org - we'll add them to this org
    }

    let userId: string;

    // If user doesn't exist in auth, create them
    if (!existingAuthUser?.user) {
      // Generate a secure random password (user will reset it via invite email)
      const randomPassword = generateSecurePassword();

      // Create user in auth.users
      const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
        email: input.email,
        password: randomPassword,
        email_confirm: false, // Will be confirmed when they click invite link
        user_metadata: {
          full_name: input.fullName,
        },
      });

      if (createError || !createdUser.user) {
        return {
          success: false,
          message: createError?.message || 'Failed to create user',
        };
      }

      userId = createdUser.user.id;
    } else {
      // User already exists in auth, use their existing account
      userId = existingAuthUser.user.id;
    }

    // Create or update user profile
    const { error: profileError } = await adminClient
      .from('users_profile')
      .upsert(
        {
          user_id: userId,
          org_id: orgId,
          full_name: input.fullName,
        },
        {
          onConflict: 'user_id',
        }
      );

    if (profileError) {
      // Only clean up if we just created the user
      if (!existingAuthUser?.user) {
        await adminClient.auth.admin.deleteUser(userId);
      }
      return {
        success: false,
        message: `Failed to create user profile: ${profileError.message}`,
      };
    }

    // Assign roles if provided
    if (input.roleIds && input.roleIds.length > 0) {
      const roleAssignments = input.roleIds.map((roleId) => ({
        user_id: userId,
        role_id: roleId,
        scope_type: 'org' as const,
        scope_id: null,
      }));

      const { error: roleError } = await adminClient
        .from('user_roles')
        .insert(roleAssignments);

      if (roleError) {
        console.error('Failed to assign roles:', roleError);
        // Don't fail the whole operation if role assignment fails
        // The user can still be assigned roles manually
      }
    }

    // Send invite email (only if user was just created, or resend if they already exist)
    if (!existingAuthUser?.user) {
      // New user - send invite email
      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(input.email, {
        data: {
          full_name: input.fullName,
        },
      });

      if (inviteError) {
        console.error('Failed to send invite email:', inviteError);
        // Don't fail the whole operation - user is created and can be manually invited
        return {
          success: true,
          message: 'User created successfully, but invite email failed to send. You may need to resend the invite.',
          userId,
        };
      }
    } else {
      // Existing user - send magic link or password reset instead
      // For now, we'll just notify that they need to be informed manually
      // In a production app, you might want to send a different email
    }

    // Revalidate the users page
    revalidatePath('/app/admin/users');

    const successMessage = existingAuthUser?.user
      ? 'User added to organization successfully! You may want to notify them to log in with their existing account.'
      : 'User invited successfully! They will receive an email with setup instructions.';

    return {
      success: true,
      message: successMessage,
      userId,
    };
  } catch (error: any) {
    console.error('Error inviting user:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}

/**
 * Generates a secure random password.
 * Users will reset this via the invite email.
 */
function generateSecurePassword(): string {
  const length = 32;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (x) => charset[x % charset.length]).join('');
}

