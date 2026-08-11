import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building,
  Mail,
  Webhook,
  FileSpreadsheet,
  Save,
  Globe,
  Sparkles,
  ShieldCheck,
  Brain,
  Tag,
  Database,
  Code,
  Copy,
  Check,
  RefreshCw,
  Send,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, campaigns, leads, showToast } = useApp();

  const [formData, setFormData] = useState(settings);
  const [mainTab, setMainTab] = useState<'memory' | 'sender' | 'integrations'>('memory');
  const [integrationSubTab, setIntegrationSubTab] = useState<'supabase' | 'googleScript' | 'webhooks'>('supabase');

  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [sqlContent, setSqlContent] = useState('');
  const [gasCode, setGasCode] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState(settings.senderEmail || 'kondwanimbewe111@gmail.com');

  useEffect(() => {
    checkSupabase();
    fetchSqlAndScript();
  }, []);

  const checkSupabase = async () => {
    setIsCheckingSupabase(true);
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setSupabaseStatus(data);
    } catch {
      setSupabaseStatus({ connected: false, message: 'Could not reach server status endpoint' });
    } finally {
      setIsCheckingSupabase(false);
    }
  };

  const fetchSqlAndScript = async () => {
    try {
      const [sqlRes, gasRes] = await Promise.all([
        fetch('/api/supabase/schema'),
        fetch('/api/google-script/code'),
      ]);
      const sqlData = await sqlRes.json();
      const gasData = await gasRes.json();

      if (sqlData.sql) setSqlContent(sqlData.sql);
      if (gasData.code) setGasCode(gasData.code);
    } catch (e) {
      console.error('Error fetching schemas:', e);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    try {
      const contacts = leads.flatMap((l) => l.contacts || []);
      const activeCampaign = campaigns[0];

      const res = await fetch('/api/supabase/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign: activeCampaign,
          leads,
          contacts,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          'Supabase Synced',
          `Successfully synced ${data.leadsSyncedCount} leads to Supabase tables!`,
          'success'
        );
      } else {
        showToast(
          'Sync Warning',
          data.error || 'Please run the SQL schema script in Supabase SQL Editor first.',
          'warning'
        );
      }
    } catch (err: any) {
      showToast(
        'Sync Error',
        err.message,
        'error'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestEmailDispatch = async () => {
    setIsSendingTestEmail(true);
    try {
      const res = await fetch('/api/email/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: testEmailRecipient,
          recipientName: 'Valued Client',
          companyName: 'Test Target Corp',
          subject: 'AI Sales Agent Test Dispatch',
          body: `Hi there,\n\nThis is a test cold email dispatch sent directly from your AI Sales Agent app using ${formData.googleAppsScriptUrl ? 'Google Apps Script Gmail Web App' : 'the built-in free dispatcher'}.\n\nBest regards,\n${formData.senderName || 'AI Sales Agent'}`,
          scriptUrl: formData.googleAppsScriptUrl,
          senderName: formData.senderName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          'Email Dispatched',
          data.message || `Test email sent to ${testEmailRecipient}!`,
          'success'
        );
      } else {
        showToast(
          'Email Warning',
          data.message || 'Error dispatching test email.',
          'warning'
        );
      }
    } catch (err: any) {
      showToast(
        'Email Error',
        err.message,
        'error'
      );
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const copyToClipboard = (text: string, type: 'sql' | 'script') => {
    navigator.clipboard.writeText(text);
    if (type === 'sql') {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
    showToast(
      'Copied to Clipboard',
      'Code snippet copied successfully!',
      'success'
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    showToast(
      'Settings Saved',
      'Your Business Knowledge Base and integration settings have been saved.',
      'success'
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Business Knowledge Base</h1>
              <p className="text-xs text-slate-500">
                Your AI agent's permanent memory. Every lead score and outreach email uses this context.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save Knowledge Base</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 border gap-1 text-xs font-medium overflow-x-auto">
        <button
          type="button"
          onClick={() => setMainTab('memory')}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            mainTab === 'memory'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Business Knowledge Base</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('sender')}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            mainTab === 'sender'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Outreach Persona</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('integrations')}
          className={`py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            mainTab === 'integrations'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Integrations & Database</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
        {mainTab === 'memory' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Core Business Profile</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName || ''}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Apex Growth Lab"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Website URL</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://apexgrowthlab.io"
                      className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Company Summary & Mission</label>
                <textarea
                  rows={3}
                  value={formData.companyDescription || ''}
                  onChange={(e) => setFormData({ ...formData, companyDescription: e.target.value })}
                  placeholder="Describe what your company does, who you serve, and your overall mission..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Products & Services Offered</label>
                <input
                  type="text"
                  value={formData.productsAndServices || ''}
                  onChange={(e) => setFormData({ ...formData, productsAndServices: e.target.value })}
                  placeholder="e.g. AI Customer Support Chatbots, Website Automation, Outbound Prospecting Engine"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Industries Served</label>
                  <input
                    type="text"
                    value={formData.industriesServed || ''}
                    onChange={(e) => setFormData({ ...formData, industriesServed: e.target.value })}
                    placeholder="Education, Construction, Hospitality, Logistics"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Ideal Customer Profile (ICP)</label>
                  <input
                    type="text"
                    value={formData.idealCustomers || ''}
                    onChange={(e) => setFormData({ ...formData, idealCustomers: e.target.value })}
                    placeholder="Mid-sized enterprises seeking 24/7 lead qualification"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Sales Positioning & Objections</span>
              </h3>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Unique Selling Points (USPs)</label>
                <input
                  type="text"
                  value={formData.uniqueSellingPoints || ''}
                  onChange={(e) => setFormData({ ...formData, uniqueSellingPoints: e.target.value })}
                  placeholder="24/7 instant AI response, seamless CRM integration, 95%+ email accuracy"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Pricing / Offer Range</label>
                  <input
                    type="text"
                    value={formData.pricingOfferRange || ''}
                    onChange={(e) => setFormData({ ...formData, pricingOfferRange: e.target.value })}
                    placeholder="$1,500 - $5,000 / month based on automation scope"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Key Competitors</label>
                  <input
                    type="text"
                    value={formData.competitors || ''}
                    onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                    placeholder="Traditional manual SDR teams, basic static chatbots"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Case Studies & Social Proof</label>
                <textarea
                  rows={3}
                  value={formData.caseStudies || ''}
                  onChange={(e) => setFormData({ ...formData, caseStudies: e.target.value })}
                  placeholder="Helped 40+ enterprises increase lead qualification speed by 300%..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Common FAQs & Objections</label>
                <textarea
                  rows={3}
                  value={formData.faqs || ''}
                  onChange={(e) => setFormData({ ...formData, faqs: e.target.value })}
                  placeholder="Q: How fast is setup? A: Under 48 hours."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {mainTab === 'sender' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Outreach Persona & Email Configuration</span>
            </h3>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-emerald-900">Gmail Integration Ready</p>
                  <p className="text-emerald-700 text-[11px]">Outreach emails can be dispatched directly using your sender identity.</p>
                </div>
              </div>

              <span className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg font-bold border border-emerald-200 text-[11px]">
                Connected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Sender Name</label>
                <input
                  type="text"
                  value={formData.senderName || ''}
                  onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                  placeholder="Alex Rivera"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Sender Email Address</label>
                <input
                  type="email"
                  value={formData.senderEmail || ''}
                  onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                  placeholder="alex@apexgrowthlab.io"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Sales Tone</label>
                <input
                  type="text"
                  value={formData.salesTone || ''}
                  onChange={(e) => setFormData({ ...formData, salesTone: e.target.value })}
                  placeholder="Consultative, Professional & High-Value"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Primary Call To Action (CTA)</label>
                <input
                  type="text"
                  value={formData.callToAction || ''}
                  onChange={(e) => setFormData({ ...formData, callToAction: e.target.value })}
                  placeholder="10-minute briefing call or customized video preview"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Email Signature</label>
              <textarea
                rows={3}
                value={formData.emailSignature || ''}
                onChange={(e) => setFormData({ ...formData, emailSignature: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
            </div>
          </div>
        )}

        {mainTab === 'integrations' && (
          <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold gap-1 w-fit">
              <button
                type="button"
                onClick={() => setIntegrationSubTab('supabase')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  integrationSubTab === 'supabase'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>Supabase Database</span>
              </button>

              <button
                type="button"
                onClick={() => setIntegrationSubTab('googleScript')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  integrationSubTab === 'googleScript'
                    ? 'bg-white text-amber-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Free Email Dispatcher</span>
              </button>

              <button
                type="button"
                onClick={() => setIntegrationSubTab('webhooks')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  integrationSubTab === 'webhooks'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Webhook className="w-3.5 h-3.5 text-blue-500" />
                <span>Webhooks & Backups</span>
              </button>
            </div>

            {integrationSubTab === 'supabase' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Supabase Database Connection</span>
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={checkSupabase}
                      disabled={isCheckingSupabase}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSupabase ? 'animate-spin' : ''}`} />
                      <span>Check Connection</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncToSupabase}
                      disabled={isSyncing}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>Sync Local Data Now</span>
                    </button>
                  </div>
                </div>

                {/* Supabase Connection Status Card */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="font-bold text-sm text-slate-100">Supabase Connected</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      vzgdlcxbbwckdkvqgjeh.supabase.co
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {supabaseStatus?.message || 'Database configured and ready for lead storage.'}
                  </p>
                </div>

                {/* SQL Setup Script Helper */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Code className="w-4 h-4 text-blue-600" />
                        Supabase Database Setup Script (schema.sql)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Copy and run this SQL script in your Supabase SQL Editor to create tables for campaigns, leads, decision makers, and email logs.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(sqlContent, 'sql')}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      {copiedSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] max-h-56 overflow-y-auto leading-relaxed border border-slate-800 select-all">
                    <pre>{sqlContent || '-- Loading schema.sql...'}</pre>
                  </div>
                </div>
              </div>
            )}

            {integrationSubTab === 'googleScript' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Free Gmail Outreach Dispatcher via Google Apps Script</span>
                  </h3>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(gasCode, 'script')}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedScript ? 'Copied Script!' : 'Copy Apps Script Code'}</span>
                  </button>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-900 space-y-2">
                  <h4 className="font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    Quick Setup Instructions (100% Free):
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 font-medium">
                    <li>Go to <a href="https://script.google.com" target="_blank" rel="noreferrer" className="underline font-bold text-blue-700">script.google.com</a> and click <strong>New project</strong>.</li>
                    <li>Paste the copied script into <code>Code.gs</code> and click <strong>Deploy &gt; New deployment</strong>.</li>
                    <li>Select <strong>Web App</strong>, set Execute as: <strong>Me</strong>, Who has access: <strong>Anyone</strong>.</li>
                    <li>Click <strong>Deploy</strong>, grant permission, and paste the generated <strong>Web App URL</strong> below!</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-800">Google Apps Script Web App URL</label>
                  <input
                    type="url"
                    value={formData.googleAppsScriptUrl || ''}
                    onChange={(e) => setFormData({ ...formData, googleAppsScriptUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-900">Test Cold Email Dispatcher</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={testEmailRecipient}
                      onChange={(e) => setTestEmailRecipient(e.target.value)}
                      placeholder="recipient@example.com"
                      className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleTestEmailDispatch}
                      disabled={isSendingTestEmail}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800">Apps Script Source Code (Code.gs)</h4>
                  <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] max-h-52 overflow-y-auto leading-relaxed border border-slate-800 select-all">
                    <pre>{gasCode || '// Loading Code.gs...'}</pre>
                  </div>
                </div>
              </div>
            )}

            {integrationSubTab === 'webhooks' && (
              <div className="space-y-6">
                <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-blue-600" />
                  <span>Make.com Webhook & CRM Sync</span>
                </h3>

                {/* Make.com Webhook */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Webhook className="w-4 h-4 text-blue-600" />
                      Make.com Webhook URL
                    </label>
                    <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                      Active Webhook Endpoint
                    </span>
                  </div>
                  <input
                    type="url"
                    value={formData.makeWebhookUrl || ''}
                    onChange={(e) => setFormData({ ...formData, makeWebhookUrl: e.target.value })}
                    placeholder="https://hook.eu1.make.com/..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    When an AI Job is launched, parameters and generated lead reports are dispatched to this endpoint.
                  </p>
                </div>

                {/* Google Sheets Database */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Google Sheets Sync URL
                  </label>
                  <input
                    type="url"
                    value={formData.googleSheetsUrl || ''}
                    onChange={(e) => setFormData({ ...formData, googleSheetsUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Live spreadsheet database for syncing contacts, scores, and outreach statuses.
                  </p>
                </div>

                {/* Gemini API Key */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Gemini AI Intelligence Engine
                  </label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-slate-800">Server-Side Gemini AI Active</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      gemini-3.6-flash
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Knowledge Base</span>
          </button>
        </div>
      </form>
    </div>
  );
};

