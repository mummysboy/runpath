import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminBillingPage() {
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

  // Get billing profiles
  const { data: billingProfiles } = await supabase
    .from('billing_profiles')
    .select('*, clients(*), projects(*)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Billing</h1>
          <p className="text-[#b7c1cf]">Manage billing profiles and invoicing</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition">
          + New Billing Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {billingProfiles && billingProfiles.length > 0 ? (
          billingProfiles.map((profile: any) => (
            <div
              key={profile.id}
              className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold mb-2 text-[#f4f6fb]">{profile.name}</h3>
              <div className="space-y-2 text-sm">
                {profile.clients && (
                  <div>
                    <span className="text-[#9eacc2]">Client: </span>
                    <span className="text-[#d6dbe5]">{profile.clients.name}</span>
                  </div>
                )}
                {profile.projects && (
                  <div>
                    <span className="text-[#9eacc2]">Project: </span>
                    <span className="text-[#d6dbe5]">{profile.projects.name}</span>
                  </div>
                )}
                {profile.billing_rate && (
                  <div>
                    <span className="text-[#9eacc2]">Rate: </span>
                    <span className="text-[#d6dbe5]">
                      {profile.currency} {profile.billing_rate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <p className="text-[#9eacc2] mb-4">No billing profiles found</p>
            <p className="text-sm text-[#9eacc2]">
              Billing module is a placeholder. Implement invoice generation, payment tracking, and reporting here.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-[#f4f6fb]">Billing Features (To Implement)</h2>
        <ul className="space-y-2 text-sm text-[#9eacc2] list-disc list-inside">
          <li>Invoice generation and PDF export</li>
          <li>Payment tracking and reconciliation</li>
          <li>Recurring billing setup</li>
          <li>Revenue reporting and analytics</li>
          <li>Payment gateway integration</li>
        </ul>
      </div>
    </div>
  );
}

