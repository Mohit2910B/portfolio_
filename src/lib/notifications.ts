import { db } from "@/db";
import { notificationSettings } from "@/db/schema";

export type SendEmailResult = {
  ok: boolean;
  id?: string;
  error?: string;
};

export async function getNotificationSettings() {
  const defaultEmail =
    cleanEnvValue(process.env.NOTIFICATION_EMAIL) ||
    cleanEnvValue(process.env.SEED_ADMIN_EMAIL) ||
    "mohitbabariyaa@gmail.com";

  try {
    const rows = await db.select().from(notificationSettings).limit(1);
    const row = rows[0];
    if (row) {
      return {
        id: row.id,
        emailEnabled: row.emailEnabled !== false,
        notificationEmail: row.notificationEmail?.trim().toLowerCase() || defaultEmail,
        adminStatus: (row.adminStatus as "online" | "offline") || "offline",
        aiAutoReply: row.aiAutoReply !== false,
      };
    }
    return {
      id: 1,
      emailEnabled: true,
      notificationEmail: defaultEmail,
      adminStatus: "offline" as const,
      aiAutoReply: true,
    };
  } catch (error) {
    console.error("[notifications] Failed to fetch notification settings:", error);
    return {
      id: 1,
      emailEnabled: true,
      notificationEmail: defaultEmail,
      adminStatus: "offline" as const,
      aiAutoReply: true,
    };
  }
}

function cleanEnvValue(value?: string): string {
  if (!value) return "";
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'")) ||
    (v.startsWith("`") && v.endsWith("`"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  const key = cleanEnvValue(process.env.RESEND_API_KEY);
  if (!key) {
    console.error(
      "[notifications] sendEmail failed: RESEND_API_KEY is not configured in environment variables.",
    );
    return { ok: false, error: "RESEND_API_KEY is not configured in environment variables" };
  }

  const recipient = to?.trim().toLowerCase();
  if (!recipient) {
    console.error("[notifications] sendEmail failed: Recipient email address is missing.");
    return { ok: false, error: "Recipient email is required" };
  }

  const rawFrom =
    cleanEnvValue(process.env.RESEND_FROM_EMAIL) ||
    cleanEnvValue(process.env.EMAIL_FROM);

  let from = "Mohit Babariya <noreply@mohitbabariya.in>";
  if (
    rawFrom &&
    !rawFrom.toLowerCase().includes("@gmail.") &&
    !rawFrom.toLowerCase().includes("@yahoo.") &&
    !rawFrom.toLowerCase().includes("@outlook.") &&
    !rawFrom.toLowerCase().includes("@hotmail.")
  ) {
    from = rawFrom;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject,
        html,
      }),
    });

    const text = await response.text();
    let data: Record<string, unknown> | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errMsg =
        (data && typeof data.message === "string" && data.message) ||
        (data && typeof data.error === "string" && data.error) ||
        text ||
        `HTTP ${response.status}`;

      console.error(
        `[notifications] Resend API error (${response.status}) for recipient ${recipient}:`,
        errMsg,
      );
      return { ok: false, error: errMsg };
    }

    const emailId = data && typeof data.id === "string" ? data.id : undefined;
    console.log(
      `[notifications] Resend email dispatched to ${recipient} (id: ${emailId ?? "accepted"})`,
    );
    return { ok: true, id: emailId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[notifications] Network error calling Resend API:`, message);
    return { ok: false, error: `Connection to Resend failed: ${message}` };
  }
}

export async function sendAdminNotification(
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  const settings = await getNotificationSettings();
  if (!settings.emailEnabled || !settings.notificationEmail) {
    return { ok: false, error: "Admin email notification is disabled" };
  }
  return sendEmail(settings.notificationEmail, subject, html);
}

export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: string,
): Promise<SendEmailResult> {
  const brandName = "Mohit Babariya Portfolio";
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:28px 24px;border-radius:16px;background:#ffffff;border:1px solid #e5e5e5;color:#111111;">
      <div style="margin-bottom:20px;">
        <span style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#e0147f;">${brandName}</span>
      </div>
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;line-height:1.3;color:#0b0b0c;">${purpose} Verification Code</h2>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#555555;">Use the one-time verification code below to verify your email. This code is valid for 10 minutes.</p>
      <div style="background:#f7f5f2;border:1px dashed #d6d3ce;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;">
        <span style="font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#0b0b0c;display:inline-block;padding-left:10px;">${otp}</span>
      </div>
      <p style="margin:0;font-size:12px;color:#888888;">If you did not request this verification code, you can safely ignore this email.</p>
    </div>
  `;
  return sendEmail(to, `${otp} is your ${purpose} verification code`, html);
}

export async function sendEnquiryOtpEmail(
  to: string,
  otp: string,
): Promise<SendEmailResult> {
  return sendOtpEmail(to, otp, "Contact enquiry");
}

