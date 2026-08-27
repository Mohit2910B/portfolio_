const RULES: Record<string, { min: number; max: number }> = {
  "+91": { min: 10, max: 10 }, "+1": { min: 10, max: 10 }, "+44": { min: 9, max: 10 },
  "+971": { min: 9, max: 9 }, "+61": { min: 9, max: 9 }, "+65": { min: 8, max: 8 },
  "+49": { min: 10, max: 11 }, "+33": { min: 9, max: 9 }, "+34": { min: 9, max: 9 },
  "+39": { min: 9, max: 10 }, "+31": { min: 9, max: 9 }, "+81": { min: 9, max: 10 },
  "+86": { min: 11, max: 11 }, "+7": { min: 10, max: 10 }, "+55": { min: 10, max: 11 },
  "+27": { min: 9, max: 9 }, "+234": { min: 10, max: 10 }, "+20": { min: 10, max: 10 },
  "+880": { min: 10, max: 10 }, "+94": { min: 9, max: 9 }, "+92": { min: 10, max: 10 },
  "+966": { min: 9, max: 9 }, "+974": { min: 8, max: 8 }, "+968": { min: 8, max: 8 },
};
export function normalizePhone(code: string, phone: string) {
  return phone.replace(/\D/g, "");
}
export function validatePhone(code: string, phone: string) {
  const digits = normalizePhone(code, phone);
  const rule = RULES[code] ?? { min: 7, max: 15 };
  if (digits.length < rule.min || digits.length > rule.max) return `Enter a valid ${code} mobile number (${rule.min}${rule.max !== rule.min ? `–${rule.max}` : ""} digits).`;
  if (/^(\d)\1+$/.test(digits)) return "Enter a real mobile number.";
  return null;
}
export const SUPPORTED_COUNTRY_CODES = Object.keys(RULES);
