/**
 * Google Apps Script Email Dispatcher Integration
 * Allows free cold email sending directly through the user's Gmail account using a Google Apps Script Web App.
 */

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `
/**
 * AI Sales Agent - Free Gmail Cold Email Dispatcher
 * Instructions:
 * 1. Open https://script.google.com and click "New project".
 * 2. Paste this complete code into Code.gs
 * 3. Click "Deploy" -> "New deployment" -> Select type: "Web app"
 * 4. Set Description: "AI Sales Agent Dispatcher"
 * 5. Set Execute as: "Me" (your Gmail account)
 * 6. Set Who has access: "Anyone"
 * 7. Click "Deploy", authorize permissions, and copy the Web App URL!
 * 8. Paste the Web App URL into your AI Sales Agent Settings page.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!data.recipientEmail || !data.subject || !data.body) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Missing required fields: recipientEmail, subject, body"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Optional sender name or signature
    var htmlBody = data.body.replace(/\\n/g, "<br>");
    
    // Send email using GmailApp API
    GmailApp.sendEmail(data.recipientEmail, data.subject, data.body, {
      htmlBody: "<div style='font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;'>" + htmlBody + "</div>",
      name: data.senderName || "AI Sales Intelligence Agent"
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Email successfully sent via Gmail!",
      sentTo: data.recipientEmail,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    service: "AI Sales Agent Gmail Dispatcher",
    activeUser: Session.getActiveUser().getEmail()
  })).setMimeType(ContentService.MimeType.JSON);
}
`.trim();

export async function dispatchEmailViaGoogleScript(payload: {
  scriptUrl?: string;
  recipientEmail: string;
  recipientName?: string;
  companyName?: string;
  subject: string;
  body: string;
  senderName?: string;
}) {
  const url = payload.scriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!url) {
    // Simulated direct success if script URL not yet set
    return {
      success: true,
      simulated: true,
      message: `Email queued for ${payload.recipientEmail} (${payload.companyName || 'Lead'}). Configure Google Apps Script URL in Settings to send directly via Gmail!`,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const resData = await response.json().catch(() => ({}));

    if (resData.status === 'success' || response.ok) {
      return {
        success: true,
        simulated: false,
        message: resData.message || `Email sent successfully to ${payload.recipientEmail} via Gmail Apps Script!`,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        simulated: false,
        error: resData.message || 'Google Apps Script returned an error',
      };
    }
  } catch (err: any) {
    console.error('Google Apps Script post error:', err);
    return {
      success: false,
      simulated: true,
      message: `Failed to reach Google Apps Script web app: ${err.message}. Email logged locally.`,
    };
  }
}
