import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = {
      send: sendMock,
    };
  },
}));

describe("sendDigestEmail", () => {
  beforeEach(() => {
    sendMock.mockReset();
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.test";
  });

  it("escapes comparison and digest content before rendering HTML", async () => {
    vi.resetModules();
    const { sendDigestEmail } = await import("./email");

    const result = await sendDigestEmail(
      "user@example.com",
      "Digest <script>alert('xss')</script>\nLine 2",
      {
        topicTitle: "Topic <img src=x onerror=alert(1)>",
        topicSlug: "topic/with?query",
        perspectives: [
          {
            quote: "\"><script>alert(2)</script>",
            communityName: "Community <b>unsafe</b>",
            color: "red; background:url(javascript:alert(1))",
          },
        ],
      },
    );

    expect(result).toEqual({ success: true });
    expect(sendMock).toHaveBeenCalledTimes(1);

    const payload = sendMock.mock.calls[0]?.[0] as { html: string; subject: string };
    expect(payload.subject).toBe("This week on PRISM: Topic <img src=x onerror=alert(1)>");
    expect(payload.html).toContain("Digest &lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;<br>Line 2");
    expect(payload.html).toContain("Topic &lt;img src=x onerror=alert(1)&gt;");
    expect(payload.html).toContain("Community &lt;b&gt;unsafe&lt;/b&gt;");
    expect(payload.html).toContain("&quot;&gt;&lt;script&gt;alert(2)&lt;/script&gt;");
    expect(payload.html).not.toContain("<script>");
    expect(payload.html).toContain("border-left: 3px solid #D4956B;");
    expect(payload.html).toContain("https://prism.test/compare/topic%2Fwith%3Fquery");
  });

  it("strips newline characters from email subject", async () => {
    vi.resetModules();
    const { sendDigestEmail } = await import("./email");

    await sendDigestEmail("user@example.com", "Digest", {
      topicTitle: "Line one\nLine two\r\nLine three",
      topicSlug: "slug",
      perspectives: [],
    });

    const payload = sendMock.mock.calls[0]?.[0] as { subject: string };
    expect(payload.subject).toBe("This week on PRISM: Line one Line two Line three");
  });
});
