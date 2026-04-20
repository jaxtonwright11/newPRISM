import { beforeEach, describe, expect, it, vi } from "vitest";

const sendSpy = vi.fn(async () => ({}));

vi.mock("resend", () => {
  class Resend {
    emails = {
      send: sendSpy,
    };
  }

  return { Resend };
});

describe("sendDigestEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    sendSpy.mockClear();
    process.env.RESEND_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_SITE_URL = "https://prism.example";
  });

  it("escapes untrusted comparison and digest content in email HTML", async () => {
    const { sendDigestEmail } = await import("./email");

    const result = await sendDigestEmail(
      "user@example.com",
      "Digest line 1\n<script>alert('xss')</script>",
      {
        topicTitle: "Topic <img src=x onerror=alert(1)>",
        topicSlug: "topic slug/../?q=<script>",
        perspectives: [
          {
            quote: "<a href='https://evil.example'>click</a>",
            communityName: "<b>Injected</b>",
            color: "url(javascript:alert(1))",
          },
        ],
      }
    );

    expect(result).toEqual({ success: true });
    expect(sendSpy).toHaveBeenCalledTimes(1);

    const payload = sendSpy.mock.calls[0][0] as { subject: string; html: string };
    expect(payload.subject).toBe("This week on PRISM: Topic <img src=x onerror=alert(1)>");

    expect(payload.html).toContain("Topic &lt;img src=x onerror=alert(1)&gt;");
    expect(payload.html).toContain("&lt;b&gt;Injected&lt;/b&gt;");
    expect(payload.html).toContain("&lt;a href=&#39;https://evil.example&#39;&gt;click&lt;/a&gt;");
    expect(payload.html).toContain("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");

    expect(payload.html).not.toContain("<script>alert('xss')</script>");
    expect(payload.html).toContain("border-left: 3px solid #D4956B");
    expect(payload.html).toContain("/compare/topic%20slug%2F..%2F%3Fq%3D%3Cscript%3E");
  });

  it("strips CRLF from subject to prevent header injection", async () => {
    const { sendDigestEmail } = await import("./email");

    await sendDigestEmail("user@example.com", "digest", {
      topicTitle: "Weekly topic\r\nBcc: victim@example.com",
      topicSlug: "weekly-topic",
      perspectives: [],
    });

    const payload = sendSpy.mock.calls[0][0] as { subject: string };
    expect(payload.subject).toBe("This week on PRISM: Weekly topic Bcc: victim@example.com");
    expect(payload.subject).not.toContain("\r");
    expect(payload.subject).not.toContain("\n");
  });
});
