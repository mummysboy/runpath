import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SalesPage() {
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

  // Get sales opportunities
  const { data: opportunities } = await supabase
    .from('sales_opportunities')
    .select('*, clients(*)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-[#f7f9ff]">Sales Pipeline</h1>
          <p className="text-[#b7c1cf]">Track sales opportunities and deals</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition">
          + New Opportunity
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opportunities && opportunities.length > 0 ? (
          opportunities.map((opp: any) => (
            <div
              key={opp.id}
              className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold mb-2 text-[#f4f6fb]">{opp.title}</h3>
              <div className="space-y-2 text-sm">
                {opp.clients && (
                  <div>
                    <span className="text-[#9eacc2]">Client: </span>
                    <span className="text-[#d6dbe5]">{opp.clients.name}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#9eacc2]">Stage: </span>
                  <span className="text-[#d6dbe5] font-medium">{opp.stage}</span>
                </div>
                {opp.value && (
                  <div>
                    <span className="text-[#9eacc2]">Value: </span>
                    <span className="text-[#d6dbe5] font-medium">${opp.value.toLocaleString()}</span>
                  </div>
                )}
                {opp.probability !== null && (
                  <div>
                    <span className="text-[#9eacc2]">Probability: </span>
                    <span className="text-[#d6dbe5] font-medium">{opp.probability}%</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <p className="text-[#9eacc2] mb-4">No opportunities found</p>
            <p className="text-sm text-[#9eacc2]">
              Sales/CRM module is a placeholder. Implement pipeline management, deal tracking, and forecasting here.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-[#f4f6fb]">Sales Features (To Implement)</h2>
        <ul className="space-y-2 text-sm text-[#9eacc2] list-disc list-inside">
          <li>Pipeline stages and workflow management</li>
          <li>Deal value tracking and forecasting</li>
          <li>Sales activity logging</li>
          <li>Contact management and lead tracking</li>
          <li>Sales reporting and analytics</li>
        </ul>
      </div>
    </div>
  );
}

