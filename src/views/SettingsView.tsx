import React, { useState } from 'react';
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
  DollarSign,
  Award,
  Users,
  MessageSquare,
  HelpCircle,
  FileText,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const [formData, setFormData] = useState(settings);
  const [activeTab, setActiveTab] = useState<'memory' | 'sales' | 'sender' | 'integrations'>('memory');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
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
          onClick={() => setActiveTab('memory')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'memory'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Core Business Info</span>
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'sales'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Sales & Offer Positioning</span>
        </button>

        <button
          onClick={() => setActiveTab('sender')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'sender'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Outreach & Persona</span>
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === 'integrations'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Webhook className="w-4 h-4" />
          <span>Make.com & Webhooks</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
        {activeTab === 'memory' && (
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
        )}

        {activeTab === 'sales' && (
          <div className="space-y-4">
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
        )}

        {activeTab === 'sender' && (
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

        {activeTab === 'integrations' && (
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

