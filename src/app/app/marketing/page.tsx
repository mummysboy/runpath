import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function MarketingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users_profile')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Get marketing campaigns
  const { data: campaigns } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Marketing Campaigns</h1>
          <p className="text-[#b7c1cf]">Manage marketing campaigns and campaigns</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition">
          + New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns && campaigns.length > 0 ? (
          campaigns.map((campaign: any) => (
            <div
              key={campaign.id}
              className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold mb-2 text-[#f4f6fb]">{campaign.name}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-[#9eacc2]">Type: </span>
                  <span className="text-[#d6dbe5] font-medium">{campaign.type}</span>
                </div>
                <div>
                  <span className="text-[#9eacc2]">Status: </span>
                  <span className="text-[#d6dbe5] font-medium">{campaign.status}</span>
                </div>
                {campaign.budget && (
                  <div>
                    <span className="text-[#9eacc2]">Budget: </span>
                    <span className="text-[#d6dbe5] font-medium">${campaign.budget.toLocaleString()}</span>
                  </div>
                )}
                {campaign.start_date && (
                  <div>
                    <span className="text-[#9eacc2]">Start: </span>
                    <span className="text-[#d6dbe5] font-medium">
                      {new Date(campaign.start_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <p className="text-[#9eacc2] mb-4">No campaigns found</p>
            <p className="text-sm text-[#9eacc2]">
              Marketing module is a placeholder. Implement campaign management, analytics, and reporting here.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-[#f4f6fb]">Marketing Features (To Implement)</h2>
        <ul className="space-y-2 text-sm text-[#9eacc2] list-disc list-inside">
          <li>Campaign creation and management</li>
          <li>Performance tracking and analytics</li>
          <li>Content calendar and scheduling</li>
          <li>Lead generation tracking</li>
          <li>ROI reporting and attribution</li>
        </ul>
      </div>
    </div>
  );
}

