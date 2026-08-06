import React from 'react';
import { useApp } from '../context/AppContext';
import { ViewMode } from '../types';
import {
  LayoutDashboard,
  PlusCircle,
  Activity,
  Users,
  Mail,
  Settings,
  Sparkles,
  ChevronRight,
  Database,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { currentView, setCurrentView, campaigns, leads, selectedCampaignId } = useApp();

  const totalLeads = leads.length;
  const runningCampaigns = campaigns.filter((c) => c.status === 'running').length;

  const navItems: {
    id: ViewMode;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'new-campaign',
      label: 'New AI Job',
      icon: <PlusCircle className="w-4 h-4 text-blue-600" />,
      badge: 'Chat AI',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'campaign-details',
      label: 'AI Jobs & Monitor',
      icon: <Activity className="w-4 h-4" />,
      badge: runningCampaigns > 0 ? `${runningCampaigns} Live` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-700 animate-pulse',
    },
    {
      id: 'crm',
      label: 'CRM & All Leads',
      icon: <Users className="w-4 h-4" />,
      badge: totalLeads > 0 ? totalLeads : undefined,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'templates',
      label: 'Email Templates',
      icon: <Mail className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Knowledge Base & Webhooks',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleNavClick = (view: ViewMode) => {
    setCurrentView(view);
    if (onCloseMobile) onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-50/80 border-r border-slate-200/80 w-64 p-3 select-none">
      {/* Upper Navigation List */}
      <div className="flex-1 space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Campaigns Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Recent AI Jobs
            </p>
            <button
              onClick={() => handleNavClick('new-campaign')}
              className="text-[10px] font-semibold text-blue-600 hover:underline"
            >
              + New Job
            </button>
          </div>
          <div className="space-y-1">
            {campaigns.slice(0, 4).map((c) => {
              const isSelected = currentView === 'campaign-details' && selectedCampaignId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    handleNavClick('campaign-details');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all group ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-200/80 text-blue-900 font-medium'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        c.status === 'completed'
                          ? 'bg-emerald-500'
                          : c.status === 'running'
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-slate-300'
                      }`}
                    ></span>
                    <span className="truncate text-xs">{c.name}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Banner Info */}
      <div className="mt-auto pt-4 border-t border-slate-200/80">
        <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100 text-xs">
          <div className="flex items-center gap-2 text-blue-800 font-semibold mb-1">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Make.com Pipeline</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
            Campaigns automatically trigger webhooks and sync leads with Google Sheets.
          </p>
          <button
            onClick={() => handleNavClick('settings')}
            className="w-full py-1.5 px-2 bg-white hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-[11px] font-semibold rounded-lg transition-colors shadow-2xs"
          >
            Configure Webhook URL
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0">{content}</aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          ></div>
          <div className="relative z-10 w-64 max-w-xs bg-white h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
