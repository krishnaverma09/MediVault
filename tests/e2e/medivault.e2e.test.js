const { test, expect } = require("@playwright/test");
const LoginPage = require("../pageObjects/LoginPage");
const DashboardPage = require("../pageObjects/DashboardPage");
const E2EMockApiRouter = require("../helpers/registerE2EMockRoutes");

test.describe("MediVault E2E", () => {
  test.beforeEach(async ({ page }) => {
    const mockApiRouter = new E2EMockApiRouter(page);
    await mockApiRouter.register();
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test("User signup", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.signup({
      name: "Patient Zero",
      email: "patient@medivault.test",
      password: "Password123!",
      role: "patient",
    });

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("User login and view dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.login("patient@medivault.test", "Password123!");

    await expect(page).toHaveURL(/\/dashboard$/);
    await dashboardPage.expectLoaded("Patient Zero");
    await expect(page.getByText("Recent records")).toBeVisible();
    await expect(page.getByText("baseline-report.pdf")).toBeVisible();
  });

  test("Upload medical report", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.login("patient@medivault.test", "Password123!");
    await dashboardPage.openUploadDocument();

    await expect(page).toHaveURL(/\/documents\/upload$/);
    await expect(page.getByText("Upload & Share Document")).toBeVisible();
    await page.setInputFiles("#fileInputDocs", {
      name: "report.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("sample report"),
    });

    await page.getByPlaceholder("e.g. Blood Test Report").fill("Annual Blood Test");
    await page.locator("select[multiple]").selectOption("doctor-e2e-1");
    await Promise.all([
      page.waitForURL(/\/documents$/, { waitUntil: "domcontentloaded" }),
      page.getByRole("button", { name: /^Upload & Share$/ }).click(),
    ]);

    await expect(page).toHaveURL(/\/documents$/);
    await expect(page.getByText("Mock Uploaded Document")).toBeVisible();
  });

  test("Generate emergency QR", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.login("patient@medivault.test", "Password123!");
    await dashboardPage.openEmergencyAccess();

    await expect(page).toHaveURL(/\/emergency-access$/);
    await expect(page.getByRole("button", { name: "Enable Access" })).toBeVisible();
    await page.getByRole("button", { name: "Enable Access" }).click();
    await expect(page.getByRole("button", { name: "Disable Access" })).toBeVisible();
    await page.getByPlaceholder("e.g. John Doe").fill("Patient Zero");
    await page.getByRole("button", { name: "Save Emergency Profile" }).click();

    await expect(page.getByText("Emergency profile saved successfully.")).toBeVisible();
    await expect(page.getByAltText("Emergency access QR code")).toBeVisible();
    await expect(page.getByText("Public access is currently")).toContainText("enabled");
  });

  test('Shares a record, restores saved grants and revokes access', async ({ page }) => {
    await new LoginPage(page).login('patient@medivault.test', 'Password123!');
    await page.getByRole('button', { name: 'Share this record' }).first().click();
    await page.getByPlaceholder('doctor@hospital.com').fill('missing@example.test');
    await page.getByRole('button', { name: 'Send to doctor' }).click();
    await expect(page.getByText('No doctor account found with that email')).toBeVisible();
    await page.getByPlaceholder('doctor@hospital.com').fill('doctor@medivault.test');
    await page.getByRole('button', { name: 'Send to doctor' }).click();
    await expect(page.locator('strong').filter({ hasText: 'Doctors with access' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Share this record' }).first().click();
    await expect(page.getByText('Doctor E2E (doctor@medivault.test)')).toBeVisible();
    await page.getByRole('button', { name: 'Revoke access' }).click();
    await expect(page.locator('strong').filter({ hasText: 'Doctors with access' })).not.toBeVisible();
  });

  test("Logout", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.login("patient@medivault.test", "Password123!");
    await dashboardPage.logout();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });
});
