import bcrypt from "bcryptjs";

export function normalizePhone(input: string) {
  const p = input.trim();
  const digits = p.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function generateOtpCode() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

export async function hashOtp(code: string) {
  return await bcrypt.hash(code, 10);
}

export async function verifyOtpHash(code: string, hash: string) {
  return await bcrypt.compare(code, hash);
}

