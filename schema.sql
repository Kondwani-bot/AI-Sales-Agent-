-- =========================================================================
-- AI Sales Agent & Lead Intelligence Engine - Supabase Schema
-- Run this SQL in your Supabase SQL Editor (https://app.supabase.com)
-- =========================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Knowledge Base / Settings Table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL DEFAULT 'Apex Growth Lab',
  website TEXT DEFAULT 'https://apexgrowthlab.io',
  company_description TEXT,
  products_and_services TEXT,
  industries_served TEXT,
  ideal_customers TEXT,
  unique_selling_points TEXT,
  sales_tone TEXT DEFAULT 'Consultative & Professional',
  sender_name TEXT,
  sender_email TEXT,
  google_apps_script_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default row if empty
INSERT INTO knowledge_base (business_name, website, products_and_services, sales_tone)
SELECT 'Apex Growth Lab', 'https://apexgrowthlab.io', 'AI Sales Automation & Customer Support Chatbots', 'Consultative & Professional'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_base);

-- 3. Create Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prompt TEXT,
  business_name TEXT,
  products_and_services TEXT,
  target_industry TEXT,
  target_country TEXT,
  lead_limit INT DEFAULT 20,
  additional_instructions TEXT,
  status TEXT DEFAULT 'draft',
  progress INT DEFAULT 0,
  current_stage TEXT DEFAULT 'Initialized',
  total_leads_found INT DEFAULT 0,
  high_priority_count INT DEFAULT 0,
  draft_emails_count INT DEFAULT 0,
  activity_logs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create Leads / Target Companies Table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_name TEXT,
  company_name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  location TEXT,
  country TEXT,
  company_size TEXT,
  lead_score INT DEFAULT 85,
  priority_level TEXT DEFAULT 'High',
  recommended_service TEXT,
  email_status TEXT DEFAULT 'Drafted',
  status TEXT DEFAULT 'New',
  decision_maker JSONB,
  website_analysis TEXT,
  social_analysis TEXT,
  identified_problems JSONB DEFAULT '[]'::jsonb,
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  outreach_email JSONB,
  opportunity_report JSONB,
  confidence_scores JSONB,
  research_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Create Decision Makers & Contacts Table
CREATE TABLE IF NOT EXISTS decision_makers (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  campaign_id TEXT,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  linkedin TEXT,
  phone TEXT,
  email_confidence INT DEFAULT 95,
  title_confidence INT DEFAULT 90,
  recommended_service TEXT,
  email_status TEXT DEFAULT 'Drafted',
  status TEXT DEFAULT 'New',
  outreach_email JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Create Email Dispatch Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id TEXT,
  recipient_name TEXT,
  recipient_email TEXT NOT NULL,
  company_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  dispatch_method TEXT DEFAULT 'Google Apps Script',
  status TEXT DEFAULT 'Sent',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Enable Row Level Security (RLS) & Allow Anonymous Access for Demo
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Public policies for app operations
CREATE POLICY "Allow public select on knowledge_base" ON knowledge_base FOR SELECT USING (true);
CREATE POLICY "Allow public update on knowledge_base" ON knowledge_base FOR ALL USING (true);

CREATE POLICY "Allow public select on campaigns" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Allow public all on campaigns" ON campaigns FOR ALL USING (true);

CREATE POLICY "Allow public select on leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Allow public all on leads" ON leads FOR ALL USING (true);

CREATE POLICY "Allow public select on decision_makers" ON decision_makers FOR SELECT USING (true);
CREATE POLICY "Allow public all on decision_makers" ON decision_makers FOR ALL USING (true);

CREATE POLICY "Allow public select on email_logs" ON email_logs FOR SELECT USING (true);
CREATE POLICY "Allow public all on email_logs" ON email_logs FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_decision_makers_lead ON decision_makers(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent ON email_logs(sent_at DESC);
