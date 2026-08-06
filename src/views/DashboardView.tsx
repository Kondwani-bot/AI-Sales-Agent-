import React from 'react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/StatCard';
import { CampaignCard } from '../components/CampaignCard';
import {
  PlusCircle,
  Activity,
  Users,
  CheckCircle2,
  Mail,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { campaigns, leads, setCurrentView, setSelectedCampaignId } = useApp();

  const activeCampaignsCount = campaigns.filter((c) => c.status === 'running').length;
  const totalLeadsFound = leads.length;
  const highPriorityLeadsCount = leads.filter((l) => l.priorityLevel === 'High').length;
  const draftEmailsCreatedCount = leads.filter((l) => l.emailStatus === 'Drafted' || l.emailStatus === 'Ready').length;

  const handleSelectCampaign = (id: string) => {
    setSelectedCampaignId(id);
    setCurrentView('campaign-details');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500">Overview of active prospecting campaigns and leads.</p>
        </div>

        <button
          onClick={() => setCurrentView('new-campaign')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Campaigns"
          value={activeCampaignsCount}
          subtitle={`${campaigns.length} total`}
          icon={<Activity className="w-5 h-5 text-blue-600" />}
          accentColor="blue"
        />
        <StatCard
          title="Total Leads"
          value={totalLeadsFound}
          subtitle="Discovered"
          icon={<Users className="w-5 h-5 text-indigo-600" />}
          accentColor="indigo"
        />
        <StatCard
          title="High Priority"
          value={highPriorityLeadsCount}
          subtitle="Score > 80"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          accentColor="emerald"
        />
        <StatCard
          title="Outreach Drafts"
          value={draftEmailsCreatedCount}
          subtitle="Ready to send"
          icon={<Mail className="w-5 h-5 text-purple-600" />}
          accentColor="purple"
        />
      </div>

      {/* Campaigns Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Campaigns</h2>
          <button
            onClick={() => setCurrentView('new-campaign')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            + New
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No campaigns yet</p>
              <p className="text-xs text-slate-500 mt-0.5">Start a new campaign to discover target prospects.</p>
            </div>
            <button
              onClick={() => setCurrentView('new-campaign')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Start New Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((camp) => (
              <CampaignCard key={camp.id} campaign={camp} onSelect={handleSelectCampaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

