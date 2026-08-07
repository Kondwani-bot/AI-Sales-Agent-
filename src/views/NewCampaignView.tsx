import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Send,
  History,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowRight,
  Bot,
  User,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';

export const NewCampaignView: React.FC = () => {
  const {
    createNewCampaign,
    startCampaignExecution,
    setCurrentView,
    settings,
    promptHistory,
    addPromptToHistory,
    parseNaturalLanguagePrompt,
  } = useApp();

  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');

  // Parsed AI Job Plan
  const [parsedPlan, setParsedPlan] = useState<{
    targetIndustry: string;
    targetCountry: string;
    leadCount: number;
    services: string[];
    summaryPlan: string;
  } | null>(null);

  // Manual override controls
  const [targetIndustry, setTargetIndustry] = useState('');
  const [targetCountry, setTargetCountry] = useState('Global');
  const [leadLimit, setLeadLimit] = useState(20);

  const samplePrompts = [
    {
      title: 'Zambia Construction AI Support',
      prompt: 'Find construction companies in Zambia that would benefit from AI-powered customer support and website automation.',
    },
    {
      title: 'Zambia Private Schools Chatbot',
      prompt: 'Find 50 private schools in Zambia that could benefit from an AI chatbot and email marketing.',
    },
    {
      title: 'South Africa Logistics Automation',
      prompt: 'Identify logistics and freight companies in South Africa looking for fleet scheduling and client intake automation.',
    },
    {
      title: 'US & UK HealthTech Prospecting',
      prompt: 'Discover mid-market digital health platforms in the US and UK that need HIPAA-compliant intake AI and appointment bots.',
    },
  ];

  const handleSelectPrompt = async (pText: string) => {
    setPrompt(pText);
    setIsAnalyzing(true);
    const result = await parseNaturalLanguagePrompt(pText);
    setParsedPlan(result);
    if (result.targetIndustry) setTargetIndustry(result.targetIndustry);
    if (result.targetCountry) setTargetCountry(result.targetCountry);
    if (result.leadCount) setLeadLimit(result.leadCount);
    setIsAnalyzing(false);
  };

  const handleAnalyzePrompt = async () => {
    if (!prompt.trim()) return;
    setIsAnalyzing(true);
    const result = await parseNaturalLanguagePrompt(prompt);
    setParsedPlan(result);
    if (result.targetIndustry) setTargetIndustry(result.targetIndustry);
    if (result.targetCountry) setTargetCountry(result.targetCountry);
    if (result.leadCount) setLeadLimit(result.leadCount);
    setIsAnalyzing(false);
  };

  const handleLaunchJob = async () => {
    if (!prompt.trim() && !targetIndustry.trim()) return;

    setIsLaunching(true);

    const finalIndustry = targetIndustry || parsedPlan?.targetIndustry || 'B2B Services';
    const finalCountry = targetCountry || parsedPlan?.targetCountry || 'Zambia';
    const finalLimit = leadLimit || parsedPlan?.leadCount || 20;

    addPromptToHistory(prompt, {
      targetIndustry: finalIndustry,
      targetCountry: finalCountry,
      leadCount: finalLimit,
    });

    try {
      const newJob = await createNewCampaign({
        prompt: prompt || `Find ${finalIndustry} leads in ${finalCountry}`,
        name: `AI Job: ${finalIndustry} (${finalCountry})`,
        businessName: settings.businessName,
        productsAndServices: settings.productsAndServices,
        targetIndustry: finalIndustry,
        targetCountry: finalCountry,
        leadLimit: finalLimit,
      });

      await startCampaignExecution(newJob.id, newJob);
      setCurrentView('campaign-details');
    } catch (err) {
      console.error('Error starting AI Job:', err);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 pb-16">
      {/* View Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">New AI Job</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assign a prospecting task to your AI Sales Agent using natural language.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium self-start">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'chat'
                ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Job Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Prompt History</span>
            {promptHistory.length > 0 && (
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] rounded-full">
                {promptHistory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        /* Prompt History Tab */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>Saved AI Prompt Memory</span>
            </h2>
            <span className="text-xs text-slate-400">Click any prompt to re-run</span>
          </div>

          <div className="space-y-3">
            {promptHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setActiveTab('chat');
                  handleSelectPrompt(item.prompt);
                }}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-medium text-slate-800 group-hover:text-blue-900 leading-relaxed">
                    "{item.prompt}"
                  </p>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Re-run Job <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2.5 text-[11px] text-slate-400">
                  <span>Logged: {item.timestamp}</span>
                  {item.extractedParams?.targetIndustry && (
                    <span className="text-slate-500 font-medium">
                      Industry: {item.extractedParams.targetIndustry} ({item.extractedParams.targetCountry})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* AI Chat Prompting Canvas */
        <div className="space-y-6">
          {/* ChatGPT Prompt Interface */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="text-center max-w-lg mx-auto py-2">
              <div className="inline-flex p-2.5 bg-blue-50 rounded-full text-blue-600 mb-3 border border-blue-100">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                What would you like me to do today?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Describe your target leads, location, and ideal business pain points.
              </p>
            </div>

            {/* Prompt Textarea */}
            <div className="relative">
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Find construction companies in Zambia that would benefit from AI-powered customer support and website automation..."
                className="w-full text-xs text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl p-4 pr-12 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none leading-relaxed"
              />
              <button
                type="button"
                onClick={handleAnalyzePrompt}
                disabled={!prompt.trim() || isAnalyzing}
                className="absolute right-3 bottom-3 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40"
                title="Analyze Prompt with AI"
              >
                {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick Sample Suggestions */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Sample Job Prompts:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {samplePrompts.map((sp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPrompt(sp.prompt)}
                    className="p-3 text-left rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50 text-xs transition-all group"
                  >
                    <span className="font-semibold text-slate-800 group-hover:text-blue-700 block mb-0.5">
                      {sp.title}
                    </span>
                    <span className="text-slate-500 text-[11px] line-clamp-2 leading-tight">
                      "{sp.prompt}"
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Plan Preview */}
          {(parsedPlan || isAnalyzing) && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4 border border-slate-800 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-blue-300 tracking-wide uppercase">
                    AI Execution Plan
                  </span>
                </div>
                {isAnalyzing && (
                  <span className="text-xs text-blue-400 flex items-center gap-1.5 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Analyzing knowledge base...
                  </span>
                )}
              </div>

              {parsedPlan && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Target Industry</span>
                      <span className="font-bold text-white">{targetIndustry || parsedPlan.targetIndustry}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Country / Region</span>
                      <span className="font-bold text-white">{targetCountry || parsedPlan.targetCountry}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Lead Search Count</span>
                      <span className="font-bold text-white">{leadLimit || parsedPlan.leadCount} Companies</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Offer Strategy</span>
                      <span className="font-bold text-emerald-400">{parsedPlan.services[0] || 'AI Automation'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-300">AI Planned Workflow:</p>
                    <div className="whitespace-pre-line text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px]">
                      {parsedPlan.summaryPlan}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Advanced Fine-Tuning Drawer */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Override Job Settings</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200 text-xs bg-slate-50/50">
                <div>
                  <label className="font-medium text-slate-700 mb-1 block">Override Industry</label>
                  <input
                    type="text"
                    value={targetIndustry}
                    onChange={(e) => setTargetIndustry(e.target.value)}
                    placeholder="e.g. Construction & Real Estate"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 mb-1 block">Override Country</label>
                  <input
                    type="text"
                    value={targetCountry}
                    onChange={(e) => setTargetCountry(e.target.value)}
                    placeholder="e.g. Zambia"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 mb-1 block">Lead Limit</label>
                  <select
                    value={leadLimit}
                    onChange={(e) => setLeadLimit(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value={10}>10 Leads</option>
                    <option value={20}>20 Leads</option>
                    <option value={35}>35 Leads</option>
                    <option value={50}>50 Leads</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Action Launch Bar */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleLaunchJob}
              disabled={isLaunching || (!prompt.trim() && !targetIndustry.trim())}
              className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-40"
            >
              {isLaunching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Launching AI Job...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-blue-200" />
                  <span>Start AI Job</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


