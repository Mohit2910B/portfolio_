import { db } from "@/db";
import { notificationSettings } from "@/db/schema";

export async function getNotificationSettings() {
  const rows = await db.select().from(notificationSettings).limit(1);
  return rows[0] ?? { id: 1, emailEnabled: false, notificationEmail: process.env.NOTIFICATION_EMAIL ?? "" };
}

export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;
  const from = process.env.EMAIL_FROM || "Portfolio <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  return response.ok;
}

export async function sendAdminNotification(subject: string, html: string) {
  const settings = await getNotificationSettings();
  if (!settings.emailEnabled || !settings.notificationEmail) return false;
  return sendEmail(settings.notificationEmail, subject, html);
}

export async function sendOtpEmail(to: string, otp: string, purpose: string) {
  return sendEmail(to, `Your ${purpose} OTP`, `<div style="font-family:Arial,sans-serif"><h2>${purpose} verification</h2><p>Your OTP is:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${otp}</p><p>This code expires in 10 minutes.</p></div>`);
}

export async function sendEnquiryOtpEmail(to: string, otp: string) {
  return sendOtpEmail(to, otp, "Contact enquiry");
}
