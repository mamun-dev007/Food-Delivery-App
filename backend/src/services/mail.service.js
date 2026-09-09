// Reusable Nodemailer + SMTP mail service.
//
// Credentials are read exclusively from environment variables:
//   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
//
// Nothing is hardcoded and the transporter is created lazily once and cached
// so repeated signups/resends reuse the same SMTP connection.

import nodemailer from "nodemailer";
import { buildVerificationOtpEmail } from "./emailTemplates.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    const err = new Error(
      "Email service is not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS in .env",
    );
    err.code = "SMTP_NOT_CONFIGURED";
    err.status = 500;
    throw err;
  }

  const port = Number(process.env.SMTP_PORT || 465);
  // Port 465 uses implicit TLS; SMTP_SECURE can also force it explicitly.
  const secure =
    port === 465 || String(process.env.SMTP_SECURE).toLowerCase() === "true";

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
}

/**
 * Send the email-verification OTP email.
 * @param {{ to: string, name: string, otp: string, expiresAt: Date }} opts
 */
export async function sendVerificationOtp({ to, name, otp, expiresAt }) {
  const t = getTransporter();
  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Verify Your Email — Foodie",
    html: buildVerificationOtpEmail({ name, otp, expiresAt }),
  });
}