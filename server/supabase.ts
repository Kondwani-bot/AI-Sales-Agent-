import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzgdlcxbbwckdkvqgjeh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_secret_35EOkyjfBOYUV6DGYv7-XA_Hm9h6Iir';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseClient) {
    try {
      if (SUPABASE_URL && SUPABASE_KEY) {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { persistSession: false },
        });
      }
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
    }
  }
  return supabaseClient;
}

export async function checkSupabaseStatus() {
  const client = getSupabase();
  if (!client) {
    return {
      connected: false,
      url: SUPABASE_URL,
      message: 'Supabase client not initialized',
    };
  }

  try {
    const { data, error } = await client.from('campaigns').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return {
        connected: true,
        tablesReady: false,
        url: SUPABASE_URL,
        message: `Connected to Supabase, but tables need creation: ${error.message}`,
        errorCode: error.code,
      };
    }

    return {
      connected: true,
      tablesReady: true,
      url: SUPABASE_URL,
      message: 'Connected & database tables verified in Supabase!',
    };
  } catch (err: any) {
    return {
      connected: false,
      url: SUPABASE_URL,
      message: err?.message || 'Error connecting to Supabase',
    };
  }
}

export async function syncCampaignToSupabase(campaign: any) {
  const client = getSupabase();
  if (!client) return { success: false, reason: 'No Supabase client' };

  try {
    const row = {
      id: campaign.id,
      name: campaign.name,
      prompt: campaign.prompt,
      business_name: campaign.businessName,
      products_and_services: campaign.productsAndServices,
      target_industry: campaign.targetIndustry,
      target_country: campaign.targetCountry,
      lead_limit: campaign.leadLimit || 20,
      additional_instructions: campaign.additionalInstructions || '',
      status: campaign.status || 'running',
      progress: campaign.progress || 0,
      current_stage: campaign.currentStage || 'Initialized',
      total_leads_found: campaign.totalLeadsFound || 0,
      high_priority_count: campaign.highPriorityCount || 0,
      draft_emails_count: campaign.draftEmailsCount || 0,
      activity_logs: campaign.activityLogs || [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('campaigns').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase campaign sync notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error syncing campaign to Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function syncLeadsToSupabase(leads: any[]) {
  const client = getSupabase();
  if (!client || !leads || leads.length === 0) return { success: false };

  try {
    const rows = leads.map((lead) => ({
      id: lead.id,
      campaign_id: lead.campaignId,
      campaign_name: lead.campaignName,
      company_name: lead.companyName,
      website: lead.website,
      industry: lead.industry,
      location: lead.location,
      country: lead.country,
      company_size: lead.companySize,
      lead_score: lead.leadScore || 85,
      priority_level: lead.priorityLevel || 'High',
      recommended_service: lead.recommendedService,
      email_status: lead.emailStatus || 'Drafted',
      status: lead.status || 'New',
      decision_maker: lead.decisionMaker || {},
      website_analysis: lead.websiteAnalysis || '',
      social_analysis: lead.socialAnalysis || '',
      identified_problems: lead.identifiedProblems || [],
      ai_recommendations: lead.aiRecommendations || [],
      outreach_email: lead.outreachEmail || {},
      opportunity_report: lead.opportunityReport || {},
      confidence_scores: lead.confidenceScores || {},
      research_notes: lead.researchNotes || '',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('leads').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase leads sync notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, count: rows.length };
  } catch (err: any) {
    console.error('Error syncing leads to Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function syncDecisionMakersToSupabase(contacts: any[]) {
  const client = getSupabase();
  if (!client || !contacts || contacts.length === 0) return { success: false };

  try {
    const rows = contacts.map((c) => ({
      id: c.id,
      lead_id: c.companyId || c.jobId,
      company_name: c.companyName || '',
      campaign_id: c.jobId || c.campaignId,
      name: c.name,
      title: c.title,
      email: c.email,
      linkedin: c.linkedin,
      phone: c.phone || '',
      email_confidence: c.emailConfidence || 95,
      title_confidence: c.titleConfidence || 90,
      recommended_service: c.recommendedService || '',
      email_status: c.emailStatus || 'Drafted',
      status: c.status || 'New',
      outreach_email: c.outreachEmail || {},
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('decision_makers').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase decision makers sync notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, count: rows.length };
  } catch (err: any) {
    console.error('Error syncing decision makers to Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function logEmailDispatchToSupabase(log: {
  leadId?: string;
  recipientName: string;
  recipientEmail: string;
  companyName: string;
  subject: string;
  body: string;
  dispatchMethod?: string;
  status?: string;
}) {
  const client = getSupabase();
  if (!client) return { success: false };

  try {
    const row = {
      lead_id: log.leadId || '',
      recipient_name: log.recipientName,
      recipient_email: log.recipientEmail,
      company_name: log.companyName,
      subject: log.subject,
      body: log.body,
      dispatch_method: log.dispatchMethod || 'Google Apps Script',
      status: log.status || 'Sent',
      sent_at: new Date().toISOString(),
    };

    const { error } = await client.from('email_logs').insert([row]);
    if (error) console.warn('Supabase email log notice:', error.message);
    return { success: !error };
  } catch (err: any) {
    console.error('Error logging email to Supabase:', err);
    return { success: false };
  }
}

export async function loadSupabaseData() {
  const client = getSupabase();
  if (!client) return null;

  try {
    const [cRes, lRes, dRes] = await Promise.all([
      client.from('campaigns').select('*').order('created_at', { ascending: false }),
      client.from('leads').select('*').order('created_at', { ascending: false }),
      client.from('decision_makers').select('*').order('created_at', { ascending: false }),
    ]);

    if (cRes.error || lRes.error) {
      return null;
    }

    return {
      campaigns: cRes.data || [],
      leads: lRes.data || [],
      decisionMakers: dRes.data || [],
    };
  } catch (err) {
    console.error('Error loading Supabase data:', err);
    return null;
  }
}
