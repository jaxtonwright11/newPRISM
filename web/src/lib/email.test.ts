import { beforeEach, describe, expect, it, vi } from "vitest";

const resendMock = vi.hoisted(() => ({
  send: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: resendMock.send,
    },
  })),
}));

describe("sendDigestEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    resendMock.send.mockReset();
    resendMock.send.mockResolvedValue({ id: "email_123" });
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example/";
  });

  it("escapes stored comparison and digest content before rendering HTML", async () => {
    const { sendDigestEmail } = await import("./email");

    const result = await sendDigestEmail(
      "user@example.com",
      "Digest intro <img src=x onerror=alert(1)>\nSecond & line",
      {
        topicTitle: "Housing <script>alert(\"x\")</script>\r\nBcc: attacker@example.com",
        topicSlug: "housing & rent",
        perspectives: [
          {
            communityName: "Renters <b>Union</b>",
            quote: "We need <strong>safe</strong> homes & fair rent.",
            color: "red; background: url(https://attacker.example)",
          },
        ],
      },
    );

    expect(result).toEqual({ success: true });
    const payload = resendMock.send.mock.calls[0][0];

    expect(payload.subject).toBe(
      "This week on PRISM: Housing <script>alert(\"x\")</script> Bcc: attacker@example.com",
    );
    expect(payload.html).toContain("Housing &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(payload.html).toContain("Renters &lt;b&gt;Union&lt;/b&gt;");
    expect(payload.html).toContain("We need &lt;strong&gt;safe&lt;/strong&gt; homes &amp; fair rent.");
    expect(payload.html).toContain("Digest intro &lt;img src=x onerror=alert(1)&gt;<br>");
    expect(payload.html).toContain("Second &amp; line");
    expect(payload.html).toContain('href="https://prism.example/compare/housing%20%26%20rent"');
    expect(payload.html).toContain("border-left: 3px solid #D4956B;");
    expect(payload.html).not.toContain("<script>");
    expect(payload.html).not.toContain("<img src=x");
    expect(payload.html).not.toContain("background: url");
  });

  it("preserves valid community colors in comparison cards", async () => {
    const { sendDigestEmail } = await import("./email");

    await sendDigestEmail("user@example.com", "Weekly update", {
      topicTitle: "Safe streets",
      topicSlug: "safe-streets",
      perspectives: [
        {
          communityName: "Cyclists",
          quote: "Protected lanes help.",
          color: "#22C55E",
        },
      ],
    });

    const payload = resendMock.send.mock.calls[0][0];
    expect(payload.html).toContain("border-left: 3px solid #22C55E;");
  });
});
