import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LeadTable } from '../components/LeadTable';
import { LeadProfileModal } from '../components/LeadProfileModal';
import {
  RefreshCw,
  Pause,
  Play,
  Trash2,
  Sparkles,
  ArrowLeft,
  Bot,
  Building,
  UserCheck,
  CheckCircle2,
  Clock,
  Lightbulb,
  FileText,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const CampaignDetailsView: React.FC = () => {
  const {
    activeCampaign,
    leads,
    selectedLeadId,
    setSelectedLeadId,
    setCurrentView,
    pauseCampaign,
    deleteCampaign,
    refreshCampaignDataFromWebhook,
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'decisionMakers' | 'companies'>('decisionMakers');

  if (!activeCampaign) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-semibold">No AI Job selected</p>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const campaignLeads = leads.filter((l) => l.campaignId === activeCampaign.id);
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCampaignDataFromWebhook(activeCampaign.id);
    setIsRefreshing(false);
  };

  // Thinking logs simulated or pulled from campaign execution
  const thinkingStreamLogs = [
    { time: '10:00:01', step: 'Knowledge Retrieval', msg: `Querying Business Knowledge Base context...` },
    { time: '10:00:04', step: 'Target Search', msg: `Searching target domains in ${activeCampaign.targetCountry || 'specified region'}...` },
    { time: '10:00:08', step: 'Site Scraping', msg: `Scraped website metadata, contact pages, and service offerings...` },
    { time: '10:00:12', step: 'Opportunity Scoring', msg: `Calculated pain point alignment and lead qualification scores.` },
    { time: '10:00:15', step: 'Executive Match', msg: `Identified and verified key decision maker profiles and direct emails.` },
    { time: '10:00:18', step: 'Outreach Generation', msg: `Generated personalized consultative value propositions.` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{activeCampaign.name}</h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {activeCampaign.targetCountry}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-lg">
              "{activeCampaign.prompt}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Results</span>
          </button>

          <button
            onClick={() => pauseCampaign(activeCampaign.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            {activeCampaign.status === 'running' ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-600" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-600" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            onClick={() => deleteCampaign(activeCampaign.id)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Job"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Point 3: AI Conversation Panel & Thinking Stream */}
      <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                AI Employee Thinking Stream
              </h3>
              <p className="text-[11px] text-slate-400">
                Stage: <span className="text-blue-400 font-semibold">{activeCampaign.currentStage}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              Live Reasoning
            </span>
            <span className="text-lg font-black text-blue-400 ml-2">{activeCampaign.progress}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${activeCampaign.progress}%` }}
          ></div>
        </div>

        {/* Thinking Stream Output Window */}
        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800/80 font-mono text-[11px] space-y-2 max-h-48 overflow-y-auto leading-relaxed">
          {thinkingStreamLogs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-3 text-slate-300">
              <span className="text-slate-500 shrink-0">{log.time}</span>
              <span className="text-blue-400 font-semibold shrink-0">[{log.step}]</span>
              <span className="text-slate-200">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Point 5: AI Opportunity Report & Strategic Insight */}
      {activeCampaign.opportunityReport && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              AI Market Opportunity Brief
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100/80 space-y-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase">Primary Industry Gap</span>
              <p className="font-semibold text-slate-800">{activeCampaign.opportunityReport.primaryIndustryGap}</p>
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100/80 space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Recommended Angle</span>
              <p className="font-semibold text-slate-800">{activeCampaign.opportunityReport.recommendedAngle}</p>
            </div>

            <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-100/80 space-y-1">
              <span className="text-[10px] font-bold text-purple-700 uppercase">Est. Outbound Conversion</span>
              <p className="font-semibold text-slate-800">{activeCampaign.opportunityReport.estimatedConversionRate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Point 6: Execution Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Execution Step Timeline
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Auto-generated steps</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className={`p-3 rounded-xl border ${activeCampaign.progress >= 20 ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <span className="text-[10px] block font-bold text-slate-400 mb-0.5">Step 1</span>
            <p className="font-bold">1. Web Search & Retrieval</p>
          </div>
          <div className={`p-3 rounded-xl border ${activeCampaign.progress >= 40 ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <span className="text-[10px] block font-bold text-slate-400 mb-0.5">Step 2</span>
            <p className="font-bold">2. Deep Site Scraping</p>
          </div>
          <div className={`p-3 rounded-xl border ${activeCampaign.progress >= 70 ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <span className="text-[10px] block font-bold text-slate-400 mb-0.5">Step 3</span>
            <p className="font-bold">3. Lead Scoring & Matching</p>
          </div>
          <div className={`p-3 rounded-xl border ${activeCampaign.progress >= 100 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <span className="text-[10px] block font-bold text-slate-400 mb-0.5">Step 4</span>
            <p className="font-bold">4. Email Crafting & Sync</p>
          </div>
        </div>
      </div>

      {/* Point 4: Separate Leads from Companies Toggle & Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Discovered Results ({campaignLeads.length})
            </h2>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium self-start">
            <button
              onClick={() => setViewMode('decisionMakers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'decisionMakers'
                  ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Decision Makers ({campaignLeads.length})</span>
            </button>

            <button
              onClick={() => setViewMode('companies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'companies'
                  ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>Target Companies ({campaignLeads.length})</span>
            </button>
          </div>
        </div>

        {viewMode === 'decisionMakers' ? (
          <LeadTable leads={campaignLeads} onSelectLead={(id) => setSelectedLeadId(id)} />
        ) : (
          /* Company Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaignLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {lead.companyName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{lead.industry} • {lead.location}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                    {lead.leadScore} Score
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {lead.websiteAnalysis}
                </p>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500 font-medium">Contact: {lead.decisionMaker.name}</span>
                  <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    View Brief <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lead Modal */}
      {selectedLeadId && (
        <LeadProfileModal lead={selectedLead} onClose={() => setSelectedLeadId(null)} />
      )}
    </div>
  );
};


