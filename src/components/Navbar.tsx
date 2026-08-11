import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../constants';
import {
  Sparkles,
  Search,
  Bell,
  CheckCircle2,
  LogOut,
  User,
  Settings as SettingsIcon,
  Plus,
  RefreshCw,
  Menu,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { currentView, setCurrentView, settings, campaigns, showToast } = useApp();
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeCampaignsCount = campaigns.filter((c) => c.status === 'running').length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentView('crm');
      showToast('Searching CRM', `Filtering database for "${searchQuery}"`, 'info');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand Logo & Name */}
        <div
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight font-sans">
              {APP_NAME}
            </span>
          </div>
        </div>
      </div>

      {/* Center Search Input */}
      <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads, companies, or industries across campaigns..."
            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* CTA Button */}
        <button
          onClick={() => setCurrentView('new-campaign')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all hover:shadow-blue-500/30 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Campaign</span>
        </button>

        {/* Notifications Icon */}
        <button
          onClick={() => showToast('Notifications', 'System running smoothly. All automations operational.', 'info')}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-2 right-2 border-2 border-white"></span>
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors text-left"
          >
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
            />
            <div className="hidden md:block text-xs">
              <p className="font-semibold text-slate-800 leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500">{user?.companyName || 'Company'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setCurrentView('settings');
                  setShowUserDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <SettingsIcon className="w-4 h-4 text-slate-500" />
                <span>Account & Settings</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('templates');
                  setShowUserDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>Email Templates</span>
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => {
                  logout();
                  setShowUserDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
