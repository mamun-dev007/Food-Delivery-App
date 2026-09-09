// Stateless signup session signing.
//
// Signup is fully stateless: no document is written to ANY database until the
// email OTP has been verified. Everything needed at verification time (the
// signup payload + the bcrypt hash of the OTP) is carried in a short-lived
// HMAC-SHA256 (HS256) JWT handed to the client.
//
//   signup  -> verifySignupToken response includes the signed token
//   verify  -> the token is returned; on success the REAL account is created
//   resend  -> a fresh OTP + freshly signed token are issued
//
// Because nothing is persisted, an unverified email leaves no record anywhere
// and can simply be used to sign up again.

import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OTP_TTL_MS } from "./otp.service.js";

const TOKEN_TTL_SECONDS = OTP_TTL_MS / 1000;

function getSecret() {
  const secret = process.env.AUTH_SIGNUP_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error(
      "AUTH_SIGNUP_SECRET is not configured. Set it in backend/.env",
    );
    err.status = 500;
    throw err;
  }
  return secret;
}

/** Generate a cryptographically random 6-digit OTP. */
export function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** bcrypt-hash an OTP so plaintext codes are never stored. */
export async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

/**
 * Sign a verification token carrying { ...signupPayload, otpHash, attempts,
 * otpIssuedAt }. The JWT expires after OTP_TTL_MS (10 minutes). iat/exp from a
 * previously decoded token are stripped so re-signing (attempt counter,
 * resend) works without jsonwebtoken complaining about a duplicate exp claim.
 */
export function signSignupToken(payload) {
  const { iat, exp, ...clean } = payload;
  return jwt.sign(clean, getSecret(), { expiresIn: TOKEN_TTL_SECONDS });
}

/**
 * Verify a signup token's signature + expiry and return its payload.
 * Throws { status: 400, code: "SIGNUP_TOKEN_INVALID" } on any failure.
 */
export function verifySignupToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    const err = new Error(
      "This verification session has expired. Please sign up again.",
    );
    err.status = 400;
    err.code = "SIGNUP_TOKEN_INVALID";
    throw err;
  }
}