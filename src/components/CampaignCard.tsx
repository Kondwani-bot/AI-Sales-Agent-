import React from 'react';
import { Campaign } from '../types';
import { useApp } from '../context/AppContext';
import {
  Activity,
  CheckCircle2,
  Pause,
  Play,
  Trash2,
  Users,
  ArrowRight,
  Globe,
  Sparkles,
} from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
  onSelect: (campaignId: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onSelect }) => {
  const { pauseCampaign, deleteCampaign } = useApp();

  let statusBadge = (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
      Draft
    </span>
  );

  if (campaign.status === 'running') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
        In Progress ({campaign.progress}%)
      </span>
    );
  } else if (campaign.status === 'completed') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Completed
      </span>
    );
  } else if (campaign.status === 'paused') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
        <Pause className="w-3 h-3 text-amber-600" />
        Paused
      </span>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h4
              onClick={() => onSelect(campaign.id)}
              className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
            >
              {campaign.name}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-400" />
                {campaign.targetCountry}
              </span>
              <span>•</span>
              <span className="truncate max-w-[140px]">{campaign.targetIndustry}</span>
            </div>
          </div>
          {statusBadge}
        </div>

        {/* Prompt snippet */}
        <p className="text-xs text-slate-600 line-clamp-2 my-3 bg-slate-50 p-2.5 rounded-xl italic border border-slate-100">
          "{campaign.prompt}"
        </p>

        {/* Progress Bar */}
        <div className="my-3 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">{campaign.currentStage}</span>
            <span className="font-semibold text-slate-700">{campaign.progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                campaign.status === 'completed'
                  ? 'bg-emerald-500'
                  : campaign.status === 'running'
                  ? 'bg-blue-600'
                  : 'bg-slate-300'
              }`}
              style={{ width: `${campaign.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Lead Stats */}
        <div className="grid grid-cols-3 gap-2 py-2.5 my-2 border-y border-slate-100 text-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Leads Found</p>
            <p className="text-sm font-bold text-slate-800">{campaign.totalLeadsFound}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">High Priority</p>
            <p className="text-sm font-bold text-blue-600">{campaign.highPriorityCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Emails Drafted</p>
            <p className="text-sm font-bold text-slate-800">{campaign.draftEmailsCount}</p>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 mt-2 text-xs">
        <span className="text-[11px] text-slate-400">
          Created {new Date(campaign.createdAt).toLocaleDateString()}
        </span>

        <div className="flex items-center gap-1.5">
          {campaign.status === 'running' && (
            <button
              onClick={() => pauseCampaign(campaign.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="Pause Campaign"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}

          {campaign.status === 'paused' && (
            <button
              onClick={() => pauseCampaign(campaign.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Resume Campaign"
            >
              <Play className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => deleteCampaign(campaign.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Campaign"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelect(campaign.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-medium text-xs transition-colors"
          >
            <span>View Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
