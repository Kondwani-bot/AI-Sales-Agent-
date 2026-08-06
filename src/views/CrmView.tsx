import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LeadTable } from '../components/LeadTable';
import { LeadProfileModal } from '../components/LeadProfileModal';
import { Building, Database } from 'lucide-react';

export const CrmView: React.FC = () => {
  const { leads, campaigns, selectedLeadId, setSelectedLeadId } = useApp();

  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');

  const uniqueIndustries = Array.from(new Set(leads.map((l) => l.industry))).filter(Boolean);

  const filteredLeads = leads.filter((lead) => {
    const matchesCampaign = campaignFilter === 'all' || lead.campaignId === campaignFilter;
    const matchesIndustry = industryFilter === 'all' || lead.industry === industryFilter;
    return matchesCampaign && matchesIndustry;
  });

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Leads</h1>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {leads.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500">
            View and manage discovered leads.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Industries</option>
              {uniqueIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <LeadTable leads={filteredLeads} onSelectLead={(id) => setSelectedLeadId(id)} showCampaignFilter={true} />

      {/* Selected Lead Modal */}
      {selectedLeadId && (
        <LeadProfileModal lead={selectedLead} onClose={() => setSelectedLeadId(null)} />
      )}
    </div>
  );
};

