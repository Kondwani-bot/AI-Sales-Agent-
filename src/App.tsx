import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { DashboardView } from './views/DashboardView';
import { NewCampaignView } from './views/NewCampaignView';
import { CampaignDetailsView } from './views/CampaignDetailsView';
import { CrmView } from './views/CrmView';
import { TemplatesView } from './views/TemplatesView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';

function MainAppContent() {
  const { isAuthenticated } = useAuth();
  const { currentView } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-slate-100/60 font-sans text-slate-800 flex flex-col antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Main Body Layout with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpenMobile={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'new-campaign' && <NewCampaignView />}
          {currentView === 'campaign-details' && <CampaignDetailsView />}
          {currentView === 'crm' && <CrmView />}
          {currentView === 'templates' && <TemplatesView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </AuthProvider>
  );
}
