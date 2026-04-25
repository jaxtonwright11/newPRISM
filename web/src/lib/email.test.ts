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
      topicTitle: `Topic"><img src=x onerror=alert(1)>\r\nBcc: attacker@example.com`,
      topicSlug: `topic"><svg/onload=alert(1)>`,
      perspectives: [
        {
          quote: `<a href="https://evil.test">Click me</a>`,
          communityName: `Community<script>alert(1)</script>`,
          color: "javascript:alert(1)",
        },
        {
          quote: `Second quote`,
          communityName: `Second community`,
          color: "#AABBCC",
        },
      ],
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const payload = sendEmailMock.mock.calls[0][0] as { subject: string; html: string };

    expect(payload.subject).toContain(`Topic"><img src=x onerror=alert(1)>`);
    expect(payload.subject).not.toMatch(/[\r\n]/);
    expect(payload.subject).toContain("Bcc: attacker@example.com");
    expect(payload.subject).not.toContain("\r");
    expect(payload.subject).not.toContain("\n");

    expect(payload.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(payload.html).toContain("Bcc: attacker@example.com");
    expect(payload.html).toContain("Community&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(payload.html).toContain("&lt;a href=&quot;https://evil.test&quot;&gt;Click me&lt;/a&gt;");
    expect(payload.html).toContain("Digest &lt;b&gt;text&lt;/b&gt;");
    expect(payload.html).toContain("/compare/topic%22%3E%3Csvg%2Fonload%3Dalert(1)%3E");
    expect(payload.html).toContain("border-left: 3px solid #D4956B");
    expect(payload.html).toContain("border-left: 3px solid #AABBCC");
    expect(payload.html).not.toContain("<script>");
    expect(payload.html).not.toContain("<img src=x onerror=alert(1)>");
  });

  it("strips header breaks from subjects and rejects CSS injection colors", async () => {
    sendEmailMock.mockResolvedValue({});

    const { sendDigestEmail } = await import("./email");
    await sendDigestEmail("user@example.com", "Digest", {
      topicTitle: "Weekly topic\r\nBcc: attacker@example.com",
      topicSlug: "weekly-topic",
      perspectives: [
        {
          quote: "Safe quote",
          communityName: "Safe community",
          color: "#fff;background:url(https://evil.test/pixel)",
        },
        {
          quote: "Another safe quote",
          communityName: "Another safe community",
          color: "#AABBCC",
        },
      ],
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const payload = sendEmailMock.mock.calls[0][0] as { subject: string; html: string };

    expect(payload.subject).toBe("This week on PRISM: Weekly topic Bcc: attacker@example.com");
    expect(payload.subject).not.toMatch(/[\r\n]/);
    expect(payload.html).toContain("border-left: 3px solid #D4956B");
    expect(payload.html).toContain("border-left: 3px solid #AABBCC");
    expect(payload.html).not.toContain("background:url");
  });
});
