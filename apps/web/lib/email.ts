import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL ?? "noreply@goaltrack.app";
const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendActivationEmail(
  email: string,
  token: string
): Promise<void> {
  console.log(
    `[email] Activation link for ${email}: ${appUrl}/activate?token=${token}`
  );
  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: "Activate your GoalTrack account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Activate your account</h2>
        <p>Click the button below to verify your email and activate your GoalTrack account.</p>
        <a href="${appUrl}/activate?token=${token}"
           style="display:inline-block;background:#0284c7;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
          Activate Account
        </a>
        <p style="color:#6b7280;font-size:13px;margin-top:16px">This link expires in 24 hours.</p>
      </div>
    `,
  });
}

export async function sendDeregistrationEmail(
  email: string,
  token: string
): Promise<void> {
  console.log(
    `[email] Deregistration link for ${email}: ${appUrl}/deregister/confirm?token=${token}`
  );
  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: "Confirm your GoalTrack account deletion",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Delete your account</h2>
        <p>We received a request to permanently delete your GoalTrack account and all associated data.</p>
        <p>Click the button below to confirm. <strong>This action cannot be undone.</strong></p>
        <a href="${appUrl}/deregister/confirm?token=${token}"
           style="display:inline-block;background:#dc2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
          Delete My Account
        </a>
        <p style="color:#6b7280;font-size:13px;margin-top:16px">This link expires in 1 hour. If you did not request this, ignore this email — your account will remain active.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  console.log(
    `[email] Password reset link for ${email}: ${appUrl}/reset-password?token=${token}`
  );
  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: "Reset your GoalTrack password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Reset your password</h2>
        <p>Click the button below to set a new password for your GoalTrack account.</p>
        <a href="${appUrl}/reset-password?token=${token}"
           style="display:inline-block;background:#0284c7;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#6b7280;font-size:13px;margin-top:16px">This link expires in 1 hour. If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}
