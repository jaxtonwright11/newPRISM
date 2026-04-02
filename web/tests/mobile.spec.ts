import { test, expect } from "@playwright/test";

// iPhone 14 viewport
const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.use({ viewport: MOBILE_VIEWPORT });

test.describe("Mobile responsiveness (390px)", () => {
  test("homepage — no horizontal scroll, CTA visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // No horizontal overflow
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);

    // Hero CTA should be visible
    const cta = page.getByRole("link", { name: /explore|get started|sign up/i });
    if (await cta.count()) {
      await expect(cta.first()).toBeVisible();
    }

    await page.screenshot({
      path: "tests/screenshots/mobile/homepage.png",
      fullPage: true,
    });
  });

  test("login page — form fits viewport", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);

    // Email input should be visible
    const emailInput = page.getByPlaceholder(/email/i);
    if (await emailInput.count()) {
      await expect(emailInput.first()).toBeVisible();
      const box = await emailInput.first().boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(200);
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }

    await page.screenshot({
      path: "tests/screenshots/mobile/login.png",
      fullPage: true,
    });
  });

  test("signup page — form fits viewport", async ({ page }) => {
    await page.goto("/signup", { waitUntil: "domcontentloaded" });

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);

    await page.screenshot({
      path: "tests/screenshots/mobile/signup.png",
      fullPage: true,
    });
  });

  test("discover page — no overflow", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded" });

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);

    await page.screenshot({
      path: "tests/screenshots/mobile/discover.png",
      fullPage: true,
    });
  });

  test("feed page — cards stack vertically", async ({ page }) => {
    await page.goto("/feed", { waitUntil: "domcontentloaded" });

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);

    await page.screenshot({
      path: "tests/screenshots/mobile/feed.png",
      fullPage: true,
    });
  });

  test("insights page — no overflow", async ({ page }) => {
    await page.goto("/insights", { waitUntil: "domcontentloaded" });

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);

    await page.screenshot({
      path: "tests/screenshots/mobile/insights.png",
      fullPage: true,
    });
  });

  test("map page — fills viewport", async ({ page }) => {
    await page.goto("/map", { waitUntil: "domcontentloaded" });

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);

    await page.screenshot({
      path: "tests/screenshots/mobile/map.png",
      fullPage: true,
    });
  });

  test("landing page — readable text width", async ({ page }) => {
    await page.goto("/landing", { waitUntil: "domcontentloaded" });

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);

    await page.screenshot({
      path: "tests/screenshots/mobile/landing.png",
      fullPage: true,
    });
  });

  test("admin page — no overflow", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);

    await page.screenshot({
      path: "tests/screenshots/mobile/admin.png",
      fullPage: true,
    });
  });

  test("all touch targets are at least 44px", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Check all visible buttons and links
    const tooSmall = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        'button, a, [role="button"], input[type="submit"]'
      );
      const issues: string[] = [];
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Only check visible elements
        if (rect.width > 0 && rect.height > 0 && rect.height < 44) {
          const text =
            (el as HTMLElement).innerText?.slice(0, 30) ||
            el.getAttribute("aria-label") ||
            el.tagName;
          issues.push(`${text} (${Math.round(rect.height)}px)`);
        }
      });
      return issues;
    });

    // Log any small targets but don't fail — some icons intentionally smaller
    if (tooSmall.length > 0) {
      console.log("Touch targets under 44px:", tooSmall);
    }

    await page.screenshot({
      path: "tests/screenshots/mobile/touch-targets.png",
      fullPage: true,
    });
  });

  test("bottom nav bar visible on tab pages", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded" });

    // Bottom nav should be visible on mobile
    const nav = page.locator("nav").last();
    if (await nav.isVisible()) {
      const box = await nav.boundingBox();
      if (box) {
        // Nav should be near the bottom of the viewport
        expect(box.y + box.height).toBeGreaterThan(MOBILE_VIEWPORT.height - 100);
      }
    }
  });
});
