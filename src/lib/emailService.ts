/**
 * Robust Email Notification Service for Project Inquiries
 * Handles transactional emails via Resend API with comprehensive validation,
 * beautiful black-and-gold HTML formatting, error handling, and security.
 */

export interface ProjectInquiryPayload {
  name: string;
  email: string;
  phone?: string;
  countryCode?: string;
  company?: string;
  projectType?: string;
  deadline?: string;
  budget?: string;
  description: string;
  clientIp?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  provider?: string;
  id?: string;
  unconfigured?: boolean;
  error?: string;
}

const PRIMARY_RECIPIENT = "mohitbabariyaa@gmail.com";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Builds a luxury black-and-gold branded HTML email notification
 */
export function buildInquiryHtmlEmail(data: ProjectInquiryPayload): string {
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safePhone = escapeHtml(data.phone || "Not provided");
  const safeCompany = escapeHtml(data.company || "Individual / Not specified");
  const safeCategory = escapeHtml(data.projectType || "General Inquiry");
  const safeTimeline = escapeHtml(data.deadline || "Flexible");
  const safeBudget = escapeHtml(data.budget || "Not specified");
  const formattedDescription = escapeHtml(data.description).replace(/\n/g, "<br/>");
  const submissionTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "medium",
  });

  // Clean phone digits for WhatsApp
  const rawDigits = (data.phone || "").replace(/\D/g, "");
  const waUrl = rawDigits ? `https://wa.me/${rawDigits}` : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Project Inquiry</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f0e8;">
  <div style="max-width: 620px; margin: 30px auto; background-color: #0c0c0e; border: 1px solid rgba(199, 165, 106, 0.35); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);">
    
    <!-- Top Gold Bar -->
    <div style="background: linear-gradient(90deg, #996515, #C7A56A, #E5C384, #C7A56A, #996515); height: 5px;"></div>

    <!-- Header Section -->
    <div style="padding: 32px 36px 20px 36px; border-bottom: 1px solid rgba(243, 240, 232, 0.08);">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.25em; color: #C7A56A; text-transform: uppercase; margin-bottom: 8px;">
        PORTFOLIO INBOX // NEW PROJECT BRIEF
      </div>
      <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #f3f0e8; letter-spacing: -0.02em;">
        ${safeName}
      </h1>
      <div style="margin-top: 8px; display: inline-block; background: rgba(199, 165, 106, 0.15); border: 1px solid rgba(199, 165, 106, 0.4); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; color: #E5C384; letter-spacing: 0.05em; text-transform: uppercase;">
        ${safeCategory}
      </div>
    </div>

    <!-- Details Grid -->
    <div style="padding: 28px 36px;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(243, 240, 232, 0.06); width: 40%; font-size: 12px; font-weight: 600; color: #8a8a8a; text-transform: uppercase; letter-spacing: 0.1em;">Client Email</td>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(243, 240, 232, 0.06); font-size: 14px; font-weight: 500; color: #f3f0e8;">
            <a href="mailto:${safeEmail}" style="color: #C7A56A; text-decoration: none; font-weight: 600;">${safeEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(243, 240, 232, 0.06); font-size: 12px; font-weight: 600; color: #8a8a8a; text-transform: uppercase; letter-spacing: 0.1em;">Phone / WhatsApp</td>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(243, 240, 232, 0.06); font-size: 14px; font-weight: 500; color: #f3f0e8;">
            ${safePhone !== "Not provided" ? `<a href="tel:${safePhone}" style="color: #f3f0e8; text-decoration: none;">${safePhone}</a>` : safePhone}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(243, 240, 232, 0.06); font-size: 12px; font-weight: 600; color: #8a8a8a; text-transform: uppercase; letter-spacing: 0.1em;">Company / Brand</td>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(243, 240, 232, 0.06); font-size: 14px; font-weight: 500; color: #f3f0e8;">
            ${safeCompany}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(243, 240, 232, 0.06); font-size: 12px; font-weight: 600; color: #8a8a8a; text-transform: uppercase; letter-spacing: 0.1em;">Estimated Timeline</td>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(243, 240, 232, 0.06); font-size: 14px; font-weight: 500; color: #f3f0e8;">
            ${safeTimeline}
          </td>
        </tr>
        ${data.budget ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(243, 240, 232, 0.06); font-size: 12px; font-weight: 600; color: #8a8a8a; text-transform: uppercase; letter-spacing: 0.1em;">Estimated Budget</td>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(243, 240, 232, 0.06); font-size: 14px; font-weight: 500; color: #f3f0e8;">
            ${safeBudget}
          </td>
        </tr>
        ` : ""}
      </table>

      <!-- Project Brief Box -->
      <div style="margin-top: 24px;">
        <div style="font-size: 12px; font-weight: 700; color: #C7A56A; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 10px;">
          PROJECT DETAILS & REQUIREMENTS
        </div>
        <div style="background-color: #141417; border-left: 3px solid #C7A56A; border-radius: 8px; padding: 18px 20px; font-size: 14px; line-height: 1.65; color: #e1ded5;">
          ${formattedDescription}
        </div>
      </div>

      <!-- Quick Action CTA Buttons -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(243, 240, 232, 0.08); text-align: center;">
        <a href="mailto:${safeEmail}?subject=${encodeURIComponent(`Re: Project Inquiry // ${data.projectType || 'Creative Work'}`)}" 
           style="display: inline-block; background: linear-gradient(135deg, #C7A56A, #A68045); color: #0c0c0e; text-decoration: none; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 14px 28px; border-radius: 9999px; margin: 6px; box-shadow: 0 4px 15px rgba(199, 165, 106, 0.3);">
          ✉ REPLY VIA EMAIL
        </a>
        ${waUrl ? `
        <a href="${waUrl}" target="_blank"
           style="display: inline-block; background-color: #1a1a1e; color: #f3f0e8; border: 1px solid rgba(199, 165, 106, 0.4); text-decoration: none; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 13px 26px; border-radius: 9999px; margin: 6px;">
          💬 WHATSAPP CHAT
        </a>
        ` : ""}
      </div>
    </div>

    <!-- Footer Section -->
    <div style="background-color: #070708; padding: 20px 36px; border-top: 1px solid rgba(243, 240, 232, 0.06); text-align: center; font-size: 11px; color: #6b6b6b;">
      <p style="margin: 0 0 6px 0;">Delivered instantly to <strong>${PRIMARY_RECIPIENT}</strong> via Mohit Babariya Creative Portfolio CMS.</p>
      <p style="margin: 0;">Submission Time: ${submissionTime} ${data.clientIp ? `• IP: ${escapeHtml(data.clientIp)}` : ""}</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Builds plain text fallback for email clients
 */
export function buildInquiryPlainText(data: ProjectInquiryPayload): string {
  return `
NEW PROJECT INQUIRY // MOHIT BABARIYA CMS
========================================
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || "N/A"}
Company: ${data.company || "N/A"}
Category: ${data.projectType || "General"}
Timeline: ${data.deadline || "Flexible"}
Budget: ${data.budget || "N/A"}

PROJECT DETAILS:
----------------------------------------
${data.description}
----------------------------------------
Time: ${new Date().toISOString()}
IP: ${data.clientIp || "N/A"}
  `.trim();
}

/**
 * Sends the project inquiry email to Mohitbabariyaa@gmail.com
 * using Resend API.
 */
export async function sendProjectInquiryEmail(data: ProjectInquiryPayload): Promise<EmailDispatchResult> {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const targetEmail = (process.env.NOTIFICATION_EMAIL || PRIMARY_RECIPIENT).trim();

  if (!apiKey || apiKey.includes("your_api_key_here") || apiKey.includes("re_your_api_key")) {
    console.warn(
      "[emailService] RESEND_API_KEY is not configured in environment variables. Email could not be dispatched."
    );
    return {
      success: false,
      unconfigured: true,
      error: "Email notification service is not configured with a valid RESEND_API_KEY.",
    };
  }

  // Sender address: In Resend test mode, must be onboarding@resend.dev (or verified domain in production)
  const fromEmail = (
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    "Mohit Babariya Portfolio <onboarding@resend.dev>"
  ).trim();

  const subject = `New Project Brief: ${data.name} — ${data.projectType || "Creative Inquiry"}`;
  const htmlContent = buildInquiryHtmlEmail(data);
  const textContent = buildInquiryPlainText(data);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [targetEmail],
        reply_to: data.email,
        subject,
        html: htmlContent,
        text: textContent,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = result?.message || result?.error || `HTTP ${response.status} from Resend`;
      console.error(`[emailService] Resend API error (${response.status}):`, errorMsg);
      return {
        success: false,
        provider: "resend",
        error: errorMsg,
      };
    }

    console.log(`[emailService] Inquiry email successfully dispatched via Resend (ID: ${result.id}) to ${targetEmail}`);
    return {
      success: true,
      provider: "resend",
      id: result.id,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[emailService] Network exception while calling Resend:", errorMsg);
    return {
      success: false,
      provider: "resend",
      error: errorMsg,
    };
  }
}
