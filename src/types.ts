export type LeadPriority = 'High' | 'Medium' | 'Low';

export type LeadStatus = 
  | 'New' 
  | 'Contacted' 
  | 'Interested' 
  | 'Meeting Scheduled' 
  | 'Proposal Sent' 
  | 'Won' 
  | 'Lost' 
  | 'Archived';

export type EmailStatus = 'Drafted' | 'Ready' | 'Sent' | 'Opened' | 'Bounced';

export type CampaignStatus = 'draft' | 'running' | 'paused' | 'completed' | 'failed';

export interface ConfidenceScores {
  websiteAudit: number; // e.g. 96
  companyData: number; // e.g. 92
  emailConfidence: number; // e.g. 98
  decisionMakerConfidence: number; // e.g. 90
}

export interface ProblemCheckItem {
  problem: string;
  found: boolean;
  detail?: string;
}

export interface ServiceMatchItem {
  service: string;
  matched: boolean;
  impact?: string;
}

export interface AIOpportunityReport {
  matchRating: number; // 1 to 5 stars or score 0-100
  matchLevel: 'Excellent Match' | 'Strong Fit' | 'Moderate Fit' | 'Low Alignment';
  problemChecklist: ProblemCheckItem[];
  potentialServices: ServiceMatchItem[];
  salesPotential: 'High' | 'Medium' | 'Low';
  reasoning: string;
}

export interface Contact {
  id: string;
  companyId: string;
  companyName: string;
  jobId: string;
  name: string;
  title: string;
  email: string;
  linkedin: string;
  phone?: string;
  emailConfidence: number;
  titleConfidence: number;
  recommendedService: string;
  emailStatus: EmailStatus;
  status: LeadStatus;
  outreachEmail: OutreachEmail;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionMaker {
  name: string;
  title: string;
  email: string;
  linkedin: string;
  phone?: string;
  confidence?: number;
}

export interface OutreachEmail {
  subject: string;
  body: string;
  isEdited?: boolean;
}

export interface Company {
  id: string;
  jobId: string;
  companyName: string;
  website: string;
  industry: string;
  location: string;
  country: string;
  companySize?: string;
  overallMatchScore: number;
  priorityLevel: LeadPriority;
  websiteAnalysis: string;
  socialAnalysis: string;
  identifiedProblems: string[];
  aiRecommendations: string[];
  suggestedProducts: string[];
  opportunityReport: AIOpportunityReport;
  confidenceScores: ConfidenceScores;
  contacts: Contact[];
  researchNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  campaignId: string;
  campaignName: string;
  companyName: string;
  website: string;
  industry: string;
  location: string;
  country: string;
  companySize?: string;
  leadScore: number; // 0 - 100
  priorityLevel: LeadPriority;
  recommendedService: string;
  emailStatus: EmailStatus;
  status: LeadStatus;
  decisionMaker: DecisionMaker;
  websiteAnalysis: string;
  socialAnalysis: string;
  identifiedProblems: string[];
  aiRecommendations: string[];
  suggestedProducts: string[];
  leadScoreExplanation: string;
  researchNotes: string;
  outreachEmail: OutreachEmail;
  opportunityReport?: AIOpportunityReport;
  confidenceScores?: ConfidenceScores;
  contacts?: Contact[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  stage?: string;
}

export interface ThinkingStep {
  id: string;
  step: string;
  status: 'pending' | 'thinking' | 'completed';
  timestamp: string;
  detail?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
}

export interface Campaign {
  id: string;
  name: string;
  prompt: string;
  businessName: string;
  productsAndServices: string;
  targetIndustry: string;
  targetCountry: string;
  leadLimit: number;
  additionalInstructions: string;
  status: CampaignStatus;
  progress: number; // 0 - 100
  currentStage: string;
  estimatedTimeRemaining: string;
  totalLeadsFound: number;
  totalCompaniesFound?: number;
  highPriorityCount: number;
  draftEmailsCount: number;
  activityLogs: ActivityLog[];
  thinkingStream?: ThinkingStep[];
  timeline?: TimelineEvent[];
  templateId?: string;
  webhookSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'Cold Outreach' | 'Follow Up' | 'Value Offer' | 'Custom';
  variables: string[];
  isDefault?: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  companyName: string;
  role: string;
}

// Business Knowledge Base (AI Permanent Memory)
export interface AppSettings {
  businessName: string;
  website: string;
  companyDescription: string;
  productsAndServices: string;
  industriesServed: string;
  idealCustomers: string;
  uniqueSellingPoints: string;
  pricingOfferRange: string;
  caseStudies: string;
  competitors: string;
  faqs: string;
  salesTone: string;
  callToAction: string;
  targetAudience: string;
  senderName: string;
  senderEmail: string;
  emailSignature: string;
  geminiApiKey?: string;
  makeWebhookUrl: string;
  googleSheetsUrl: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  googleAppsScriptUrl?: string;
  gmailConnected: boolean;
  autoSendEmails: boolean;
}

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  timestamp: string;
  extractedParams?: {
    targetIndustry?: string;
    targetCountry?: string;
    leadCount?: number;
    services?: string[];
  };
  jobId?: string;
}

export type ViewMode = 
  | 'dashboard' 
  | 'new-campaign' 
  | 'campaign-details' 
  | 'crm' 
  | 'templates' 
  | 'settings';

