// HTML email templates used by the mail service.
//
// The emails are inline-styled and responsive so they render correctly in
// Gmail, Outlook, Apple Mail and mobile clients. No credentials or OTP values
// are ever logged — the OTP is only injected into the rendered HTML string
// that is sent straight to the transporter.

const APP_NAME = "Foodie";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Human-readable local expiry label, e.g. "9:45 AM on 10 September". */
export function formatExpiry(date) {
  if (!date) return "a few minutes";
  const d = new Date(date);
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  const hours = d.getHours() % 12 || 12;
  return `${hours}:${mins} ${ampm} on ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/**
 * Email verification OTP template.
 * @param {{ name: string, otp: string, expiresAt: Date }} opts
 */
export function buildVerificationOtpEmail({ name, otp, expiresAt }) {
  const greeting = name ? name.trim() : "there";
  const expiresLabel = formatExpiry(expiresAt);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#ef4444);padding:28px 24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">${APP_NAME}</h1>
              <p style="margin:4px 0 0;color:#fff7ed;font-size:13px;">Food Delivery &amp; More</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 28px;">
              <h2 style="margin:0 0 6px;color:#111827;font-size:18px;">Verify Your Email</h2>
              <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
                Hello <strong>${escapeHtml(greeting)}</strong>,
              </p>
              <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
                Thank you for creating an account. Please confirm your email address by
                entering the 6-digit verification code below.
              </p>
              <!-- OTP code box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:#fff7ed;border:1px dashed #f97316;border-radius:10px;padding:22px 16px;">
                    <span style="font-family:Consolas,Menlo,monospace;font-size:34px;font-weight:700;letter-spacing:8px;color:#ea580c;">${escapeHtml(otp)}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
                This code expires in <strong>10 minutes</strong> (before ${expiresLabel}).
                If it does not work, use the "Resend" option on the verification page.
              </p>
            </td>
          </tr>
          <!-- Security notice -->
          <tr>
            <td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 6px;color:#6b7280;font-size:12px;line-height:1.6;">
                <strong>Security notice:</strong> Never share this code with anyone.
                Our team will never ask you for your verification code or password.
              </p>
              <p style="margin:0 0 6px;color:#6b7280;font-size:12px;line-height:1.6;">
                If you did not create an account with ${APP_NAME}, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:18px 28px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                <br />This is an automated message, please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[ch],
  );
}