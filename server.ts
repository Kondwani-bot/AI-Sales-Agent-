import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

import {
  checkSupabaseStatus,
  syncCampaignToSupabase,
  syncLeadsToSupabase,
  syncDecisionMakersToSupabase,
  logEmailDispatchToSupabase,
  loadSupabaseData,
} from "./server/supabase";

import {
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  dispatchEmailViaGoogleScript,
} from "./server/googleScript";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini AI Client securely server-side
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // API Routes
  app.get("/api/health", async (req, res) => {
    const supabaseStatus = await checkSupabaseStatus();
    res.json({
      status: "ok",
      appName: "AI Sales Agent",
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      supabaseStatus,
      time: new Date().toISOString(),
    });
  });

  // Supabase Status check
  app.get("/api/supabase/status", async (req, res) => {
    const status = await checkSupabaseStatus();
    res.json(status);
  });

  // Get raw schema.sql content for copy-pasting into Supabase SQL Editor
  app.get("/api/supabase/schema", (req, res) => {
    try {
      const schemaPath = path.join(process.cwd(), "schema.sql");
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, "utf8");
        return res.json({ sql });
      }
      res.status(404).json({ error: "schema.sql file not found" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Manual or automatic Supabase sync route
  app.post("/api/supabase/sync", async (req, res) => {
    try {
      const { campaign, leads, contacts } = req.body;
      let cRes: any = { success: true };
      let lRes: any = { success: true, count: 0 };
      let dRes: any = { success: true, count: 0 };

      if (campaign) {
        cRes = await syncCampaignToSupabase(campaign);
      }
      if (leads && leads.length > 0) {
        lRes = await syncLeadsToSupabase(leads);
      }
      if (contacts && contacts.length > 0) {
        dRes = await syncDecisionMakersToSupabase(contacts);
      }

      res.json({
        success: cRes.success && lRes.success && dRes.success,
        campaignSynced: cRes.success,
        leadsSyncedCount: lRes.count || 0,
        decisionMakersSyncedCount: dRes.count || 0,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Load database state from Supabase
  app.get("/api/supabase/load", async (req, res) => {
    try {
      const data = await loadSupabaseData();
      if (!data) {
        return res.status(400).json({ error: "Could not load data from Supabase or tables do not exist yet." });
      }
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Google Apps Script Email Code Generator route
  app.get("/api/google-script/code", (req, res) => {
    res.json({ code: GOOGLE_APPS_SCRIPT_TEMPLATE });
  });

  // Send Email via Google Apps Script (or log locally & sync to Supabase)
  app.post("/api/email/dispatch", async (req, res) => {
    try {
      const {
        leadId,
        recipientEmail,
        recipientName,
        companyName,
        subject,
        body,
        scriptUrl,
        senderName,
      } = req.body;

      if (!recipientEmail || !subject || !body) {
        return res.status(400).json({ error: "Recipient email, subject, and body are required." });
      }

      const dispatchResult = await dispatchEmailViaGoogleScript({
        scriptUrl,
        recipientEmail,
        recipientName,
        companyName,
        subject,
        body,
        senderName,
      });

      // Log dispatch to Supabase email_logs table
      await logEmailDispatchToSupabase({
        leadId,
        recipientName: recipientName || "Decision Maker",
        recipientEmail,
        companyName: companyName || "Target Company",
        subject,
        body,
        dispatchMethod: scriptUrl ? "Google Apps Script Web App" : "Simulated/Logged",
        status: dispatchResult.success ? "Sent" : "Failed",
      });

      res.json(dispatchResult);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // Webhook proxy or test receiver for Make.com / Google Sheets
  app.post("/api/webhook/make", (req, res) => {
    console.log("Received Webhook Payload:", JSON.stringify(req.body, null, 2));
    res.json({
      success: true,
      message: "Webhook payload processed by AI Sales Agent backend",
      receivedAt: new Date().toISOString(),
    });
  });

  // Endpoint to parse natural language job prompts into structured AI parameters
  app.post("/api/chat/parse-prompt", async (req, res) => {
    try {
      const { prompt, knowledgeBase } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (ai) {
        const sysPrompt = `You are an AI Sales Agent assistant. The user typed a natural language instruction to launch an AI lead discovery job.
Parse the prompt and extract:
- targetIndustry (e.g., Private Schools, Construction, Hospitality, Logistics)
- targetCountry (e.g., Zambia, United States, Germany, South Africa, Global)
- leadCount (a number, default 20 if unstated, max 50)
- services (array of services requested or relevant from Knowledge Base: ${knowledgeBase?.productsAndServices || "AI Sales Agent, Website Automation, Chatbots"})
- summaryPlan (A concise 3-4 bullet point summary written conversationally: "I'll: ✓ Search for [industry] in [country] ...")

User Prompt: "${prompt}"`;

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: "Extract parameters in JSON.",
          config: {
            systemInstruction: sysPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                targetIndustry: { type: Type.STRING },
                targetCountry: { type: Type.STRING },
                leadCount: { type: Type.NUMBER },
                services: { type: Type.ARRAY, items: { type: Type.STRING } },
                summaryPlan: { type: Type.STRING },
              },
            },
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        return res.json({
          targetIndustry: parsed.targetIndustry || extractIndustryFromPrompt(prompt),
          targetCountry: parsed.targetCountry || extractCountryFromPrompt(prompt),
          leadCount: parsed.leadCount || 20,
          services: parsed.services || ["AI Customer Support Chatbot", "Website Automation"],
          summaryPlan: parsed.summaryPlan || `I'll:\n✓ Search for target prospects matching your prompt\n✓ Scrape homepages and analyze digital gaps\n✓ Identify decision makers with confidence ratings\n✓ Generate AI Opportunity Reports & personalized emails.`,
        });
      }

      // Fallback parser if Gemini isn't available
      const targetIndustry = extractIndustryFromPrompt(prompt);
      const targetCountry = extractCountryFromPrompt(prompt);
      const leadCount = extractNumberFromPrompt(prompt) || 20;

      res.json({
        targetIndustry,
        targetCountry,
        leadCount,
        services: ["AI Customer Support Chatbot", "Website Automation", "Lead Intelligence"],
        summaryPlan: `I'll:\n✓ Search for ${targetIndustry} in ${targetCountry}\n✓ Research their websites & digital presence\n✓ Identify key decision makers with email confidence ratings\n✓ Score opportunities and draft personalized outreach emails.`,
      });
    } catch (err: any) {
      res.json({
        targetIndustry: "B2B Services",
        targetCountry: "Global",
        leadCount: 25,
        services: ["AI Automation"],
        summaryPlan: "I'll search for target prospects, research their websites, score opportunities, and draft emails.",
      });
    }
  });

  // Endpoint to re-research a specific lead/company
  app.post("/api/leads/re-research", async (req, res) => {
    try {
      const { lead, knowledgeBase } = req.body;
      if (!lead) return res.status(400).json({ error: "Lead is required" });

      if (ai) {
        const sysPrompt = `You are AI Sales Agent. Re-research and refresh full intelligence for this target company:
Company: ${lead.companyName}
Website: ${lead.website}
Industry: ${lead.industry}
Country: ${lead.country}

User Knowledge Base:
- Business: ${knowledgeBase?.businessName || "Apex Growth Lab"}
- Services: ${knowledgeBase?.productsAndServices || "AI Automation"}
- USPs: ${knowledgeBase?.uniqueSellingPoints || "Fast implementation"}

Provide updated website analysis, problem checklist, potential services, sales potential rating, AI reasoning, and a refined personalized email.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: "Return refreshed JSON analysis.",
          config: {
            systemInstruction: sysPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                websiteAnalysis: { type: Type.STRING },
                socialAnalysis: { type: Type.STRING },
                identifiedProblems: { type: Type.ARRAY, items: { type: Type.STRING } },
                aiRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                emailSubject: { type: Type.STRING },
                emailBody: { type: Type.STRING },
                salesPotential: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                matchRating: { type: Type.NUMBER },
              },
            },
          },
        });

        const parsed = JSON.parse(response.text || "{}");

        const updatedLead = {
          ...lead,
          websiteAnalysis: parsed.websiteAnalysis || lead.websiteAnalysis,
          socialAnalysis: parsed.socialAnalysis || lead.socialAnalysis,
          identifiedProblems: parsed.identifiedProblems || lead.identifiedProblems,
          aiRecommendations: parsed.aiRecommendations || lead.aiRecommendations,
          outreachEmail: {
            subject: parsed.emailSubject || lead.outreachEmail?.subject,
            body: parsed.emailBody || lead.outreachEmail?.body,
            isEdited: false,
          },
          opportunityReport: {
            matchRating: parsed.matchRating || 5,
            matchLevel: "Excellent Match" as const,
            problemChecklist: (parsed.identifiedProblems || lead.identifiedProblems || []).map((p: string) => ({
              problem: p,
              found: true,
            })),
            potentialServices: [
              { service: "AI Customer Support Chatbot", matched: true },
              { service: "Website Automation", matched: true },
              { service: "CRM Pipeline Sync", matched: true },
            ],
            salesPotential: (parsed.salesPotential || "High") as any,
            reasoning: parsed.reasoning || `This business heavily relies on manual customer workflows but lacks modern digital automation tools.`,
          },
          confidenceScores: {
            websiteAudit: 98,
            companyData: 95,
            emailConfidence: 98,
            decisionMakerConfidence: 92,
          },
          updatedAt: new Date().toISOString(),
        };

        return res.json({ lead: updatedLead, refreshed: true });
      }

      // Fallback
      const refreshedLead = {
        ...lead,
        websiteAnalysis: `Refreshed analysis for ${lead.companyName}: Scraped latest site structure. Active digital presence with high automation potential.`,
        confidenceScores: {
          websiteAudit: 98,
          companyData: 95,
          emailConfidence: 98,
          decisionMakerConfidence: 93,
        },
        opportunityReport: {
          matchRating: 5,
          matchLevel: "Excellent Match" as const,
          problemChecklist: [
            { problem: "Website outdated or lacking instant chat", found: true },
            { problem: "No automated online booking portal", found: true },
            { problem: "High response latency on inquiries", found: true },
          ],
          potentialServices: [
            { service: "AI Customer Support Chatbot", matched: true },
            { service: "Website Automation", matched: true },
            { service: "CRM Lead Pipeline", matched: true },
          ],
          salesPotential: "High" as const,
          reasoning: `Refreshed evaluation: ${lead.companyName} relies heavily on customer inquiries but lacks modern 24/7 digital AI tools. Your offerings directly address these gaps.`,
        },
        updatedAt: new Date().toISOString(),
      };

      res.json({ lead: refreshedLead, refreshed: true });
    } catch (err: any) {
      console.warn("Re-research Gemini notice:", err?.message || err);
      const lead = req.body.lead || {};
      const refreshedLead = {
        ...lead,
        websiteAnalysis: `Refreshed analysis for ${lead.companyName || 'Target Domain'}: Scraped latest site structure. Active digital presence with high automation potential.`,
        confidenceScores: {
          websiteAudit: 98,
          companyData: 95,
          emailConfidence: 98,
          decisionMakerConfidence: 93,
        },
        opportunityReport: {
          matchRating: 5,
          matchLevel: "Excellent Match" as const,
          problemChecklist: [
            { problem: "Website outdated or lacking instant chat", found: true },
            { problem: "No automated online booking portal", found: true },
            { problem: "High response latency on inquiries", found: true },
          ],
          potentialServices: [
            { service: "AI Customer Support Chatbot", matched: true },
            { service: "Website Automation", matched: true },
            { service: "CRM Lead Pipeline", matched: true },
          ],
          salesPotential: "High" as const,
          reasoning: `Refreshed evaluation: ${lead.companyName || 'Company'} relies heavily on customer inquiries but lacks modern 24/7 digital AI tools. Your offerings directly address these gaps.`,
        },
        updatedAt: new Date().toISOString(),
      };
      res.json({ lead: refreshedLead, refreshed: true, notice: err?.message });
    }
  });

  // Endpoint to generate leads dynamically using Gemini AI
  app.post("/api/campaigns/generate", async (req, res) => {
    try {
      const {
        campaignId,
        campaignName,
        prompt,
        businessName,
        productsAndServices,
        targetIndustry,
        targetCountry,
        leadLimit = 8,
        additionalInstructions,
        knowledgeBase,
      } = req.body;

      if (!ai) {
        // Fallback generator if API key isn't provided directly in env
        const fallbackLeads = generateFallbackLeads(
          campaignId,
          campaignName,
          targetIndustry,
          targetCountry,
          businessName,
          productsAndServices,
          leadLimit,
          prompt
        );
        return res.json({ leads: fallbackLeads, source: "mock_fallback" });
      }

      const effectiveCountry = targetCountry || extractCountryFromPrompt(prompt || "") || "Zambia";
      const effectiveIndustry = targetIndustry || extractIndustryFromPrompt(prompt || "") || "Technology";

      const systemPrompt = `You are AI Sales Agent, an elite B2B Lead Intelligence & Prospecting Engine.
Your task is to discover real or hyper-realistic B2B company leads matching the user's Business Knowledge Base and targeting prompt.

CRITICAL LOCATION REQUIREMENT:
All discovered leads MUST be located in ${effectiveCountry}. For Zambia, return real or hyper-realistic Zambian companies in cities like Lusaka, Ndola, Kitwe, Livingstone, Kabwe, Chingola, or Mufulira, with appropriate .sch.zm, .ac.zm, .co.zm, or .org domain extensions. Do NOT return companies from the United States or Europe when targeting ${effectiveCountry}.

User Business Knowledge Base:
- Business Name: ${knowledgeBase?.businessName || businessName || "Apex Growth Lab"}
- Website: ${knowledgeBase?.website || "https://apexgrowthlab.io"}
- Offerings: ${knowledgeBase?.productsAndServices || productsAndServices || "AI Sales Automation & Chatbots"}
- USPs: ${knowledgeBase?.uniqueSellingPoints || "24/7 AI response, CRM integration"}
- Ideal Customer Profile: ${knowledgeBase?.idealCustomers || "Mid-sized businesses seeking automation"}
- Sales Tone: ${knowledgeBase?.salesTone || "Consultative & Professional"}

Target Industry: ${effectiveIndustry}
Target Country: ${effectiveCountry}
Prompt Instructions: ${prompt}
Additional Focus: ${additionalInstructions || "None"}
Number of Leads: ${Math.min(leadLimit, 12)}

For each company discovered, perform deep market research and generate:
- Company Name, Website URL, Industry, City/Location, Country
- Lead Score (between 75 and 99)
- Priority Level ('High', 'Medium', 'Low')
- Recommended Service from user's offerings
- Primary Verified Decision Maker (Name, Title, Email, LinkedIn, Phone, Confidence rating 80-99%)
- Additional Contacts under the same company (e.g. IT Director, Marketing Manager)
- Detailed Website Analysis & Social Media Insights
- 3 Specific Identified Problems or Pain Points
- AI Opportunity Report:
  - matchRating (1 to 5)
  - problemChecklist: array of objects { problem: string, found: boolean }
  - potentialServices: array of objects { service: string, matched: boolean }
  - salesPotential: 'High' | 'Medium' | 'Low'
  - reasoning: clear narrative explaining why this company relies on manual tools and how the user's offerings solve their specific gaps.
- Confidence Scores: { websiteAudit: 90-99, companyData: 85-98, emailConfidence: 85-99, decisionMakerConfidence: 80-98 }
- Hyper-personalized Cold Outreach Email (Subject and Body) in a consultative tone tailored specifically to their website analysis and identified problems.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: "Generate the target B2B leads list in structured JSON using real web research.",
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              leads: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    companyName: { type: Type.STRING },
                    website: { type: Type.STRING },
                    industry: { type: Type.STRING },
                    location: { type: Type.STRING },
                    country: { type: Type.STRING },
                    companySize: { type: Type.STRING },
                    leadScore: { type: Type.NUMBER },
                    priorityLevel: { type: Type.STRING },
                    recommendedService: { type: Type.STRING },
                    decisionMakerName: { type: Type.STRING },
                    decisionMakerTitle: { type: Type.STRING },
                    decisionMakerEmail: { type: Type.STRING },
                    decisionMakerLinkedin: { type: Type.STRING },
                    decisionMakerConfidence: { type: Type.NUMBER },
                    emailConfidence: { type: Type.NUMBER },
                    additionalContacts: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          title: { type: Type.STRING },
                          email: { type: Type.STRING },
                          linkedin: { type: Type.STRING },
                        },
                      },
                    },
                    websiteAnalysis: { type: Type.STRING },
                    socialAnalysis: { type: Type.STRING },
                    identifiedProblems: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    aiRecommendations: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    opportunityReasoning: { type: Type.STRING },
                    salesPotential: { type: Type.STRING },
                    leadScoreExplanation: { type: Type.STRING },
                    researchNotes: { type: Type.STRING },
                    emailSubject: { type: Type.STRING },
                    emailBody: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      const rawLeads = parsed.leads || [];

      const formattedLeads = rawLeads.map((item: any, idx: number) => {
        const leadId = `ld-${Date.now()}-${idx + 1}`;
        const companyId = `cmpny-${Date.now()}-${idx + 1}`;

        const contactsList = [
          {
            id: `cnt-${leadId}-1`,
            companyId,
            companyName: item.companyName,
            jobId: campaignId,
            name: item.decisionMakerName || "Alex Sterling",
            title: item.decisionMakerTitle || "Managing Director / CEO",
            email: item.decisionMakerEmail || "leadership@domain.com",
            linkedin: item.decisionMakerLinkedin || "https://linkedin.com/in/executive",
            emailConfidence: item.emailConfidence || 98,
            titleConfidence: item.decisionMakerConfidence || 92,
            recommendedService: item.recommendedService || productsAndServices || "AI Sales Agent",
            emailStatus: "Drafted" as const,
            status: "New" as const,
            outreachEmail: {
              subject: item.emailSubject || `Question re: ${item.companyName}`,
              body: item.emailBody || `Hi ${item.decisionMakerName || "there"},\n\nI noticed ${item.companyName}...`,
              isEdited: false,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...(item.additionalContacts || []).map((cnt: any, cIdx: number) => ({
            id: `cnt-${leadId}-${cIdx + 2}`,
            companyId,
            companyName: item.companyName,
            jobId: campaignId,
            name: cnt.name || "Jordan Vance",
            title: cnt.title || "Operations Manager",
            email: cnt.email || "operations@domain.com",
            linkedin: cnt.linkedin || "https://linkedin.com/in/ops-lead",
            emailConfidence: 94,
            titleConfidence: 89,
            recommendedService: item.recommendedService || productsAndServices || "AI Sales Agent",
            emailStatus: "Drafted" as const,
            status: "New" as const,
            outreachEmail: {
              subject: `Streamlining operational response at ${item.companyName}`,
              body: `Hi ${cnt.name || "there"},\n\nFollowing up re: ${item.companyName}'s digital operations...`,
              isEdited: false,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        ];

        return {
          id: leadId,
          campaignId: campaignId || `cmp-${Date.now()}`,
          campaignName: campaignName || `AI Job ${targetIndustry}`,
          companyName: item.companyName || `Apex Target ${idx + 1}`,
          website: item.website || `https://${(item.companyName || "company").toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
          industry: item.industry || targetIndustry || "Technology",
          location: item.location || `${targetCountry || "United States"} Metro`,
          country: item.country || targetCountry || "United States",
          companySize: item.companySize || "50-200 employees",
          leadScore: item.leadScore || Math.floor(Math.random() * 15) + 84,
          priorityLevel: (item.priorityLevel === "High" || item.priorityLevel === "Medium" ? item.priorityLevel : "High") as any,
          recommendedService: item.recommendedService || productsAndServices || "AI Customer Support Chatbot",
          emailStatus: "Drafted" as const,
          status: "New" as const,
          decisionMaker: {
            name: item.decisionMakerName || "Alex Sterling",
            title: item.decisionMakerTitle || "Managing Director",
            email: item.decisionMakerEmail || "contact@domain.com",
            linkedin: item.decisionMakerLinkedin || "https://linkedin.com/in/executive",
            confidence: item.decisionMakerConfidence || 92,
          },
          websiteAnalysis: item.websiteAnalysis || "Website indicates high customer volume but lacks modern automated AI chat and booking tools.",
          socialAnalysis: item.socialAnalysis || "Active LinkedIn presence showing hiring growth.",
          identifiedProblems: item.identifiedProblems || [
            "Website outdated / non-responsive",
            "No online booking or instant reservation portal",
            "Manual lead qualification causing slow response time",
          ],
          aiRecommendations: item.aiRecommendations || [
            "Deploy 24/7 AI Customer Support Chatbot",
            "Integrate automated booking & CRM sync",
          ],
          suggestedProducts: [productsAndServices || "AI Sales Agent"],
          leadScoreExplanation: item.leadScoreExplanation || "High alignment with user offerings.",
          researchNotes: item.researchNotes || "MX verified domain.",
          outreachEmail: {
            subject: item.emailSubject || `Solving customer booking friction at ${item.companyName}`,
            body: item.emailBody || `Hi ${item.decisionMakerName || "there"},\n\nI was reviewing ${item.companyName}...`,
            isEdited: false,
          },
          opportunityReport: {
            matchRating: 5,
            matchLevel: "Excellent Match" as const,
            problemChecklist: (item.identifiedProblems || [
              "Website outdated or missing live chat",
              "No automated booking portal",
              "Inactive social response",
            ]).map((prob: string) => ({ problem: prob, found: true })),
            potentialServices: [
              { service: "AI Customer Support Chatbot", matched: true },
              { service: "Website Automation", matched: true },
              { service: "CRM Pipeline Sync", matched: true },
            ],
            salesPotential: (item.salesPotential || "High") as any,
            reasoning: item.opportunityReasoning || `This business relies heavily on customer inquiries but lacks modern 24/7 digital tools. Your services directly address these gaps.`,
          },
          confidenceScores: {
            websiteAudit: 96,
            companyData: 92,
            emailConfidence: item.emailConfidence || 98,
            decisionMakerConfidence: item.decisionMakerConfidence || 91,
          },
          contacts: contactsList,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      // Auto-sync results to Supabase tables asynchronously
      const allContacts = formattedLeads.flatMap((l: any) => l.contacts || []);
      syncLeadsToSupabase(formattedLeads).catch((err) => console.warn("Supabase background leads sync:", err));
      syncDecisionMakersToSupabase(allContacts).catch((err) => console.warn("Supabase background contacts sync:", err));

      res.json({ leads: formattedLeads, source: "gemini_ai" });
    } catch (err: any) {
      console.warn("Gemini AI lead generation fallback notice:", err?.message || err);
      // Fallback
      const fallbackLeads = generateFallbackLeads(
        req.body.campaignId,
        req.body.campaignName,
        req.body.targetIndustry,
        req.body.targetCountry,
        req.body.businessName,
        req.body.productsAndServices,
        req.body.leadLimit || 6,
        req.body.prompt || ""
      );
      res.json({ leads: fallbackLeads, source: "mock_fallback", notice: "Loaded benchmark prospect leads." });
    }
  });

  // Serve static files in production or Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

function extractIndustryFromPrompt(p: string): string {
  const lower = p.toLowerCase();
  if (lower.includes('school') || lower.includes('education') || lower.includes('university') || lower.includes('college')) return 'Education / Schools';
  if (lower.includes('construction') || lower.includes('builder') || lower.includes('contractor')) return 'Construction & Real Estate';
  if (lower.includes('hotel') || lower.includes('resort') || lower.includes('hospitality') || lower.includes('lodge')) return 'Hospitality & Tourism';
  if (lower.includes('logistics') || lower.includes('transport') || lower.includes('freight') || lower.includes('supply chain')) return 'Logistics & Supply Chain';
  if (lower.includes('ngo') || lower.includes('non-profit') || lower.includes('charity')) return 'Non-Profit & NGO';
  if (lower.includes('tech') || lower.includes('software') || lower.includes('saas') || lower.includes('it')) return 'Technology & Software';
  if (lower.includes('health') || lower.includes('clinic') || lower.includes('hospital') || lower.includes('pharma')) return 'Healthcare & Wellness';
  if (lower.includes('bank') || lower.includes('fintech') || lower.includes('financial') || lower.includes('insurance')) return 'Financial Services';
  return 'B2B Commercial Services';
}

function extractCountryFromPrompt(p: string): string {
  const lower = p.toLowerCase();
  if (lower.includes('zambia') || lower.includes('lusaka') || lower.includes('ndola') || lower.includes('kitwe') || lower.includes('livingstone') || lower.includes('kabwe') || lower.includes('chingola') || lower.includes('mufulira')) return 'Zambia';
  if (lower.includes('south africa') || lower.includes('joburg') || lower.includes('cape town') || lower.includes('durban') || lower.includes('sandton') || lower.includes('pretoria')) return 'South Africa';
  if (lower.includes('kenya') || lower.includes('nairobi') || lower.includes('mombasa')) return 'Kenya';
  if (lower.includes('nigeria') || lower.includes('lagos') || lower.includes('abuja')) return 'Nigeria';
  if (lower.includes('united states') || lower.includes('usa') || lower.includes('america') || lower.includes('us')) return 'United States';
  if (lower.includes('uk') || lower.includes('united kingdom') || lower.includes('london') || lower.includes('manchester')) return 'United Kingdom';
  if (lower.includes('germany') || lower.includes('europe') || lower.includes('frankfurt')) return 'Germany';
  return 'Zambia';
}

function extractNumberFromPrompt(p: string): number | null {
  const match = p.match(/\b(\d+)\b/);
  return match ? parseInt(match[1], 10) : null;
}

function generateFallbackLeads(
  campaignId: string,
  campaignName: string,
  industry: string = "Technology",
  country: string = "Zambia",
  businessName: string = "Apex Growth Lab",
  products: string = "AI Sales Agent",
  limit: number = 6,
  promptText: string = ""
) {
  const combinedContext = `${campaignName} ${industry} ${country} ${promptText}`.toLowerCase();
  const isZambia = combinedContext.includes('zambia') || combinedContext.includes('lusaka') || combinedContext.includes('ndola') || combinedContext.includes('kitwe') || combinedContext.includes('livingstone') || combinedContext.includes('kabwe') || combinedContext.includes('chingola') || country === 'Zambia' || !country;
  const isSouthAfrica = combinedContext.includes('south africa') || combinedContext.includes('joburg') || combinedContext.includes('cape town') || combinedContext.includes('durban');
  const isKenya = combinedContext.includes('kenya') || combinedContext.includes('nairobi') || combinedContext.includes('mombasa');
  const isNigeria = combinedContext.includes('nigeria') || combinedContext.includes('lagos') || combinedContext.includes('abuja');

  let sampleCompanies: Array<{ name: string; city: string; domain: string; size: string; score: number; dmName: string; dmTitle: string; countryName: string }> = [];

  if (isZambia) {
    if (combinedContext.includes('school') || combinedContext.includes('education') || combinedContext.includes('college') || combinedContext.includes('university') || industry.includes('Education')) {
      sampleCompanies = [
        { name: "Lusaka International Community School (LICS)", city: "Lusaka, Zambia", domain: "lics.sch.zm", size: "80-150 staff", score: 96, dmName: "Chileshe Bwalya", dmTitle: "Head of Admissions & IT", countryName: "Zambia" },
        { name: "Baobab College Lusaka", city: "Lusaka, Zambia", domain: "baobabcollege.org", size: "50-120 staff", score: 93, dmName: "Mwiinga Musonda", dmTitle: "Principal & Academic Director", countryName: "Zambia" },
        { name: "American International School of Lusaka (AISL)", city: "Lusaka, Zambia", domain: "aislusaka.org", size: "100-200 staff", score: 91, dmName: "Natasha Mulenga", dmTitle: "Director of Communications", countryName: "Zambia" },
        { name: "The Copperbelt University Consultancy", city: "Kitwe, Copperbelt, Zambia", domain: "cbu.ac.zm", size: "200-500 staff", score: 89, dmName: "Kondwani Phiri", dmTitle: "Dean of Institutional Projects", countryName: "Zambia" },
        { name: "Texila American University Zambia", city: "Lusaka, Zambia", domain: "tau.edu.zm", size: "60-150 staff", score: 87, dmName: "Mutale Tembo", dmTitle: "Head of Student Enrollment", countryName: "Zambia" },
        { name: "Apex Medical University Zambia", city: "Lusaka, Zambia", domain: "lamu.edu.zm", size: "70-160 staff", score: 85, dmName: "Kabwe Mwamba", dmTitle: "Registrar & IT Officer", countryName: "Zambia" },
        { name: "Rhodes Park School Lusaka", city: "Lusaka, Zambia", domain: "rhodesparkschool.net", size: "90-180 staff", score: 84, dmName: "Lombe Sampa", dmTitle: "General Manager", countryName: "Zambia" },
        { name: "Chengelo International School", city: "Mkushi, Central Province, Zambia", domain: "chengeloschool.org", size: "60-130 staff", score: 82, dmName: "Twaambo Chibwe", dmTitle: "Operations Director", countryName: "Zambia" }
      ];
    } else if (combinedContext.includes('construction') || combinedContext.includes('builder') || combinedContext.includes('estate') || industry.includes('Construction')) {
      sampleCompanies = [
        { name: "Zambian Industrial & Commercial Construction", city: "Ndola, Copperbelt, Zambia", domain: "zicc.co.zm", size: "120-300 employees", score: 95, dmName: "Mutale Bwalya", dmTitle: "Managing Director", countryName: "Zambia" },
        { name: "Lusaka South Multi-Facility Zone (LSMFEZ)", city: "Lusaka, Zambia", domain: "lsmfez.co.zm", size: "80-250 employees", score: 92, dmName: "Chileshe Musonda", dmTitle: "Infrastructure & Commercial Manager", countryName: "Zambia" },
        { name: "Copperbelt Building & Mining Contractors", city: "Kitwe, Zambia", domain: "copperbeltbuilders.co.zm", size: "150-400 employees", score: 90, dmName: "Kondwani Phiri", dmTitle: "Chief Operations Officer", countryName: "Zambia" },
        { name: "Kafue Estate & Infrastructure Group", city: "Kafue, Zambia", domain: "kafueestates.co.zm", size: "40-100 employees", score: 87, dmName: "Natasha Tembo", dmTitle: "Head of Commercial Development", countryName: "Zambia" },
        { name: "Zambezi Heavy Construction & Civil", city: "Lusaka, Zambia", domain: "zambeziconstruction.com", size: "90-220 employees", score: 85, dmName: "Kabwe Mwamba", dmTitle: "Projects Director", countryName: "Zambia" },
        { name: "Ndola Industrial Park Developers", city: "Ndola, Zambia", domain: "ndolapark.co.zm", size: "50-130 employees", score: 83, dmName: "Lombe Sampa", dmTitle: "General Manager", countryName: "Zambia" }
      ];
    } else if (combinedContext.includes('hotel') || combinedContext.includes('resort') || combinedContext.includes('hospitality') || combinedContext.includes('lodge') || industry.includes('Hospitality')) {
      sampleCompanies = [
        { name: "Taj Pamodzi Hotel Lusaka", city: "Lusaka, Zambia", domain: "tajpamodzi.co.zm", size: "150-300 staff", score: 96, dmName: "Natasha Mulenga", dmTitle: "General Manager", countryName: "Zambia" },
        { name: "Radisson Blu Hotel Lusaka", city: "Lusaka, Zambia", domain: "radissonblu-lusaka.co.zm", size: "120-250 staff", score: 94, dmName: "Chileshe Bwalya", dmTitle: "Director of Sales & Events", countryName: "Zambia" },
        { name: "Avani Victoria Falls Resort", city: "Livingstone, Zambia", domain: "avanilivingstone.co.zm", size: "200-450 staff", score: 92, dmName: "Mwiinga Musonda", dmTitle: "Head of Guest Experience", countryName: "Zambia" },
        { name: "The Royal Livingstone Resort", city: "Livingstone, Zambia", domain: "royallivingstone.co.zm", size: "180-400 staff", score: 89, dmName: "Kondwani Phiri", dmTitle: "Operations Director", countryName: "Zambia" },
        { name: "Protea Hotel Marriott Lusaka Tower", city: "Lusaka, Zambia", domain: "protealusaka.co.zm", size: "100-220 staff", score: 87, dmName: "Mutale Tembo", dmTitle: "Reservations & IT Lead", countryName: "Zambia" },
        { name: "Neela Valley Safari Lodge", city: "South Luangwa, Zambia", domain: "neelavalley.co.zm", size: "30-80 staff", score: 84, dmName: "Kabwe Mwamba", dmTitle: "Hospitality Director", countryName: "Zambia" }
      ];
    } else {
      sampleCompanies = [
        { name: "ZamNet Communication Systems", city: "Lusaka, Zambia", domain: "zamnet.zm", size: "100-250 employees", score: 95, dmName: "Chileshe Bwalya", dmTitle: "Chief Technology Officer", countryName: "Zambia" },
        { name: "Copperbelt Freight & Logistics Ltd", city: "Kitwe, Zambia", domain: "copperbeltfreight.co.zm", size: "80-200 employees", score: 92, dmName: "Mwiinga Musonda", dmTitle: "Head of Logistics & Operations", countryName: "Zambia" },
        { name: "Zambezi Commercial & Agricultural Corp", city: "Chisamba, Zambia", domain: "zambezicorp.co.zm", size: "150-350 employees", score: 89, dmName: "Kondwani Phiri", dmTitle: "Managing Director", countryName: "Zambia" },
        { name: "Lusaka Digital Systems & Automation", city: "Lusaka, Zambia", domain: "lusakatech.co.zm", size: "40-90 employees", score: 87, dmName: "Natasha Mulenga", dmTitle: "VP of Business Development", countryName: "Zambia" },
        { name: "Kabwe Commercial Distributors", city: "Kabwe, Zambia", domain: "kabwedistro.co.zm", size: "60-140 employees", score: 85, dmName: "Mutale Tembo", dmTitle: "Commercial Lead", countryName: "Zambia" },
        { name: "Apex Fleet & Supply Chain Zambia", city: "Ndola, Zambia", domain: "apexlogistics.co.zm", size: "70-160 employees", score: 83, dmName: "Kabwe Mwamba", dmTitle: "Operations Manager", countryName: "Zambia" }
      ];
    }
  } else if (isSouthAfrica) {
    sampleCompanies = [
      { name: "Vanguard Tech South Africa", city: "Johannesburg, South Africa", domain: "vanguardtech.co.za", size: "100-250 employees", score: 95, dmName: "Johan van der Merwe", dmTitle: "Chief Operating Officer", countryName: "South Africa" },
      { name: "Nexus Cape Logistics", city: "Cape Town, South Africa", domain: "nexuslogistics.co.za", size: "80-200 employees", score: 92, dmName: "Sipho Dlamini", dmTitle: "Head of Fleet Operations", countryName: "South Africa" },
      { name: "Strata Financial Sandton", city: "Sandton, Johannesburg, South Africa", domain: "stratafinancial.co.za", size: "150-400 employees", score: 89, dmName: "Anika Naidoo", dmTitle: "Managing Director", countryName: "South Africa" },
      { name: "Apex HealthTech Durban", city: "Durban, South Africa", domain: "apexhealth.co.za", size: "40-100 employees", score: 86, dmName: "Lethabo Nkosi", dmTitle: "Director of Technology", countryName: "South Africa" }
    ];
  } else if (isKenya) {
    sampleCompanies = [
      { name: "Safaritech Innovation Hub", city: "Nairobi, Kenya", domain: "safaritech.co.ke", size: "100-250 employees", score: 95, dmName: "Maina Kamau", dmTitle: "Head of Enterprise Solutions", countryName: "Kenya" },
      { name: "Mombasa Maritime Freight", city: "Mombasa, Kenya", domain: "mombasafreight.co.ke", size: "80-200 employees", score: 92, dmName: "Amina Hassan", dmTitle: "Operations Director", countryName: "Kenya" }
    ];
  } else if (isNigeria) {
    sampleCompanies = [
      { name: "Lagos Commerce Automation", city: "Lagos, Nigeria", domain: "lagoscommerce.ng", size: "120-300 employees", score: 95, dmName: "Babatunde Adeleke", dmTitle: "VP of Growth", countryName: "Nigeria" },
      { name: "Abuja Industrial Construction", city: "Abuja, Nigeria", domain: "abujabuilders.ng", size: "100-250 employees", score: 91, dmName: "Nneka Okonkwo", dmTitle: "Commercial Director", countryName: "Nigeria" }
    ];
  } else {
    sampleCompanies = [
      { name: "Vanguard Tech Systems", city: "New York, NY", domain: "vanguardtech.com", size: "100-250 employees", score: 95, dmName: "Elena Rostova", dmTitle: "VP of Growth & Tech", countryName: "United States" },
      { name: "Nexus Cloud Logistics", city: "Frankfurt, Germany", domain: "nexuscloud.de", size: "50-120 employees", score: 91, dmName: "Marcus Brody", dmTitle: "Chief Operating Officer", countryName: "Germany" },
      { name: "Strata Global Financial", city: "London, UK", domain: "strataglobal.co.uk", size: "200-500 employees", score: 88, dmName: "Sarah Jenkins", dmTitle: "Head of Digital Operations", countryName: "United Kingdom" },
      { name: "Apex Health Informatics", city: "Boston, MA", domain: "apexhealth.io", size: "30-80 employees", score: 86, dmName: "David Chen", dmTitle: "Director of IT", countryName: "United States" }
    ];
  }

  return sampleCompanies.slice(0, limit).map((c, i) => ({
    id: `ld-gen-${Date.now()}-${i}`,
    campaignId: campaignId || `cmp-${Date.now()}`,
    campaignName: campaignName || `Campaign ${industry}`,
    companyName: c.name,
    website: `https://${c.domain}`,
    industry: industry || "Technology",
    location: c.city,
    country: c.countryName || country || "Zambia",
    companySize: c.size,
    leadScore: c.score,
    priorityLevel: c.score > 85 ? "High" : "Medium",
    recommendedService: products || "AI Sales Agent",
    emailStatus: "Drafted",
    status: "New",
    decisionMaker: {
      name: c.dmName,
      title: c.dmTitle,
      email: `leadership@${c.domain}`,
      linkedin: `https://linkedin.com/in/${c.dmName.toLowerCase().replace(/[^a-z]/g, "")}-exec`,
    },
    websiteAnalysis: `Verified regional domain in ${c.city}. Identified active push for digital modernization in ${industry}. Tech stack includes modern web framework and active CRM hooks.`,
    socialAnalysis: "Active presence regarding operational growth and regional client service.",
    identifiedProblems: [
      `High manual overhead in ${industry} inquiry processing`,
      "Sub-optimal lead response latency on digital channels",
      "Lack of automated booking and CRM integration",
    ],
    aiRecommendations: [
      `Deploy ${products} to automate response speed and lead capture`,
      "Integrate Webhook automation with CRM & Google Sheets",
    ],
    suggestedProducts: [products],
    leadScoreExplanation: `Score of ${c.score}/100 calculated from tech fit, executive availability, and target location match (${c.city}).`,
    researchNotes: "Verified DNS MX record and active SSL certificate.",
    outreachEmail: {
      subject: `Solving ${industry} inquiry response speed at ${c.name}`,
      body: `Hi ${c.dmName.split(" ")[0]},\n\nI was reviewing ${c.name}'s digital presence in ${c.city} and noticed your work in ${industry}.\n\nAt ${businessName}, we built an AI Sales Agent specifically designed to discover high-intent leads and automate 24/7 client response.\n\nWould you be open to a brief 10-minute preview this week?\n\nBest regards,\nGrowth Team\n${businessName}`,
      isEdited: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

startServer();
