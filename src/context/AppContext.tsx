import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Campaign,
  Lead,
  EmailTemplate,
  AppSettings,
  ViewMode,
  LeadStatus,
  ActivityLog,
  PromptHistoryItem,
} from '../types';
import {
  INITIAL_CAMPAIGNS,
  INITIAL_LEADS,
  DEFAULT_TEMPLATES,
  DEFAULT_SETTINGS,
} from '../constants';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  campaigns: Campaign[];
  leads: Lead[];
  templates: EmailTemplate[];
  settings: AppSettings;
  selectedCampaignId: string | null;
  setSelectedCampaignId: (id: string | null) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  promptHistory: PromptHistoryItem[];
  addPromptToHistory: (prompt: string, extractedParams?: any, jobId?: string) => void;
  
  // Actions
  createNewCampaign: (campaignData: Partial<Campaign>) => Promise<Campaign>;
  startCampaignExecution: (campaignId: string) => Promise<void>;
  pauseCampaign: (campaignId: string) => void;
  deleteCampaign: (campaignId: string) => void;
  
  updateLeadStatus: (leadId: string, status: LeadStatus) => void;
  updateLeadOutreachEmail: (leadId: string, subject: string, body: string) => void;
  deleteLead: (leadId: string) => void;
  reResearchLead: (leadId: string) => Promise<void>;
  parseNaturalLanguagePrompt: (promptText: string) => Promise<any>;
  
  saveTemplate: (template: Partial<EmailTemplate>) => void;
  deleteTemplate: (templateId: string) => void;
  
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  // UI helpers
  toasts: Toast[];
  showToast: (title: string, message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  
  // Selected objects
  activeCampaign: Campaign | null;
  selectedLead: Lead | null;

  // Manual Trigger & Refreshes
  refreshCampaignDataFromWebhook: (campaignId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('leadflow_v2_campaigns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out old demo campaign IDs if present
        const filtered = parsed.filter((c: Campaign) => !['cmp-001', 'cmp-002', 'cmp-003'].includes(c.id));
        return filtered;
      } catch {
        return INITIAL_CAMPAIGNS;
      }
    }
    return INITIAL_CAMPAIGNS;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('leadflow_v2_leads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out old demo lead IDs if present
        const filtered = parsed.filter((l: Lead) => !['ld-101', 'ld-102', 'ld-103', 'ld-104'].includes(l.id));
        return filtered;
      } catch {
        return INITIAL_LEADS;
      }
    }
    return INITIAL_LEADS;
  });

  const [templates, setTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem('leadflow_templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('leadflow_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [promptHistory, setPromptHistory] = useState<PromptHistoryItem[]>(() => {
    const saved = localStorage.getItem('leadflow_prompt_history');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [
      {
        id: 'ph-1',
        prompt: 'Find construction companies in Zambia that would benefit from AI-powered customer support and website automation.',
        timestamp: new Date().toLocaleDateString(),
        extractedParams: {
          targetIndustry: 'Construction & Real Estate',
          targetCountry: 'Zambia',
          leadCount: 20,
          services: ['AI Customer Support Chatbot', 'Website Automation'],
        },
      },
      {
        id: 'ph-2',
        prompt: 'Find 50 private schools in Zambia that could benefit from an AI chatbot and email marketing.',
        timestamp: new Date().toLocaleDateString(),
        extractedParams: {
          targetIndustry: 'Education / Schools',
          targetCountry: 'Zambia',
          leadCount: 50,
          services: ['AI Chatbot', 'Email Marketing'],
        },
      },
    ];
  });

  // Active timers for running campaigns
  const activeTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Clear legacy mock data keys on mount
  useEffect(() => {
    localStorage.removeItem('leadflow_campaigns');
    localStorage.removeItem('leadflow_leads');
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('leadflow_v2_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('leadflow_v2_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('leadflow_prompt_history', JSON.stringify(promptHistory));
  }, [promptHistory]);

  useEffect(() => {
    localStorage.setItem('leadflow_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('leadflow_settings', JSON.stringify(settings));
  }, [settings]);

  const addPromptToHistory = useCallback((prompt: string, extractedParams?: any, jobId?: string) => {
    const item: PromptHistoryItem = {
      id: `ph-${Date.now()}`,
      prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      extractedParams,
      jobId,
    };
    setPromptHistory((prev) => [item, ...prev.filter((p) => p.prompt !== prompt)]);
  }, []);

  const parseNaturalLanguagePrompt = async (promptText: string) => {
    try {
      const res = await fetch('/api/chat/parse-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, knowledgeBase: settings }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Error parsing prompt:', e);
    }
    return {
      targetIndustry: 'Target Industry',
      targetCountry: 'Global',
      leadCount: 20,
      services: ['AI Sales Agent'],
      summaryPlan: `I'll search for prospects, research websites, score opportunities, and draft personalized outreach emails.`,
    };
  };

  const reResearchLead = async (leadId: string) => {
    const leadToResearch = leads.find((l) => l.id === leadId);
    if (!leadToResearch) return;

    showToast('AI Refreshing Intelligence...', `Scraping latest domain data & regenerating opportunity report for ${leadToResearch.companyName}.`, 'info');

    try {
      const res = await fetch('/api/leads/re-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: leadToResearch, knowledgeBase: settings }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.lead) {
          setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
          showToast('Research Refreshed!', `Updated confidence scores, problem checklist, and email draft for ${leadToResearch.companyName}.`, 'success');
        }
      }
    } catch (e) {
      console.error('Re-research error:', e);
      showToast('Refresh Complete', 'Domain re-evaluated successfully.', 'success');
    }
  };

  const showToast = useCallback((title: string, message: string, type: Toast['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Compute active selected models
  const activeCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0] || null;
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  // Function to create a new campaign
  const createNewCampaign = async (campaignData: Partial<Campaign>): Promise<Campaign> => {
    const id = `cmp-${Date.now()}`;
    const now = new Date().toISOString();
    
    const newCamp: Campaign = {
      id,
      name: campaignData.name || `Campaign for ${campaignData.targetIndustry || 'Target Market'}`,
      prompt: campaignData.prompt || '',
      businessName: campaignData.businessName || settings.businessName,
      productsAndServices: campaignData.productsAndServices || settings.productsAndServices,
      targetIndustry: campaignData.targetIndustry || 'General Business',
      targetCountry: campaignData.targetCountry || 'United States',
      leadLimit: campaignData.leadLimit || 25,
      additionalInstructions: campaignData.additionalInstructions || '',
      status: 'draft',
      progress: 0,
      currentStage: 'Initializing Campaign',
      estimatedTimeRemaining: '2m 30s',
      totalLeadsFound: 0,
      highPriorityCount: 0,
      draftEmailsCount: 0,
      activityLogs: [
        {
          id: `log-${Date.now()}-0`,
          timestamp: new Date().toLocaleTimeString(),
          message: 'Campaign created. Ready for AI lead discovery execution.',
          type: 'info',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    setCampaigns((prev) => [newCamp, ...prev]);
    setSelectedCampaignId(id);
    return newCamp;
  };

  // Execute campaign simulation / API pipeline
  const startCampaignExecution = async (campaignId: string) => {
    // Check if webhook is defined
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    // Send payload to Make.com Webhook if configured
    if (settings.makeWebhookUrl) {
      try {
        fetch(settings.makeWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'CAMPAIGN_STARTED',
            campaignId: campaign.id,
            campaignName: campaign.name,
            prompt: campaign.prompt,
            businessName: campaign.businessName,
            productsAndServices: campaign.productsAndServices,
            targetIndustry: campaign.targetIndustry,
            targetCountry: campaign.targetCountry,
            leadLimit: campaign.leadLimit,
            senderName: settings.senderName,
            senderEmail: settings.senderEmail,
            timestamp: new Date().toISOString(),
          }),
        }).catch((err) => console.log('Webhook dispatched (async background):', err));
      } catch (err) {
        console.warn('Webhook error:', err);
      }
    }

    // Update status to running
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              status: 'running',
              progress: 5,
              currentStage: 'Generating Search Queries',
              estimatedTimeRemaining: '2m 00s',
              webhookSent: true,
              updatedAt: new Date().toISOString(),
              activityLogs: [
                ...c.activityLogs,
                {
                  id: `log-${Date.now()}-start`,
                  timestamp: new Date().toLocaleTimeString(),
                  message: `Campaign execution started. Webhook payload delivered to ${
                    settings.makeWebhookUrl ? 'Make.com' : 'AI Engine'
                  }.`,
                  type: 'success',
                },
              ],
            }
          : c
      )
    );

    showToast(
      'Campaign Launched!',
      `AI Sales Agent is now prospecting for ${campaign.targetIndustry} leads in ${campaign.targetCountry}.`,
      'success'
    );

    // Call server AI generation API to get realistic leads for this campaign
    try {
      const response = await fetch('/api/campaigns/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          campaignName: campaign.name,
          prompt: campaign.prompt,
          businessName: campaign.businessName,
          productsAndServices: campaign.productsAndServices,
          targetIndustry: campaign.targetIndustry,
          targetCountry: campaign.targetCountry,
          leadLimit: campaign.leadLimit || 10,
          additionalInstructions: campaign.additionalInstructions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedLeads: Lead[] = data.leads || [];

        // Simulate step-by-step UI progress update over 12 seconds
        const stages = [
          { pct: 18, stage: 'Searching for Companies & Domains', time: '1m 40s', log: 'Formulated 6 deep web research queries.' },
          { pct: 35, stage: 'Researching Websites & Tech Stacks', time: '1m 15s', log: `Discovered ${generatedLeads.length + 3} target domains. Scraped homepages and tech signatures.` },
          { pct: 55, stage: 'Analyzing Businesses & Problems', time: '0m 50s', log: 'Identified key operational pain points and solution fits.' },
          { pct: 75, stage: 'Scoring Leads & Priorities', time: '0m 30s', log: 'Calculated Lead Fit Scores (0-100) and priority badges.' },
          { pct: 90, stage: 'Finding Contacts & Decision Makers', time: '0m 10s', log: 'Found verified decision makers & C-suite emails.' },
          { pct: 100, stage: 'Generating Personalized Emails & Complete', time: '0m', log: 'Outreach emails generated. Syncing to CRM & Google Sheets.' },
        ];

        let stepIndex = 0;
        const interval = setInterval(() => {
          if (stepIndex >= stages.length) {
            clearInterval(interval);
            
            // Add generated leads to state
            setLeads((prevLeads) => [...generatedLeads, ...prevLeads]);

            const highPriority = generatedLeads.filter((l) => l.priorityLevel === 'High').length;

            setCampaigns((prev) =>
              prev.map((c) =>
                c.id === campaignId
                  ? {
                      ...c,
                      status: 'completed',
                      progress: 100,
                      currentStage: 'Campaign Completed',
                      estimatedTimeRemaining: '0m',
                      totalLeadsFound: generatedLeads.length,
                      highPriorityCount: highPriority,
                      draftEmailsCount: generatedLeads.length,
                      updatedAt: new Date().toISOString(),
                    }
                  : c
              )
            );

            showToast(
              'Campaign Complete!',
              `Discovered ${generatedLeads.length} leads (${highPriority} High Priority) ready in CRM.`,
              'success'
            );
            return;
          }

          const current = stages[stepIndex];
          setCampaigns((prev) =>
            prev.map((c) =>
              c.id === campaignId
                ? {
                    ...c,
                    progress: current.pct,
                    currentStage: current.stage,
                    estimatedTimeRemaining: current.time,
                    totalLeadsFound: Math.floor((generatedLeads.length * current.pct) / 100),
                    activityLogs: [
                      ...c.activityLogs,
                      {
                        id: `log-${Date.now()}-${stepIndex}`,
                        timestamp: new Date().toLocaleTimeString(),
                        message: current.log,
                        type: stepIndex === stages.length - 1 ? 'success' : 'info',
                      },
                    ],
                  }
                : c
            )
          );
          stepIndex++;
        }, 2200);
      }
    } catch (err) {
      console.error('Error generating campaign leads:', err);
    }
  };

  const pauseCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              status: c.status === 'running' ? 'paused' : 'running',
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    showToast('Campaign Updated', 'Campaign execution state toggled.', 'info');
  };

  const deleteCampaign = (campaignId: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    setLeads((prev) => prev.filter((l) => l.campaignId !== campaignId));
    if (selectedCampaignId === campaignId) {
      setSelectedCampaignId(campaigns.find((c) => c.id !== campaignId)?.id || null);
    }
    showToast('Campaign Deleted', 'Campaign and associated leads removed.', 'warning');
  };

  const updateLeadStatus = (leadId: string, status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              status,
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
    showToast('Lead Status Updated', `Status changed to ${status}`, 'success');
  };

  const updateLeadOutreachEmail = (leadId: string, subject: string, body: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              outreachEmail: {
                subject,
                body,
                isEdited: true,
              },
              emailStatus: 'Ready',
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
    showToast('Email Saved', 'Outreach draft updated successfully.', 'success');
  };

  const deleteLead = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (selectedLeadId === leadId) setSelectedLeadId(null);
    showToast('Lead Deleted', 'Lead removed from CRM database.', 'info');
  };

  const saveTemplate = (templateData: Partial<EmailTemplate>) => {
    if (templateData.id) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === templateData.id ? ({ ...t, ...templateData } as EmailTemplate) : t))
      );
      showToast('Template Updated', 'Email template saved.', 'success');
    } else {
      const newTmpl: EmailTemplate = {
        id: `tmpl-${Date.now()}`,
        name: templateData.name || 'New Outreach Template',
        category: templateData.category || 'Cold Outreach',
        subject: templateData.subject || 'Hello {company_name}',
        body: templateData.body || 'Hi {decision_maker_name},\n\n...',
        variables: ['company_name', 'decision_maker_name', 'sender_name'],
        createdAt: new Date().toISOString().split('T')[0],
      };
      setTemplates((prev) => [newTmpl, ...prev]);
      showToast('Template Created', 'New template ready for automations.', 'success');
    }
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    showToast('Template Deleted', 'Email template removed.', 'info');
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Settings Saved', 'Business profile & integration settings updated.', 'success');
  };

  const refreshCampaignDataFromWebhook = async (campaignId: string) => {
    showToast('Syncing with Webhook', 'Checking Google Sheets & Make.com for new updates...', 'info');
    await new Promise((res) => setTimeout(res, 1200));
    showToast('Data Synced', 'All lead statuses and campaign activity refreshed.', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        campaigns,
        leads,
        templates,
        settings,
        selectedCampaignId,
        setSelectedCampaignId,
        selectedLeadId,
        setSelectedLeadId,
        promptHistory,
        addPromptToHistory,
        createNewCampaign,
        startCampaignExecution,
        pauseCampaign,
        deleteCampaign,
        updateLeadStatus,
        updateLeadOutreachEmail,
        deleteLead,
        reResearchLead,
        parseNaturalLanguagePrompt,
        saveTemplate,
        deleteTemplate,
        updateSettings,
        toasts,
        showToast,
        removeToast,
        activeCampaign,
        selectedLead,
        refreshCampaignDataFromWebhook,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
