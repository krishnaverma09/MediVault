const { expect } = require("@playwright/test");

class DashboardPage {
  constructor(page) {
    this.page = page;
  }

  async expectLoaded(userName) {
    await expect(this.page.getByRole("heading", { name: new RegExp(`Welcome,\\s*${userName}`) })).toBeVisible();
  }

  async openUploadDocument() {
    await this.page.getByRole("button", { name: "Upload & Share Document" }).click();
  }

  async openEmergencyAccess() {
    await this.page.getByRole("button", { name: "Emergency Access" }).click();
  }

  async logout() {
    await this.page.getByRole("button", { name: "Logout" }).click();
  }
}

module.exports = DashboardPage;
