import { createHmac, createHash, randomInt } from "crypto";

const OTP_SECRET =
  process.env.AUTH_SECRET ||
  process.env.RESEND_API_KEY ||
  "portfolio-creative-otp-challenge-key-2026";

export function generate6DigitOtp(): string {
  return String(randomInt(100000, 999999));
}

export function hashOtp(otp: string): string {
  return createHash("sha256").update(otp.trim()).digest("hex");
}

export type OtpChallengeToken = {
  email: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
};

export function signChallenge(challenge: OtpChallengeToken): string {
  const payload = Buffer.from(JSON.stringify(challenge)).toString("base64url");
  const signature = createHmac("sha256", OTP_SECRET).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyChallengeToken(token: string): OtpChallengeToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expectedSignature = createHmac("sha256", OTP_SECRET).update(payload).digest("hex");
    if (signature !== expectedSignature) return null;
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return json as OtpChallengeToken;
  } catch {
    return null;
  }
}

export function signVerifiedSession(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email: email.toLowerCase().trim(), verifiedAt: Date.now() }),
  ).toString("base64url");
  const signature = createHmac("sha256", OTP_SECRET).update(payload).digest("hex");
  return `verified:${payload}.${signature}`;
}

export function verifyVerifiedSession(token: string, email: string): boolean {
  try {
    if (!token.startsWith("verified:")) return false;
    const raw = token.slice("verified:".length);
    const parts = raw.split(".");
    if (parts.length !== 2) return false;
    const [payload, signature] = parts;
    const expectedSignature = createHmac("sha256", OTP_SECRET).update(payload).digest("hex");
    if (signature !== expectedSignature) return false;
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email: string;
      verifiedAt: number;
    };
    if (json.email !== email.toLowerCase().trim()) return false;
    if (Date.now() - json.verifiedAt > 30 * 60 * 1000) return false;
    return true;
  } catch {
    return false;
  }
}
