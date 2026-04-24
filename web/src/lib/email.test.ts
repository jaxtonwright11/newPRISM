import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmailMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: sendEmailMock,
    };
  },
}));

describe("sendDigestEmail", () => {
  beforeEach(() => {
    sendEmailMock.mockReset();
    process.env.RESEND_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.prism.app";
    vi.resetModules();
  });

  it("escapes comparison content before rendering HTML email", async () => {
    sendEmailMock.mockResolvedValue({});

    const { sendDigestEmail } = await import("./email");
    await sendDigestEmail("user@example.com", "Digest <b>text</b>", {
      topicTitle: `Topic"><img src=x onerror=alert(1)>`,
      topicSlug: `topic"><svg/onload=alert(1)>`,
      perspectives: [
        {
          quote: `<a href="https://evil.test">Click me</a>`,
          communityName: `Community<script>alert(1)</script>`,
          color: "javascript:alert(1)",
        },
      ],
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const payload = sendEmailMock.mock.calls[0][0] as { subject: string; html: string };

    expect(payload.subject).toContain(`Topic"><img src=x onerror=alert(1)>`);

    expect(payload.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(payload.html).toContain("Community&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(payload.html).toContain("&lt;a href=&quot;https://evil.test&quot;&gt;Click me&lt;/a&gt;");
    expect(payload.html).toContain("Digest &lt;b&gt;text&lt;/b&gt;");
    expect(payload.html).toContain("/compare/topic%22%3E%3Csvg%2Fonload%3Dalert(1)%3E");
    expect(payload.html).toContain("border-left: 3px solid #D4956B");
    expect(payload.html).not.toContain("<script>");
    expect(payload.html).not.toContain("<img src=x onerror=alert(1)>");
  });
});
