import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FALLBACK_COMPARISON_COLOR = "#D4956B";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(RESEND_API_KEY);
  return resend;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeHexColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : FALLBACK_COMPARISON_COLOR;
}

function sanitizeEmailSubject(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

type DigestComparison = {
  topicTitle: string;
  topicSlug: string;
  perspectives: { quote: string; communityName: string; color: string }[];
};

export function buildDigestEmailPayload(
  digest: string,
  appUrl: string,
  comparison?: DigestComparison | null,
): { subject: string; html: string } {
  const safeDigestHtml = escapeHtml(digest).replace(/\n/g, "<br>");
  const safeAppUrl = appUrl.replace(/\/+$/, "");

  const safeComparison = comparison
    ? {
        topicTitleText: sanitizeEmailSubject(comparison.topicTitle),
        topicTitleHtml: escapeHtml(comparison.topicTitle),
        topicSlug: encodeURIComponent(comparison.topicSlug),
        perspectives: comparison.perspectives.map((item) => ({
          quote: escapeHtml(item.quote),
          communityName: escapeHtml(item.communityName),
          color: sanitizeHexColor(item.color),
        })),
      }
    : null;

  const comparisonHtml = safeComparison ? `
    <div style="margin: 24px 0; padding: 20px; border-radius: 12px; background: #181B20; border: 1px solid #262A31;">
      <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #D4956B; margin: 0 0 6px 0;">Same topic &middot; Different worlds</p>
      <h2 style="font-size: 16px; font-weight: 700; margin: 0 0 16px 0; color: #EDEDEF;">${safeComparison.topicTitleHtml}</h2>
      ${safeComparison.perspectives.map((p) => `
        <div style="padding: 12px 0 12px 16px; border-left: 3px solid ${p.color}; margin-bottom: 12px;">
          <p style="font-size: 11px; font-weight: 600; color: #9CA3AF; margin: 0 0 4px 0;">${p.communityName}</p>
          <p style="font-size: 14px; color: #EDEDEF; margin: 0; line-height: 1.5;">&ldquo;${p.quote}&rdquo;</p>
        </div>
      `).join("")}
      <a href="${safeAppUrl}/compare/${safeComparison.topicSlug}" style="display: inline-block; margin-top: 8px; color: #D4956B; text-decoration: none; font-size: 13px; font-weight: 500;">
        See the full comparison &rarr;
      </a>
    </div>
  ` : "";

  const subject = safeComparison
    ? sanitizeEmailSubject(`This week on PRISM: ${safeComparison.topicTitleText}`)
    : "Your PRISM Weekly Digest";

  const html = `
    <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #0F1114; color: #EDEDEF; padding: 32px;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 700; letter-spacing: 2px;">PRISM</span>
        <span style="display: block; width: 80px; height: 3px; background: linear-gradient(90deg, #3B82F6, #A855F7, #F59E0B, #22C55E, #06B6D4, #F97316); margin-top: 8px; border-radius: 2px;"></span>
      </div>
      ${comparisonHtml}
      <div style="white-space: pre-line; line-height: 1.65; font-size: 15px; color: #9CA3AF;">
        ${safeDigestHtml}
      </div>
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #262A31;">
        <a href="${safeAppUrl}/feed" style="color: #D4956B; text-decoration: none; font-size: 14px; font-weight: 500;">
          Open PRISM &rarr;
        </a>
      </div>
      <p style="font-size: 11px; color: #5C6370; margin-top: 24px;">
        You're receiving this because you have email digests enabled in your PRISM settings.
        <a href="${safeAppUrl}/settings" style="color: #5C6370; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  `;

  return { subject, html };
}

/**
 * Send a weekly digest email to a user, optionally featuring a perspective comparison.
 */
export async function sendDigestEmail(
  to: string,
  digest: string,
  comparison?: {
    topicTitle: string;
    topicSlug: string;
    perspectives: { quote: string; communityName: string; color: string }[];
  } | null,
): Promise<{ success: boolean; error?: string }> {
  const client = getResend();
  if (!client) return { success: false, error: "Resend not configured" };

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://web-liard-psi-12.vercel.app";
  const payload = buildDigestEmailPayload(digest, appUrl, comparison);

  try {
    await client.emails.send({
      from: "PRISM <digest@prism-app.com>",
      to,
      subject: payload.subject,
      html: payload.html,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
