const { expect } = require("@playwright/test");

class DashboardPage {
  constructor(page) {
    this.page = page;
  }

  async expectLoaded(userName) {
    const firstName = userName.split(" ")[0];
    await expect(this.page.getByText(new RegExp(`Welcome,\\s*${firstName}`, "i"))).toBeVisible();
    await expect(this.page.getByRole("link", { name: /dashboard/i })).toBeVisible();
  }

  async openUploadDocument() {
    await Promise.all([
      this.page.waitForURL(/\/documents\/upload$/, { waitUntil: "domcontentloaded" }),
      this.page.getByRole("button", { name: /upload record/i }).click(),
    ]);
    await expect(this.page.getByText("Upload & Share Document")).toBeVisible();
  }

  async openEmergencyAccess() {
    await Promise.all([
      this.page.waitForURL(/\/emergency-access$/, { waitUntil: "domcontentloaded" }),
      this.page.getByRole("link", { name: /emergency qr/i }).click(),
    ]);
    await expect(this.page.getByText("Emergency QR Code")).toBeVisible();
  }

  async logout() {
    await Promise.all([
      this.page.waitForURL(/\/login$/, { waitUntil: "domcontentloaded" }),
      this.page.getByRole("button", { name: /logout/i }).click(),
    ]);
  }
}

module.exports = DashboardPage;
