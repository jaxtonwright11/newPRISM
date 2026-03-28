import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  // ── Signup page renders correctly ─────────────────────────────────────
  test("signup page has all required fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("text=Join PRISM")).toBeVisible();

    // Verify all form fields exist
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Verify submit button
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();

    // Verify Google OAuth button
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();

    // Verify sign-in link
    await expect(page.locator("text=Already have an account?")).toBeVisible();
  });

  // ── Signup form validation ────────────────────────────────────────────
  test("signup requires all fields filled", async ({ page }) => {
    await page.goto("/signup");

    // Try to submit empty form — HTML5 validation should prevent submission
    const submitBtn = page.getByRole("button", { name: "Create account" });
    await submitBtn.click();

    // Email field should show validation (browser-native required)
    const emailInput = page.locator("#email");
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  // ── Signup with short password shows minimum length ───────────────────
  test("signup password requires minimum 8 characters", async ({ page }) => {
    await page.goto("/signup");

    await page.locator("#email").fill("test@example.com");
    await page.locator("#username").fill("testuser");
    await page.locator("#password").fill("short");

    const submitBtn = page.getByRole("button", { name: "Create account" });
    await submitBtn.click();

    // HTML5 minLength validation
    const passwordInput = page.locator("#password");
    const isTooShort = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validity.tooShort
    );
    expect(isTooShort).toBe(true);
  });

  // ── Login page renders correctly ──────────────────────────────────────
  test("login page has all required elements", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Sign in to PRISM")).toBeVisible();

    // Form fields
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Submit button
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

    // Google OAuth
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();

    // Forgot password link
    await expect(page.locator("text=Forgot password?")).toBeVisible();

    // Sign up link
    await expect(page.locator("text=Sign up")).toBeVisible();
  });

  // ── Login with wrong password shows error ─────────────────────────────
  test("login with wrong credentials shows error", async ({ page }) => {
    await page.goto("/login");

    await page.locator("#email").fill("nonexistent@example.com");
    await page.locator("#password").fill("wrongpassword123");

    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for the error message to appear
    const errorDiv = page.locator(".bg-red-500\\/10");
    await expect(errorDiv).toBeVisible({ timeout: 10000 });

    // Should show an error message (Supabase returns "Invalid login credentials")
    const errorText = await errorDiv.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText!.length).toBeGreaterThan(0);
  });

  // ── Forgot password page ──────────────────────────────────────────────
  test("forgot password page renders and accepts email", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("text=Reset your password")).toBeVisible();
    await expect(page.locator("text=send you a link")).toBeVisible();

    // Fill email
    await page.locator("#email").fill("test@example.com");

    // Click send
    await page.getByRole("button", { name: "Send reset link" }).click();

    // Should show the "Check your email" confirmation (Supabase doesn't error for unknown emails)
    await expect(page.locator("text=Check your email")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=test@example.com")).toBeVisible();
  });

  // ── Forgot password link navigates correctly ──────────────────────────
  test("login page forgot password link works", async ({ page }) => {
    await page.goto("/login");

    await page.locator("text=Forgot password?").click();
    await page.waitForURL("**/forgot-password");

    await expect(page.locator("text=Reset your password")).toBeVisible();
  });

  // ── Middleware redirect for protected routes ──────────────────────────
  test("settings page redirects unauthenticated users to login", async ({ page }) => {
    const response = await page.goto("/settings", { waitUntil: "domcontentloaded" });

    // Middleware should redirect to /login?redirect=/settings
    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("redirect=%2Fsettings");
  });

  test("messages page redirects unauthenticated users to login", async ({ page }) => {
    const response = await page.goto("/messages", { waitUntil: "domcontentloaded" });

    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("bookmarks page redirects unauthenticated users to login", async ({ page }) => {
    const response = await page.goto("/bookmarks", { waitUntil: "domcontentloaded" });

    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("notifications page redirects unauthenticated users to login", async ({ page }) => {
    const response = await page.goto("/notifications", { waitUntil: "domcontentloaded" });

    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  // ── Public routes remain accessible ───────────────────────────────────
  test("public routes load without redirect", async ({ page }) => {
    // Map page (root) — public
    const mapRes = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(mapRes?.status()).toBeLessThan(400);
    expect(page.url()).not.toContain("/login");

    // Search — public
    const searchRes = await page.goto("/search", { waitUntil: "domcontentloaded" });
    expect(searchRes?.status()).toBeLessThan(400);
    expect(page.url()).not.toContain("/login");

    // Landing — public
    const landingRes = await page.goto("/landing", { waitUntil: "domcontentloaded" });
    expect(landingRes?.status()).toBeLessThan(400);
    expect(page.url()).not.toContain("/login");
  });

  // ── Auth callback route exists ────────────────────────────────────────
  test("auth callback route handles missing code", async ({ page }) => {
    // Requesting /auth/callback without a code should redirect to /login with error
    const response = await page.goto("/auth/callback", {
      waitUntil: "domcontentloaded",
    });

    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("error=auth_callback_failed");
  });

  // ── Login page shows callback error ───────────────────────────────────
  test("login page displays auth_callback_failed error", async ({ page }) => {
    await page.goto("/login?error=auth_callback_failed");

    await expect(page.locator("text=Sign-in failed")).toBeVisible();
  });

  // ── Signup → login navigation ─────────────────────────────────────────
  test("signup page links to login and vice versa", async ({ page }) => {
    // From signup → login
    await page.goto("/signup");
    await page.locator("text=Sign in").click();
    await page.waitForURL("**/login");
    await expect(page.locator("text=Sign in to PRISM")).toBeVisible();

    // From login → signup
    await page.locator("text=Sign up").click();
    await page.waitForURL("**/signup");
    await expect(page.locator("text=Join PRISM")).toBeVisible();
  });
});
