import { chromium } from "@playwright/test";

/**
 * Pre-visit key pages to warm up Next.js dev server compilation.
 * Without this, parallel tests fight over cold compilation and time out.
 */
async function globalSetup() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const warmupRoutes = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/feed",
    "/discover",
    "/map",
    "/create",
    "/landing",
    "/search",
    "/admin",
    "/insights",
    "/auth/callback",
  ];

  for (const route of warmupRoutes) {
    try {
      const start = Date.now();
      await page.goto(`${baseURL}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      console.log(`  Warmed ${route} in ${Date.now() - start}ms`);
    } catch {
      // Page may redirect or error — that's fine, we just need the compilation
      console.log(`  Warmed ${route} (redirected/errored — compilation done)`);
    }
  }

  await browser.close();
}

export default globalSetup;
