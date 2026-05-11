import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendEmailMock = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return {
    emails: {
      send: sendEmailMock,
    },
    };
  }),
}));

type SentEmail = {
  subject: string;
  html: string;
};

describe("sendDigestEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "test-resend-key");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://prism.example");
    sendEmailMock.mockResolvedValue({ id: "email_123" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("escapes digest and comparison content before rendering HTML", async () => {
    const { sendDigestEmail } = await import("./email");

    const result = await sendDigestEmail(
      "reader@example.com",
      "Weekly <script>alert(1)</script>\nUse & learn",
      {
        topicTitle: "Transit <img src=x onerror=alert(1)>\r\nBcc: attacker@example.com",
        topicSlug: "transit & safety",
        perspectives: [
          {
            communityName: "Riders <b>Downtown</b>",
            quote: "It is <unsafe> & overlooked",
            color: "url(javascript:alert(1))",
          },
        ],
      }
    );

    expect(result.success).toBe(true);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    const sentEmail = sendEmailMock.mock.calls[0]?.[0] as SentEmail | undefined;
    if (!sentEmail) throw new Error("Expected email send arguments");

    expect(sentEmail.subject).toBe(
      "This week on PRISM: Transit <img src=x onerror=alert(1)> Bcc: attacker@example.com"
    );
    expect(sentEmail.html).toContain("Transit &lt;img src=x onerror=alert(1)&gt;");
    expect(sentEmail.html).toContain("Riders &lt;b&gt;Downtown&lt;/b&gt;");
    expect(sentEmail.html).toContain("&ldquo;It is &lt;unsafe&gt; &amp; overlooked&rdquo;");
    expect(sentEmail.html).toContain(
      "Weekly &lt;script&gt;alert(1)&lt;/script&gt;<br>Use &amp; learn"
    );
    expect(sentEmail.html).toContain("border-left: 3px solid #D4956B");
    expect(sentEmail.html).toContain("https://prism.example/compare/transit%20%26%20safety");
    expect(sentEmail.html).not.toContain("<script>alert(1)</script>");
    expect(sentEmail.html).not.toContain("url(javascript:alert(1))");
  });
});
