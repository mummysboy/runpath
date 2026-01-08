import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ClientsContent from './ClientsContent';

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('*, roles(*)')
    .eq('user_id', user.id);

  const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'Admin');

  if (!isAdmin) {
    redirect('/app');
  }

  const { data: profile } = await supabase
    .from('users_profile')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Get all clients
  const { data: clients } = await supabase
    .from('clients')
    .select('*, projects(count)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false });

  return <ClientsContent clients={clients || []} orgId={profile.org_id} />;
}

