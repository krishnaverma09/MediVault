const { expect } = require("@playwright/test");

class LoginPage {
  constructor(page) {
    this.page = page;
  }

  async gotoLogin() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  }

  async gotoSignup() {
    await this.page.goto("/signup");
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.page.getByRole("heading", { name: /create your account/i })).toBeVisible();
  }

  async signup({ name, email, password, role = "patient" }) {
    await this.gotoSignup();
    await this.selectRole(role);

    await this.page.getByPlaceholder("Jane Doe").fill(name);
    await this.page.getByPlaceholder("you@example.com").fill(email);
    await this.page.getByPlaceholder("••••••••").fill(password);

    await Promise.all([
      this.page.waitForURL(/\/login$/, { waitUntil: "domcontentloaded" }),
      this.page.getByRole("button", { name: /^Create Account$/ }).click(),
    ]);
  }

  async login(email, password) {
    await this.gotoLogin();
    await this.page.getByPlaceholder("you@example.com").fill(email);
    await this.page.getByPlaceholder("••••••••").fill(password);

    await Promise.all([
      this.page.waitForURL(/\/dashboard$/, { waitUntil: "domcontentloaded" }),
      this.page.getByRole("button", { name: /^Sign In$/ }).click(),
    ]);
  }

  async selectRole(role) {
    const normalizedRole = role === "doctor" ? "Doctor" : "Patient";
    await this.page.getByRole("button", { name: new RegExp(`^${normalizedRole}\\b`, "i") }).click();
  }
}

module.exports = LoginPage;
