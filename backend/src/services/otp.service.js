// OTP helper utilities for email verification.
//
// Security model:
//   - OTP is generated with Node's secure crypto.randomInt.
//   - Only a bcrypt HASH of the OTP is ever kept around (in the stateless
//     signup flow it rides inside the signed verification token — never a DB).
//   - OTP expires after OTP_TTL_MS (10 minutes).
//   - A failed verification increments verificationAttempts (carried in the
//     re-signed token); after MAX_VERIFY_ATTEMPTS the user must sign up again.
//   - Resending invalidates the previous OTP and enforces a cooldown
//     (RESEND_COOLDOWN_MS = 60 seconds), tracked via the token's otpIssuedAt.

import bcrypt from "bcryptjs";

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
export const MAX_VERIFY_ATTEMPTS = 5;

/**
 * Verifies a submitted OTP against the stored bcrypt hash.
 * Returns a boolean — never exposes the plaintext OTP.
 */
export async function isOtpValid(otp, storedHash) {
  if (!storedHash) return false;
  try {
    return await bcrypt.compare(otp, storedHash);
  } catch {
    return false;
  }
}

/**
 * Whether a resend request is still inside the cooldown window.
 * @returns {{ allowed: boolean, retryAfterMs: number }}
 */
export function resendCooldown(sentAt) {
  if (!sentAt) return { allowed: true, retryAfterMs: 0 };
  const elapsed = Date.now() - new Date(sentAt).getTime();
  if (elapsed >= RESEND_COOLDOWN_MS) return { allowed: true, retryAfterMs: 0 };
  return { allowed: false, retryAfterMs: RESEND_COOLDOWN_MS - elapsed };
}