import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(RESEND_API_KEY);
  return resend;
}

/**
 * Send a weekly digest email to a user.
 */
export async function sendDigestEmail(
  to: string,
  digest: string,
): Promise<{ success: boolean; error?: string }> {
  const client = getResend();
  if (!client) return { success: false, error: "Resend not configured" };

  try {
    await client.emails.send({
      from: "PRISM <digest@prism-app.com>",
      to,
      subject: "Your PRISM Weekly Digest",
      html: `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #0F1114; color: #EDEDEF; padding: 32px;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 700; letter-spacing: 2px;">PRISM</span>
            <span style="display: block; width: 80px; height: 3px; background: linear-gradient(90deg, #3B82F6, #A855F7, #F59E0B, #22C55E, #06B6D4, #F97316); margin-top: 8px; border-radius: 2px;"></span>
          </div>
          <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #D4956B;">Weekly Digest</h1>
          <div style="white-space: pre-line; line-height: 1.65; font-size: 15px; color: #9CA3AF;">
            ${digest.replace(/\n/g, "<br>")}
          </div>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #262A31;">
            <a href="https://web-liard-psi-12.vercel.app/feed" style="color: #D4956B; text-decoration: none; font-size: 14px; font-weight: 500;">
              Open PRISM →
            </a>
          </div>
          <p style="font-size: 11px; color: #5C6370; margin-top: 24px;">
            You're receiving this because you have email digests enabled in your PRISM settings.
            <a href="https://web-liard-psi-12.vercel.app/settings" style="color: #5C6370; text-decoration: underline;">Unsubscribe</a>
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
