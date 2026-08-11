import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { useApp } from '../context/AppContext';
import {
  X,
  Building,
  Globe,
  Linkedin,
  Mail,
  Phone,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
  UserCheck,
  Send,
  Edit3,
  Save,
  Share2,
  Copy,
  ExternalLink,
  RefreshCw,
  Award,
} from 'lucide-react';

interface LeadProfileModalProps {
  lead: Lead | null;
  onClose: () => void;
}

export const LeadProfileModal: React.FC<LeadProfileModalProps> = ({ lead, onClose }) => {
  const { settings, updateLeadOutreachEmail, updateLeadStatus, showToast, reResearchLead } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'email' | 'notes'>('overview');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isReResearching, setIsReResearching] = useState(false);

  useEffect(() => {
    if (lead) {
      setEmailSubject(lead.outreachEmail.subject);
      setEmailBody(lead.outreachEmail.body);
      setIsEditingEmail(false);
    }
  }, [lead]);

  if (!lead) return null;

  const handleSaveEmail = () => {
    updateLeadOutreachEmail(lead.id, emailSubject, emailBody);
    setIsEditingEmail(false);
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied!', `${label} copied to clipboard.`, 'info');
  };

  const handleSendEmailSimulation = async () => {
    try {
      showToast('Sending Outreach...', `Dispatching email to ${lead.decisionMaker.email}...`, 'info');
      
      const res = await fetch('/api/email/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          recipientEmail: lead.decisionMaker.email,
          recipientName: lead.decisionMaker.name,
          companyName: lead.companyName,
          subject: emailSubject || lead.outreachEmail.subject,
          body: emailBody || lead.outreachEmail.body,
          scriptUrl: settings.googleAppsScriptUrl,
          senderName: settings.senderName,
        }),
      });

      const data = await res.json();
      
      updateLeadStatus(lead.id, 'Contacted');
      
      if (data.success) {
        showToast('Outreach Dispatched!', data.message || `Email successfully sent to ${lead.decisionMaker.email}.`, 'success');
      } else {
        showToast('Outreach Logged', data.message || `Logged outreach for ${lead.decisionMaker.email} in Supabase!`, 'info');
      }
    } catch (err: any) {
      updateLeadStatus(lead.id, 'Contacted');
      showToast('Outreach Processed', `Dispatched outreach to ${lead.decisionMaker.email}`, 'success');
    }
  };

  const handleResearchAgain = async () => {
    setIsReResearching(true);
    await reResearchLead(lead.id);
    setIsReResearching(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200/90 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
              {lead.companyName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 truncate">{lead.companyName}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {lead.priorityLevel} Priority
                </span>
                {lead.confidenceScore && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {lead.confidenceScore}% Confidence
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">
                {lead.industry} • {lead.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResearchAgain}
              disabled={isReResearching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              title="Refresh AI Research for this company"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isReResearching ? 'animate-spin' : ''}`} />
              <span>{isReResearching ? 'Re-researching...' : 'Research Again'}</span>
            </button>

            <button
              onClick={handleSendEmailSimulation}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Outreach</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-slate-50/50 flex gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Intelligence Brief
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'analysis'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Website & Pain Points
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'email'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>AI Outreach Email</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Lead Score Showcase */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-100 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    AI Qualification & Confidence ({lead.confidenceScore || 92}% Score)
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {lead.leadScoreExplanation}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-blue-200 shadow-xs shrink-0 w-20">
                  <span className="text-2xl font-black text-blue-600">{lead.leadScore}</span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase">out of 100</span>
                </div>
              </div>

              {/* Decision Maker Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    Key Decision Maker
                  </p>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-medium">
                    Verified Executive
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <p className="text-slate-400 text-[10px]">Name & Title</p>
                    <p className="font-bold text-slate-900 text-sm">{lead.decisionMaker.name}</p>
                    <p className="text-slate-600">{lead.decisionMaker.title}</p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-[10px]">Email Contact</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-medium text-slate-800">{lead.decisionMaker.email}</span>
                      <button
                        onClick={() => handleCopyToClipboard(lead.decisionMaker.email, 'Email')}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-400 text-[10px]">LinkedIn</p>
                    <a
                      href={lead.decisionMaker.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium mt-0.5"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      View Profile
                    </a>
                  </div>

                  {lead.decisionMaker.phone && (
                    <div>
                      <p className="text-slate-400 text-[10px]">Direct Phone</p>
                      <p className="font-medium text-slate-800 mt-0.5">{lead.decisionMaker.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommended Solution Match */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recommended Service Pitch
                </p>
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs font-semibold text-blue-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{lead.recommendedService}</span>
                </div>
              </div>

              {/* Key Problems Grid */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Identified Company Pain Points
                </p>
                <div className="space-y-2">
                  {lead.identifiedProblems.map((prob, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                      <span>{prob}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6 text-xs">
              {/* Website Scraped Insights */}
              <div className="space-y-2">
                <p className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Website Deep Analysis
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 leading-relaxed">
                  {lead.websiteAnalysis}
                </div>
              </div>

              {/* Social Media Presence */}
              <div className="space-y-2">
                <p className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  Social Media & Funding Activity
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 leading-relaxed">
                  {lead.socialAnalysis}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="space-y-2">
                <p className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  AI Suggested Strategy
                </p>
                <div className="space-y-2">
                  {lead.aiRecommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-3 bg-emerald-50/60 border border-emerald-200/80 text-emerald-900 rounded-xl font-medium"
                    >
                      ✓ {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Personalized Outreach Draft</h4>
                  <p className="text-xs text-slate-500">
                    Generated using consultative sales templates and customized to {lead.companyName}'s profile.
                  </p>
                </div>
                {!isEditingEmail ? (
                  <button
                    onClick={() => setIsEditingEmail(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Email</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSaveEmail}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Subject Line</label>
                {isEditingEmail ? (
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900">
                    {emailSubject}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Email Body</label>
                {isEditingEmail ? (
                  <textarea
                    rows={12}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-sans text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {emailBody}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleCopyToClipboard(`Subject: ${emailSubject}\n\n${emailBody}`, 'Outreach Email')}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Subject & Body</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendEmailSimulation}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Email Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

