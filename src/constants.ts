import { Campaign, Lead, EmailTemplate, AppSettings, UserProfile } from './types';

// App Configuration
export const APP_NAME = "AI Sales Agent";
export const APP_SLOGAN = "Lead Prospecting & Outreach Engine";

export const DEFAULT_USER: UserProfile = {
  id: 'usr-101',
  name: 'Kondwani Mbewe',
  email: 'kondwanimbewe111@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  companyName: 'Apex Growth Lab',
  role: 'Growth Lead',
};

export const DEFAULT_SETTINGS: AppSettings = {
  businessName: 'Apex Growth Lab',
  website: 'https://apexgrowthlab.io',
  companyDescription: 'B2B growth agency offering AI workflow automation, customer support chatbots, and outbound pipeline infrastructure.',
  productsAndServices: 'AI Customer Support Chatbots, Website Automation, Lead Intelligence & Prospecting Engine, Custom CRM Workflows',
  industriesServed: 'Education, Construction, Hospitality, Logistics, B2B Services, Healthcare',
  idealCustomers: 'Mid-sized businesses seeking digital transformation, higher lead response speed, and customer service automation',
  uniqueSellingPoints: '24/7 instant AI response, seamless CRM integration, 95%+ email accuracy, automated lead scoring',
  pricingOfferRange: '$1,500 - $5,000 / month based on automation scope',
  caseStudies: 'Helped 40+ enterprises increase lead qualification speed by 300% and reduce customer support response latency to under 5 seconds.',
  competitors: 'Traditional manual SDR teams, basic chatbots without website scraping capabilities',
  faqs: 'Q: How fast does setup take? A: Under 48 hours.\nQ: Does it integrate with existing tools? A: Yes, via Make.com, Zapier, and REST API.',
  salesTone: 'Consultative, Professional & High-Value',
  callToAction: '10-minute briefing call or customized 2-minute video overview',
  targetAudience: 'Mid-market B2B companies, regional leaders, and scaling digital services',
  senderName: 'Alex Rivera',
  senderEmail: 'alex@apexgrowthlab.io',
  emailSignature: "Alex Rivera\nGrowth Lead | Apex Growth Lab\nalex@apexgrowthlab.io | https://apexgrowthlab.io",
  makeWebhookUrl: 'https://hook.eu1.make.com/39a8bc47-example-lead-webhook',
  googleSheetsUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBSeUEXAMPLE/edit#gid=0',
  gmailConnected: true,
  autoSendEmails: false,
};

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Consultative Outreach',
    category: 'Cold Outreach',
    subject: 'Question re: {company_name}',
    body: `Hi {decision_maker_name},

I was looking at {company_name} and noticed your work in {industry}.

Many teams in this space run into challenges with {identified_problem}. We helped a similar team address this using {recommended_service}.

Would you be open to a brief 10-minute chat this week?

Best regards,
{sender_name}`,
    variables: ['company_name', 'identified_problem', 'decision_maker_name', 'industry', 'recommended_service', 'sender_name'],
    isDefault: true,
    createdAt: '2026-07-01',
  },
  {
    id: 'tmpl-2',
    name: 'Short Value Offer',
    category: 'Value Offer',
    subject: 'Idea for {company_name}',
    body: `Hi {decision_maker_name},

Loved what {company_name} is doing in {location}.

We built a workflow for {industry} teams that automates lead research and outreach.

Mind if I send over a 2-minute overview?

Best,
{sender_name}`,
    variables: ['decision_maker_name', 'company_name', 'location', 'industry', 'sender_name'],
    isDefault: false,
    createdAt: '2026-07-10',
  },
  {
    id: 'tmpl-3',
    name: 'Quick Follow-Up',
    category: 'Follow Up',
    subject: 'Re: Question re: {company_name}',
    body: `Hi {decision_maker_name},

Following up on my earlier note regarding {company_name}.

If optimizing your outreach workflow is a focus right now, let's connect for 10 minutes.

Best,
{sender_name}`,
    variables: ['decision_maker_name', 'company_name', 'sender_name'],
    isDefault: false,
    createdAt: '2026-07-15',
  }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [];

export const INITIAL_LEADS: Lead[] = [];
